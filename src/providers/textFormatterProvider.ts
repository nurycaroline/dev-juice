import * as vscode from 'vscode'
import { insertText } from '../utils/insertUtils'
import { loadTemplate } from '../utils/templateLoader'
import { TextFormatter } from '../utils/textFormatter'

export class TextFormatterProvider {
  // Making currentPanel readonly to fix SonarLint warning
  private static currentPanel: vscode.WebviewPanel | undefined

  public static createOrShow (extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (TextFormatterProvider.currentPanel) {
      TextFormatterProvider.currentPanel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      'textFormatter',
      'Formatação de Texto',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: []
      }
    ); TextFormatterProvider.currentPanel = panel

    // Set the webview's initial html content
    panel.webview.html = TextFormatterProvider.getWebviewContent(extensionUri)    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
        case 'formatText':
          TextFormatterProvider.handleFormatText(message.text, message.format)
          break
        case 'insertInEditor':
          insertText(message.text)
          break
        case 'copyToClipboard':
          vscode.env.clipboard.writeText(message.text)
          vscode.window.showInformationMessage('Texto formatado copiado para a área de transferência!')
          break
        }
      },
      undefined
    )

    // Listen for when the panel is disposed
    panel.onDidDispose(
      () => {
        TextFormatterProvider.currentPanel = undefined
      },
      null
    )
  } private static handleFormatText (text: string, format: string): void {
    const panel = TextFormatterProvider.currentPanel
    if (!panel) {
      return
    }

    try {
      const formattedText = TextFormatter.format(text, format)
      panel.webview.postMessage({
        command: 'formatResult',
        result: formattedText,
        format: format
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      vscode.window.showErrorMessage(`Erro ao formatar texto: ${errorMessage}`)
    }
  }

  private static getWebviewContent (extensionUri: vscode.Uri): string {
    return loadTemplate(extensionUri, 'text-formatter')
  }
}
