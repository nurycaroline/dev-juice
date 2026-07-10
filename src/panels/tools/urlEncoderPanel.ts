import * as vscode from 'vscode'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'
import { insertText } from '../../utils/insertUtils'

export class UrlEncoderPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['encode', 'decode', 'insertInEditor', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'encode':
      this._handleEncode(message.text as string)
      return
    case 'decode':
      this._handleDecode(message.text as string)
      return
    case 'insertInEditor':
      insertText(message.text as string)
      return
    case 'copyToClipboard':
      vscode.env.clipboard.writeText(message.text as string)
      vscode.window.showInformationMessage('URL copiada para a área de transferência!')
      return
    }
  }

  private _handleEncode (text: string): void {
    try {
      const encoded = encodeURIComponent(text)
      void this.postMessage({ command: 'encodeResult', result: encoded })
    } catch (error) {
      vscode.window.showErrorMessage(`Erro ao codificar URL: ${error}`)
    }
  }

  private _handleDecode (text: string): void {
    try {
      const decoded = decodeURIComponent(text)
      void this.postMessage({ command: 'decodeResult', result: decoded })
    } catch (error) {
      vscode.window.showErrorMessage(`Erro ao decodificar URL: ${error}`)
      void this.postMessage({
        command: 'decodeResult',
        result: 'Erro: URL inválida para decodificação'
      })
    }
  }
}
