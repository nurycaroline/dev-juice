import * as vscode from 'vscode'
import * as crypto from 'crypto'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'

export class HashGeneratorPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['generateHash', 'generateAllHashes', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'generateHash':
      this._generateHash(message.text as string, message.algorithm as string)
      return
    case 'generateAllHashes':
      this._generateAllHashes(message.text as string)
      return
    case 'copyToClipboard':
      void this._copyToClipboard(message.text as string)
      return
    }
  }

  private _generateHash (text: string, algorithm: string): void {
    try {
      const hash = crypto.createHash(algorithm).update(text, 'utf8').digest('hex')
      void this.postMessage({
        command: 'hashGenerated',
        algorithm: algorithm,
        hash: hash,
        success: true
      })
    } catch (error) {
      console.error('Erro ao gerar hash:', error)
      void this.postMessage({
        command: 'hashGenerated',
        algorithm: algorithm,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      })
    }
  }

  private _generateAllHashes (text: string): void {
    const algorithms = ['md5', 'sha1', 'sha256', 'sha512']
    const hashes: { [key: string]: string } = {}
    try {
      for (const algorithm of algorithms) {
        hashes[algorithm] = crypto.createHash(algorithm).update(text, 'utf8').digest('hex')
      }
      void this.postMessage({
        command: 'allHashesGenerated',
        hashes: hashes,
        success: true
      })
    } catch (error) {
      console.error('Erro ao gerar hashes:', error)
      void this.postMessage({
        command: 'allHashesGenerated',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      })
    }
  }

  private async _copyToClipboard (text: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('Hash copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar hash:', error)
      vscode.window.showErrorMessage('Erro ao copiar hash para a área de transferência.')
    }
  }
}
