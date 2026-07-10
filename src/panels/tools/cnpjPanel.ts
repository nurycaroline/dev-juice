import * as vscode from 'vscode'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'
import { generateCNPJ, formatCNPJ } from '../../utils/cnpjGenerator'

export class CnpjPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['generateCNPJ', 'copyCNPJ']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'generateCNPJ': {
      const rawCNPJ = generateCNPJ(false)
      const formattedCNPJ = formatCNPJ(rawCNPJ)
      void this.postMessage({
        command: 'cnpjGenerated',
        formattedCNPJ,
        unformattedCNPJ: rawCNPJ
      })
      return
    }
    case 'copyCNPJ':
      vscode.env.clipboard.writeText(message.cnpj as string)
      vscode.window.showInformationMessage('CNPJ copiado para o clipboard!')
      return
    }
  }
}
