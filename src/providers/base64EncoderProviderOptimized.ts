import * as vscode from 'vscode'
import { loadTemplate } from '../utils/templateLoader'
import { WebviewManager } from '../utils/webviewManager'

/**
 * Provider otimizado para o codificador/decodificador Base64
 */
export class Base64EncoderProviderOptimized {
  private static readonly viewType = 'base64Encoder'
  private readonly webviewManager = WebviewManager.getInstance()
  
  private _panel!: vscode.WebviewPanel 
  private readonly _extensionUri: vscode.Uri
  private readonly _disposables: vscode.Disposable[] = []

  // Cache para debouncing
  private _debounceTimer: NodeJS.Timeout | undefined

  public static createOrShow (extensionUri: vscode.Uri): void {
    const instance = new Base64EncoderProviderOptimized(extensionUri)
    instance.createOrShowPanel()
  }

  private constructor (extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri
  }

  private createOrShowPanel (): void {
    const column = vscode.window.activeTextEditor?.viewColumn

    // Usar o WebviewManager para controle centralizado
    this._panel = this.webviewManager.createOrShowPanel(
      Base64EncoderProviderOptimized.viewType,
      'Codificador Base64',
      column,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this._extensionUri, 'src', 'templates')
        ],
        retainContextWhenHidden: false // Não reter contexto para economizar memória
      },
      () => this.dispose()
    )

    this.setupWebview()
  }

  private setupWebview (): void {
    // Lazy loading do HTML content
    this._panel.webview.html = this.getHtmlForWebview()

    // Configurar listeners
    this.setupMessageHandlers()
  }

  private setupMessageHandlers (): void {
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
        case 'encode':
          this.handleEncode(message.text)
          break
        case 'decode':
          this.handleDecode(message.text)
          break
        case 'copyToClipboard':
          this.copyToClipboard(message.text)
          break
        }
      },
      null,
      this._disposables
    )
  }

  /**
   * Encode com debouncing para melhor performance
   */
  private handleEncode (text: string): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }

    this._debounceTimer = setTimeout(() => {
      try {
        const encoded = Buffer.from(text, 'utf8').toString('base64')
        this._panel.webview.postMessage({
          command: 'encodingResult',
          result: encoded,
          success: true
        })
      } catch (error) {
        this._panel.webview.postMessage({
          command: 'encodingResult',
          error: error instanceof Error ? error.message : 'Erro na codificação',
          success: false
        })
      }
    }, 150) // Debounce de 150ms
  }

  /**
   * Decode com debouncing para melhor performance
   */
  private handleDecode (base64: string): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }

    this._debounceTimer = setTimeout(() => {
      try {
        const decoded = Buffer.from(base64, 'base64').toString('utf8')
        this._panel.webview.postMessage({
          command: 'decodingResult',
          result: decoded,
          success: true
        })
      } catch (error) {
        this._panel.webview.postMessage({
          command: 'decodingResult',
          error: error instanceof Error ? error.message : 'Erro na decodificação',
          success: false
        })
      }
    }, 150) // Debounce de 150ms
  }

  /**
   * Copy to clipboard com error handling otimizado
   */
  private async copyToClipboard (text: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(text)
      // Usar showInformationMessage com timeout para não bloquear a UI
      void vscode.window.showInformationMessage('Texto copiado!', { modal: false })
    } catch (error) {
      console.error('Erro ao copiar texto:', error)
      void vscode.window.showErrorMessage('Erro ao copiar texto.')
    }
  }

  private getHtmlForWebview (): string {
    // Template é carregado com cache automático
    return loadTemplate(this._extensionUri, 'base64-encoder')
  }

  private dispose (): void {
    // Limpar debounce timer
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }

    // Limpar outros recursos
    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      disposable?.dispose()
    }
  }
  /**
   * Método estático para estatísticas de performance
   */
  public static getPerformanceStats (): { activePanels: { activePanels: number; maxPanels: number }; viewType: string } {
    const manager = WebviewManager.getInstance()
    return {
      activePanels: manager.getStats(),
      viewType: Base64EncoderProviderOptimized.viewType
    }
  }
}
