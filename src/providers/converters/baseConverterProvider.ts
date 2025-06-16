import * as vscode from 'vscode'

export abstract class BaseConverterProvider {
  private static readonly _currentPanel: BaseConverterProvider | undefined
  public static get currentPanel (): BaseConverterProvider | undefined {
    return this._currentPanel
  }

  protected static readonly viewType: string
  protected static readonly viewTitle: string
  
  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private readonly _disposables: vscode.Disposable[] = []

  public static createOrShow (extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (this._currentPanel) {
      this._currentPanel._panel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    // Este método deve ser sobrescrito nas classes filhas,
    // pois classes abstratas não podem ser instanciadas diretamente
    vscode.window.createWebviewPanel(
      this.viewType,
      this.viewTitle,
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src', 'templates')
        ]
      }
    )
  }

  protected constructor (panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
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
    // Será implementado nas classes filhas para definir o currentPanel como undefined
    
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

  protected _update () {
    this._panel.webview.html = this._getHtmlForWebview()
  }

  protected abstract _getHtmlForWebview (): string
}
