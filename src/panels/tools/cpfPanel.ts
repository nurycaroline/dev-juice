import * as vscode from 'vscode'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'
import { generateCPF } from '../../utils/cpfGenerator'

export class CpfPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['generateCPF', 'copyCPF']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'generateCPF': {
      const cpf = generateCPF()
      void this.postMessage({ command: 'cpfGenerated', cpf })
      return
    }
    case 'copyCPF':
      void vscode.env.clipboard.writeText(message.cpf as string).then(() => {
        vscode.window.showInformationMessage('CPF copiado para a área de transferência!')
      })
      return
    }
  }
}
