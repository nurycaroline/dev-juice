import * as vscode from 'vscode'
import { loadTemplate } from '../utils/templateLoader'

/**
 * Provider for the JSON formatter webview panel
 */
export class JsonFormatterProvider {  /**
     * Track the currently active panels. Only allow a single panel to exist at a time.
     */
  public static currentPanel: JsonFormatterProvider | undefined

  public static readonly viewType = 'jsonFormatter'

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private readonly _disposables: vscode.Disposable[] = []

  public static createOrShow (extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (JsonFormatterProvider.currentPanel) {
      JsonFormatterProvider.currentPanel._panel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      JsonFormatterProvider.viewType,
      'Formatador JSON',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src', 'templates')
        ]
      }
    )

    JsonFormatterProvider.currentPanel = new JsonFormatterProvider(panel, extensionUri)
  }

  private constructor (panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._extensionUri = extensionUri

    // Set the webview's initial html content
    this._update()

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
        case 'formatJson':
          this._formatJson(message.json)
          return
        case 'copyToClipboard':
          this._copyToClipboard(message.text)
          return
        }
      },
      null,
      this._disposables
    )
  }
  /**
     * Formats JSON and sends the result to the webview
     */
  private _formatJson (jsonString: string) {
    try {
      // Sempre aplicar aspas duplas nas chaves quando necessário
      const processedJson = this._addQuotesToKeys(jsonString)

      const parsed = JSON.parse(processedJson)
      const formatted = JSON.stringify(parsed, null, 2)

      this._panel.webview.postMessage({
        command: 'jsonFormatted',
        formattedJson: formatted,
        isValid: true
      })
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'jsonFormatted',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isValid: false
      })
    }
  }

  /**
     * Copies text to clipboard
     */
  private async _copyToClipboard (text: string) {
    try {
      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('JSON copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar JSON:', error)
      vscode.window.showErrorMessage('Erro ao copiar JSON para a área de transferência.')
    }
  }
  /**
   * Adds double quotes to JSON keys that don't have them
   */
  private _addQuotesToKeys (jsonString: string): string {
    let json = jsonString.trim()

    // Regex para encontrar chaves sem aspas no JSON
    // Busca por padrões como: 'chave:' onde chave não está entre aspas
    // Evita substituir dentro de strings ou valores já quoted

    // Split por linhas para processar linha por linha (mais seguro)
    const lines = json.split('\n')
    const processedLines = lines.map(line => {
      // Regex para chave sem aspas: espaços + identificador + espaços + dois pontos
      // Mas só se não estiver já entre aspas
      return line.replace(/^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
    })

    return processedLines.join('\n')
  }

  public dispose () {
    JsonFormatterProvider.currentPanel = undefined

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
  } private _getHtmlForWebview () {
    return loadTemplate(this._extensionUri, 'json-formatter')
  }
}
