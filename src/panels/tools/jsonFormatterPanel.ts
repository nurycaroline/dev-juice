import * as vscode from 'vscode'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'

export class JsonFormatterPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['formatJson', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'formatJson':
      this._formatJson(message.json as string)
      return
    case 'copyToClipboard':
      void this._copyToClipboard(message.text as string)
      return
    }
  }

  private _formatJson (jsonString: string): void {
    try {
      const processedJson = this._addQuotesToKeys(jsonString)
      const parsed = JSON.parse(processedJson)
      const formatted = JSON.stringify(parsed, null, 2)
      void this.postMessage({
        command: 'jsonFormatted',
        formattedJson: formatted,
        isValid: true
      })
    } catch (error) {
      void this.postMessage({
        command: 'jsonFormatted',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isValid: false
      })
    }
  }

  private async _copyToClipboard (text: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('JSON copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar JSON:', error)
      vscode.window.showErrorMessage('Erro ao copiar JSON para a área de transferência.')
    }
  }

  private _addQuotesToKeys (jsonString: string): string {
    const json = jsonString.trim()
    const lines = json.split('\n')
    const processedLines = lines.map(line => {
      return line.replace(/^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
    })
    return processedLines.join('\n')
  }
}
