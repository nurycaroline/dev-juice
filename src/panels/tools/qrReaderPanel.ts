import * as vscode from 'vscode'
import { insertText } from '../../utils/insertUtils'
import { QRCodeProcessor } from '../../utils/qrCodeProcessor'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'

export class QrReaderPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['decodeQr', 'processQRImage', 'insertInEditor', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'decodeQr':
      this._handleDecodeQr(message.imageData as string)
      return
    case 'processQRImage':
      this._handleProcessQRImage(
        message.imageData as { data: number[], width: number, height: number },
        message.fileName as string | undefined
      )
      return
    case 'insertInEditor':
      insertText(message.text as string)
      return
    case 'copyToClipboard':
      vscode.env.clipboard.writeText(message.text as string)
      vscode.window.showInformationMessage('Texto do QR Code copiado para a área de transferência!')
      return
    }
  }

  private _handleDecodeQr (imageData: string): void {
    void this.postMessage({ command: 'processQrCode', imageData: imageData })
  }

  private _handleProcessQRImage (
    imageData: { data: number[], width: number, height: number },
    fileName?: string
  ): void {
    try {
      const uint8Data = new Uint8ClampedArray(imageData.data)
      const result = QRCodeProcessor.processImageData(uint8Data, imageData.width, imageData.height, fileName)
      if (result.success && result.data) {
        void this.postMessage({
          command: 'qrProcessResult',
          success: true,
          data: result.data,
          fileName: result.fileName
        })
      } else {
        void this.postMessage({
          command: 'qrProcessResult',
          success: false,
          error: result.error || 'Erro desconhecido ao processar QR Code',
          fileName: result.fileName
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      void this.postMessage({
        command: 'qrProcessResult',
        success: false,
        error: errorMessage,
        fileName: fileName
      })
    }
  }
}
