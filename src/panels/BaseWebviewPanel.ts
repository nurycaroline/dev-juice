import * as vscode from 'vscode'
import { loadTemplate } from '../utils/templateLoader'

export interface PanelInit {
  /** Chave única do singleton e viewType do WebviewPanel. */
  viewType: string
  /** Título exibido na aba do painel. */
  title: string
  /** Nome do template em src/templates (sem .html). */
  template: string
}

export interface ValidatedMessage {
  command: string
  [key: string]: unknown
}

export type MessageValidation =
  | { ok: true, message: ValidatedMessage }
  | { ok: false, reason: 'not-object' | 'no-command' | 'not-whitelisted' | 'payload-too-large' }

/** Limite de tamanho para campos string de mensagens de webview. */
export const MAX_PAYLOAD_LENGTH = 100_000

/**
 * Valida uma mensagem crua recebida de um webview antes de entregá-la à lógica
 * de domínio. Função pura (sem VS Code) para ser testável isoladamente.
 *
 * SPEC_DEVIATION: a spec (ARCH-08 AC3) fala em "payload que não é string".
 * Aplicamos o limite de 100k a todo campo string, mas NÃO rejeitamos campos
 * não-string, pois protocolos legítimos (ex.: gerador de senha) enviam números
 * e booleanos. Rejeitar qualquer não-string quebraria ferramentas existentes.
 * Reason: preservar comportamento das ferramentas enquanto se aplica o cap de tamanho.
 */
export function validateWebviewMessage (
  raw: unknown,
  whitelist: readonly string[]
): MessageValidation {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'not-object' }
  }
  const msg = raw as Record<string, unknown>
  if (typeof msg.command !== 'string' || msg.command.length === 0) {
    return { ok: false, reason: 'no-command' }
  }
  if (!whitelist.includes(msg.command)) {
    return { ok: false, reason: 'not-whitelisted' }
  }
  for (const value of Object.values(msg)) {
    if (typeof value === 'string' && value.length > MAX_PAYLOAD_LENGTH) {
      return { ok: false, reason: 'payload-too-large' }
    }
  }
  return { ok: true, message: msg as ValidatedMessage }
}

type BaseWebviewPanelCtor = new (
  panel: vscode.WebviewPanel,
  extensionUri: vscode.Uri
) => BaseWebviewPanel

/**
 * Ciclo de vida unificado de webviews: singleton por viewType, reveal, dispose,
 * carregamento de HTML via loadTemplate (CSP + nonce) e dispatcher de mensagens
 * validado. Painéis declarativos usam a base diretamente; ferramentas com lógica
 * no host estendem a base sobrescrevendo `messageWhitelist` e `onMessage`.
 */
export class BaseWebviewPanel {
  private static readonly panels = new Map<string, BaseWebviewPanel>()

  protected readonly _panel: vscode.WebviewPanel
  protected readonly _extensionUri: vscode.Uri
  private readonly _disposables: vscode.Disposable[] = []
  private _viewType = ''
  private _disposed = false

  constructor (panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._extensionUri = extensionUri
  }

  /**
   * Cria o painel da ferramenta ou revela o existente (singleton por viewType).
   * @param ctor Construtor da subclasse; ausente → painel declarativo (base direta).
   */
  public static createOrShow (
    init: PanelInit,
    extensionUri: vscode.Uri,
    ctor?: BaseWebviewPanelCtor
  ): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    const existing = BaseWebviewPanel.panels.get(init.viewType)
    if (existing) {
      existing._panel.reveal(column)
      return
    }

    const panel = vscode.window.createWebviewPanel(
      init.viewType,
      init.title,
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'src', 'templates')],
        retainContextWhenHidden: true
      }
    )

    const Ctor = ctor ?? BaseWebviewPanel
    const instance = new Ctor(panel, extensionUri)
    BaseWebviewPanel.panels.set(init.viewType, instance)
    instance._initialize(init)
  }

  /** Comandos aceitos pelo painel. Default `[]` = painel sem mensagens. */
  protected get messageWhitelist (): readonly string[] {
    return []
  }

  /** Hook de domínio; só recebe mensagens já validadas. */
  protected onMessage (_message: ValidatedMessage): void | Promise<void> {
    // Painéis declarativos não tratam mensagens.
  }

  /** Envia uma mensagem ao webview; no-op se o painel já foi descartado. */
  protected postMessage (msg: unknown): Thenable<boolean> {
    if (this._disposed) {
      return Promise.resolve(false)
    }
    return this._panel.webview.postMessage(msg)
  }

  public dispose (): void {
    if (this._disposed) {
      return
    }
    this._disposed = true
    BaseWebviewPanel.panels.delete(this._viewType)
    this._panel.dispose()
    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }

  private _initialize (init: PanelInit): void {
    this._viewType = init.viewType

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // AD-003: HTML é definido uma única vez na criação; sem re-render em
    // onDidChangeViewState (recarregar HTML estático destrói o estado do usuário).
    try {
      this._panel.webview.html = loadTemplate(this._extensionUri, init.template)
    } catch (error) {
      console.error(`[dev-juice] falha ao carregar template "${init.template}":`, error)
      vscode.window.showErrorMessage(
        `Não foi possível carregar a ferramenta "${init.title}".`
      )
      this.dispose()
      return
    }

    this._panel.webview.onDidReceiveMessage(
      (raw: unknown) => this._dispatchMessage(raw),
      null,
      this._disposables
    )
  }

  private _dispatchMessage (raw: unknown): void {
    const result = validateWebviewMessage(raw, this.messageWhitelist)
    if (!result.ok) {
      console.warn(
        `[dev-juice] mensagem de webview rejeitada (${result.reason}) no painel "${this._viewType}"`
      )
      if (result.reason === 'payload-too-large') {
        void this.postMessage({
          command: 'error',
          message: 'Entrada inválida ou muito grande.'
        })
      }
      return
    }

    try {
      const outcome = this.onMessage(result.message)
      if (outcome instanceof Promise) {
        outcome.catch(error => this._handleMessageError(error))
      }
    } catch (error) {
      this._handleMessageError(error)
    }
  }

  private _handleMessageError (error: unknown): void {
    console.error(`[dev-juice] erro ao processar mensagem no painel "${this._viewType}":`, error)
    void this.postMessage({
      command: 'error',
      message: 'Erro ao processar a solicitação.'
    })
  }
}
