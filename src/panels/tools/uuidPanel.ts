import * as vscode from 'vscode'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'
import { generateUUID } from '../../utils/uuidGenerator'

export class UuidPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['generateUUID', 'copyUUID']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'generateUUID': {
      const uuid = generateUUID()
      void this.postMessage({ command: 'uuidGenerated', uuid })
      return
    }
    case 'copyUUID':
      void vscode.env.clipboard.writeText(message.uuid as string).then(() => {
        vscode.window.showInformationMessage('UUID copiado para a área de transferência!')
      })
      return
    }
  }
}
