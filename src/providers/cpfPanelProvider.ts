import * as vscode from 'vscode'
import * as fs from 'fs'
import { generateCPF } from '../utils/cpfGenerator'

/**
 * Manages CPF Generator webview panels
 */
export class CPFPanelProvider {
  /**
   * Track the current panel. Only allow a single panel to exist at a time.
   */
  private static _currentPanel: CPFPanelProvider | undefined

  /**
   * Get the current panel
   */
  public static get currentPanel (): CPFPanelProvider | undefined {
    return this._currentPanel
  }

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private readonly _disposables: vscode.Disposable[] = []

  public static createOrShow (extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (CPFPanelProvider._currentPanel) {
      CPFPanelProvider._currentPanel._panel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      'cpfGenerator',
      'Gerador de CPF',
      column ?? vscode.ViewColumn.One,
      {
        // Enable scripts in the webview
        enableScripts: true,
        // Restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'resources')],
        retainContextWhenHidden: true
      }
    )

    CPFPanelProvider._currentPanel = new CPFPanelProvider(panel, extensionUri)
  }

  private constructor (panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._extensionUri = extensionUri

    // Set the webview's initial html content
    this._update()

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
        case 'generateCPF': {
          const cpf = generateCPF()
          this._panel.webview.postMessage({ command: 'cpfGenerated', cpf })
          return
        }
        case 'copyCPF': {
          vscode.env.clipboard.writeText(message.cpf).then(() => {
            vscode.window.showInformationMessage('CPF copiado para a área de transferência!')
          })
          return
        }
        }
      },
      null,
      this._disposables
    )
  }

  private _update () {
    const webview = this._panel.webview
    this._panel.title = 'Gerador de CPF'
    this._panel.webview.html = this._getHtmlForWebview(webview)
  }

  private _getHtmlForWebview (webview: vscode.Webview) {
    // Get the local path to the HTML file
    const htmlFilePath = vscode.Uri.joinPath(this._extensionUri, 'src', 'templates', 'cpf-generator.html')
    let htmlContent = fs.readFileSync(htmlFilePath.fsPath, 'utf8')

    // And the URI we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'main.js'))
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'style.css'))

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce()

    // Replace placeholders in the HTML content
    htmlContent = htmlContent
      .replace(/#{webview.cspSource}/g, webview.cspSource)
      .replace(/#{nonce}/g, nonce)
      .replace(/#{scriptUri}/g, scriptUri.toString())
      .replace(/#{styleUri}/g, styleUri.toString())

    return htmlContent
  }

  public dispose () {
    CPFPanelProvider._currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()

    while (this._disposables.length) {
      const x = this._disposables.pop()
      if (x) {
        x.dispose()
      }
    }
  }
}

function getNonce () {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
