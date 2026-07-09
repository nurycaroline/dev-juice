import * as vscode from 'vscode'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'
import { validateUserInput } from '../../utils/securityUtils'

export class Base64Panel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['encode', 'decode', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'encode':
      if (!validateUserInput(message.text, 10000)) {
        this._sendError('encoded', 'Entrada inválida ou muito grande para codificação')
        return
      }
      this._encodeBase64(message.text as string)
      return
    case 'decode':
      if (!validateUserInput(message.text, 10000, /^[A-Za-z0-9+/=]*$/)) {
        this._sendError('decoded', 'Entrada inválida para decodificação Base64')
        return
      }
      this._decodeBase64(message.text as string)
      return
    case 'copyToClipboard':
      if (!validateUserInput(message.text, 20000)) {
        this._sendError('clipboard', 'Texto inválido ou muito grande para copiar')
        return
      }
      void this._copyToClipboard(message.text as string)
      return
    }
  }

  private _encodeBase64 (text: string): void {
    try {
      if (!text || typeof text !== 'string') {
        this._sendError('encoded', 'Texto inválido para codificação')
        return
      }
      const encoded = Buffer.from(text, 'utf8').toString('base64')
      void this.postMessage({ command: 'encoded', result: encoded, success: true })
    } catch (error) {
      console.error('Erro na codificação Base64:', error)
      this._sendError('encoded', 'Erro ao codificar texto')
    }
  }

  private _decodeBase64 (base64: string): void {
    try {
      if (!base64 || typeof base64 !== 'string' || !/^[A-Za-z0-9+/=]*$/.test(base64)) {
        this._sendError('decoded', 'Texto inválido para decodificação Base64')
        return
      }
      const decoded = Buffer.from(base64, 'base64').toString('utf8')
      void this.postMessage({ command: 'decoded', result: decoded, success: true })
    } catch (error) {
      console.error('Erro na decodificação Base64:', error)
      this._sendError('decoded', 'Erro ao decodificar Base64 - verifique se o texto está em formato Base64 válido')
    }
  }

  private async _copyToClipboard (text: string): Promise<void> {
    try {
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

  private _sendError (command: string, errorMessage: string): void {
    void this.postMessage({ command, error: errorMessage, success: false })
  }
}
