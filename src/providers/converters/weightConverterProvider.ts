import * as vscode from 'vscode'
import { loadTemplate } from '../../utils/templateLoader'

export class WeightConverterProvider {
  /**
   * Track the currently active panel
   */
  private static _currentPanel: WeightConverterProvider | undefined
  public static get currentPanel (): WeightConverterProvider | undefined {
    return this._currentPanel
  }

  public static readonly viewType = 'weightConverter'
  public static readonly viewTitle = 'Conversor de Peso e Massa'

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private readonly _disposables: vscode.Disposable[] = []

  public static createOrShow (extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (WeightConverterProvider._currentPanel) {
      WeightConverterProvider._currentPanel._panel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      WeightConverterProvider.viewType,
      WeightConverterProvider.viewTitle,
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src', 'templates')
        ]
      }
    )

    WeightConverterProvider._currentPanel = new WeightConverterProvider(panel, extensionUri)
  }

  private constructor (panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._extensionUri = extensionUri

    // Set the webview's initial html content
    this._update()

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      _e => {
        if (this._panel.visible) {
          this._update()
        }
      },
      null,
      this._disposables
    )
  }

  public dispose () {
    WeightConverterProvider._currentPanel = undefined
    
    // Dispose panel
    this._panel.dispose()

    // Dispose all disposables
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

  private _getHtmlForWebview (): string {
    // Load the template
    return loadTemplate(this._extensionUri, 'weight-converter')
  }
}
