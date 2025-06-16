import * as vscode from 'vscode'
import { insertText } from '../utils/insertUtils'
import { loadTemplate } from '../utils/templateLoader'

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
    );        TextFormatterProvider.currentPanel = panel

    // Set the webview's initial html content
    panel.webview.html = TextFormatterProvider.getWebviewContent(extensionUri)

    // Handle messages from the webview
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
  }

  private static handleFormatText (text: string, format: string): void {
    const panel = TextFormatterProvider.currentPanel
    if (!panel) {
      return
    }

    try {
      const formattedText = TextFormatterProvider.formatText(text, format)
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

  private static formatText (text: string, format: string): string {
    if (!text) {
      return ''
    }

    switch (format) {
    case 'sentence':
      return TextFormatterProvider.toSentenceCase(text)
    case 'snake':
      return TextFormatterProvider.toSnakeCase(text)
    case 'camel':
      return TextFormatterProvider.toCamelCase(text)
    case 'kebab':
      return TextFormatterProvider.toKebabCase(text)
    case 'pascal':
      return TextFormatterProvider.toPascalCase(text)
    case 'lower':
      return text.toLowerCase()
    case 'upper':
      return text.toUpperCase()
    case 'capital':
      return TextFormatterProvider.toCapitalizedCase(text)
    case 'alternating':
      return TextFormatterProvider.toAlternatingCase(text)
    case 'inverse':
      return TextFormatterProvider.toInverseCase(text)
    case 'dot':
      return TextFormatterProvider.toDotNotation(text)
    case 'params':
      return TextFormatterProvider.toParamsStyle(text)
    case 'path':
      return TextFormatterProvider.toPathStyle(text)
    default:
      return text
    }
  }

  private static toSentenceCase (text: string): string {
    return text.toLowerCase().replace(/^\w/, c => c.toUpperCase())
  }

  private static toSnakeCase (text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map(word => word.toLowerCase())
      .filter(word => word.length > 0)
      .join('_')
  }

  private static toCamelCase (text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase()
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .filter(word => word.length > 0)
      .join('')
  }

  private static toKebabCase (text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map(word => word.toLowerCase())
      .filter(word => word.length > 0)
      .join('-')
  }

  private static toPascalCase (text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .filter(word => word.length > 0)
      .join('')
  }

  private static toCapitalizedCase (text: string): string {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  } private static toAlternatingCase (text: string): string {
    const letterRegex = /[a-zA-Z]/
    return text
      .split('')
      .map((char, index) => {
        if (letterRegex.exec(char)) {
          return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
        }
        return char
      })
      .join('')
  }

  private static toInverseCase (text: string): string {
    return text
      .split('')
      .map(char => {
        if (char === char.toUpperCase()) {
          return char.toLowerCase()
        } else {
          return char.toUpperCase()
        }
      })
      .join('')
  }

  private static toDotNotation (text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map(word => word.toLowerCase())
      .filter(word => word.length > 0)
      .join('.')
  }

  private static toParamsStyle (text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map(word => word.toLowerCase())
      .filter(word => word.length > 0)
      .join(': ')
  }

  private static toPathStyle (text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map(word => word.toLowerCase())
      .filter(word => word.length > 0)
      .join('/')
  }
  
  private static getWebviewContent (extensionUri: vscode.Uri): string {
    return loadTemplate(extensionUri, 'text-formatter')
  }
}
