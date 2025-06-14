import * as vscode from 'vscode'
import * as crypto from 'crypto'
import { loadTemplate } from '../utils/templateLoader'

/**
 * Provider for the Hash Generator webview panel
 */
export class HashGeneratorProvider {
  /**
       * Track the currently active panels. Only allow a single panel to exist at a time.
       */
  public static currentPanel: HashGeneratorProvider | undefined

  public static readonly viewType = 'hashGenerator'

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private readonly _disposables: vscode.Disposable[] = []

  public static createOrShow (extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (HashGeneratorProvider.currentPanel) {
      HashGeneratorProvider.currentPanel._panel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      HashGeneratorProvider.viewType,
      'Gerador de Hash',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src', 'templates')
        ]
      }
    )

    HashGeneratorProvider.currentPanel = new HashGeneratorProvider(panel, extensionUri)
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
        switch (message.command) {
        case 'generateHash':
          this._generateHash(message.text, message.algorithm)
          return
        case 'generateAllHashes':
          this._generateAllHashes(message.text)
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
       * Generates a hash for the given text and algorithm
       */
  private _generateHash (text: string, algorithm: string) {
    try {
      const hash = crypto.createHash(algorithm).update(text, 'utf8').digest('hex')

      this._panel.webview.postMessage({
        command: 'hashGenerated',
        algorithm: algorithm,
        hash: hash,
        success: true
      })
    } catch (error) {
      console.error('Erro ao gerar hash:', error)
      this._panel.webview.postMessage({
        command: 'hashGenerated',
        algorithm: algorithm,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      })
    }
  }

  /**
       * Generates all supported hashes for the given text
       */
  private _generateAllHashes (text: string) {
    const algorithms = ['md5', 'sha1', 'sha256', 'sha512']
    const hashes: { [key: string]: string } = {}

    try {
      for (const algorithm of algorithms) {
        hashes[algorithm] = crypto.createHash(algorithm).update(text, 'utf8').digest('hex')
      }

      this._panel.webview.postMessage({
        command: 'allHashesGenerated',
        hashes: hashes,
        success: true
      })
    } catch (error) {
      console.error('Erro ao gerar hashes:', error)
      this._panel.webview.postMessage({
        command: 'allHashesGenerated',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      })
    }
  }

  /**
       * Copies text to clipboard
       */
  private async _copyToClipboard (text: string) {
    try {
      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('Hash copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar hash:', error)
      vscode.window.showErrorMessage('Erro ao copiar hash para a área de transferência.')
    }
  }

  public dispose () {
    HashGeneratorProvider.currentPanel = undefined

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
    this._panel.webview.html = loadTemplate(this._extensionUri, 'hash-generator')
  }
}
