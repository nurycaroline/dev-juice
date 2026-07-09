import * as vscode from 'vscode'
import { insertText } from '../../utils/insertUtils'
import { TextFormatter } from '../../utils/textFormatter'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'

export class TextFormatterPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['formatText', 'insertInEditor', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'formatText':
      this._handleFormatText(message.text as string, message.format as string)
      return
    case 'insertInEditor':
      insertText(message.text as string)
      return
    case 'copyToClipboard':
      vscode.env.clipboard.writeText(message.text as string)
      vscode.window.showInformationMessage('Texto formatado copiado para a área de transferência!')
      return
    }
  }

  private _handleFormatText (text: string, format: string): void {
    try {
      const formattedText = TextFormatter.format(text, format)
      void this.postMessage({
        command: 'formatResult',
        result: formattedText,
        format: format
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      vscode.window.showErrorMessage(`Erro ao formatar texto: ${errorMessage}`)
    }
  }
}
