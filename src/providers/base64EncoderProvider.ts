import * as vscode from 'vscode'
import { loadTemplate } from '../utils/templateLoader'
import { validateUserInput } from '../utils/securityUtils'

/**
 * Provider for the Base64 encoder/decoder webview panel
 */
export class Base64EncoderProvider {
  /**
     * Track the currently active panels. Only allow a single panel to exist at a time.
     */
  public static currentPanel: Base64EncoderProvider | undefined

  public static readonly viewType = 'base64Encoder'

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private readonly _disposables: vscode.Disposable[] = []

  public static createOrShow (extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (Base64EncoderProvider.currentPanel) {
      Base64EncoderProvider.currentPanel._panel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      Base64EncoderProvider.viewType,
      'Codificador Base64',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src', 'templates')
        ],
        // Restringir as permissões da webview
        retainContextWhenHidden: true
      }
    )

    Base64EncoderProvider.currentPanel = new Base64EncoderProvider(panel, extensionUri)
  }

  private constructor (panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._extensionUri = extensionUri

    // Set the webview's initial html content
    this._update()

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        // Validar a mensagem antes de processá-la
        if (!message || typeof message !== 'object' || !message.command) {
          console.error('Mensagem de webview inválida:', message)
          return
        }

        switch (message.command) {
        case 'encode':
          if (!validateUserInput(message.text, 10000)) {
            this._sendError('encoded', 'Entrada inválida ou muito grande para codificação')
            return
          }
          this._encodeBase64(message.text)
          return
        case 'decode':
          if (!validateUserInput(message.text, 10000, /^[A-Za-z0-9+/=]*$/)) {
            this._sendError('decoded', 'Entrada inválida para decodificação Base64')
            return
          }
          this._decodeBase64(message.text)
          return
        case 'copyToClipboard':
          if (!validateUserInput(message.text, 20000)) {
            this._sendError('clipboard', 'Texto inválido ou muito grande para copiar')
            return
          }
          this._copyToClipboard(message.text)
          return
        }
      },
      null,
      this._disposables
    )
  }
  /**
     * Encodes text to Base64
     */
  private _encodeBase64 (text: string) {
    try {
      // Validação extra de segurança
      if (!text || typeof text !== 'string') {
        this._sendError('encoded', 'Texto inválido para codificação')
        return
      }

      const encoded = Buffer.from(text, 'utf8').toString('base64')
      this._panel.webview.postMessage({
        command: 'encoded',
        result: encoded,
        success: true
      })
    } catch (error) {
      console.error('Erro na codificação Base64:', error)
      this._sendError('encoded', 'Erro ao codificar texto')
    }
  }

  /**
     * Decodes Base64 to text
     */
  private _decodeBase64 (base64: string) {
    try {
      // Validação extra de segurança
      if (!base64 || typeof base64 !== 'string' || !/^[A-Za-z0-9+/=]*$/.test(base64)) {
        this._sendError('decoded', 'Texto inválido para decodificação Base64')
        return
      }

      const decoded = Buffer.from(base64, 'base64').toString('utf8')
      this._panel.webview.postMessage({
        command: 'decoded',
        result: decoded,
        success: true
      })
    } catch (error) {
      console.error('Erro na decodificação Base64:', error)
      this._sendError('decoded', 'Erro ao decodificar Base64 - verifique se o texto está em formato Base64 válido')
    }
  }

  /**
     * Copies text to clipboard
     */
  private async _copyToClipboard (text: string) {
    try {
      // Validação extra de segurança
      if (!text || typeof text !== 'string' || text.length > 20000) {
        vscode.window.showErrorMessage('Texto inválido ou muito grande para copiar')
        return
      }

      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('Texto copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar texto:', error)
      vscode.window.showErrorMessage('Erro ao copiar texto para a área de transferência.')
    }
  }

  /**
   * Envia uma mensagem de erro para o webview
   */
  private _sendError (command: string, errorMessage: string) {
    this._panel.webview.postMessage({
      command,
      error: errorMessage,
      success: false
    })
  }

  public dispose () {
    Base64EncoderProvider.currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()

    while (this._disposables.length) {
      const x = this._disposables.pop()
      if (x) {
        x.dispose()
      }
    }
  }

  private _update () {
    this._panel.webview.html = this._getHtmlForWebview()
  } 
  
  private _getHtmlForWebview () {
    return loadTemplate(this._extensionUri, 'base64-encoder')
  }
}
