import * as vscode from 'vscode'
import { loadTemplate } from '../utils/templateLoader'
import { insertText } from '../utils/insertUtils'
import { QRCodeProcessor } from '../utils/qrCodeProcessor'

export class QrReaderProvider {
  // Making currentPanel readonly to fix SonarLint warning
  private static currentPanel: vscode.WebviewPanel | undefined

  public static createOrShow (extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (QrReaderProvider.currentPanel) {
      QrReaderProvider.currentPanel.reveal(column)
      return
    }    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      'qrReader',
      'QR Code Reader',
      column ?? vscode.ViewColumn.One,      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: []
      }
    )

    QrReaderProvider.currentPanel = panel

    // Set the webview's initial html content
    panel.webview.html = QrReaderProvider.getWebviewContent(extensionUri)    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
        case 'decodeQr':
          QrReaderProvider.handleDecodeQr(message.imageData)
          break
        case 'processQRImage':
          QrReaderProvider.handleProcessQRImage(message.imageData, message.fileName)
          break
        case 'insertInEditor':
          insertText(message.text)
          break
        case 'copyToClipboard':
          vscode.env.clipboard.writeText(message.text)
          vscode.window.showInformationMessage('Texto do QR Code copiado para a área de transferência!')
          break
        }
      },
      undefined
    )

    // Listen for when the panel is disposed
    panel.onDidDispose(
      () => {
        QrReaderProvider.currentPanel = undefined
      },
      null
    )
  }  private static handleProcessQRImage (imageData: { data: number[], width: number, height: number }, fileName?: string): void {
    const panel = QrReaderProvider.currentPanel
    if (!panel) {
      return
    }

    try {
      // Convert the image data array back to Uint8ClampedArray
      const uint8Data = new Uint8ClampedArray(imageData.data)
      
      // Process the QR code using our utility
      const result = QRCodeProcessor.processImageData(uint8Data, imageData.width, imageData.height, fileName)
      
      if (result.success && result.data) {
        // Send success message to webview with QR data
        panel.webview.postMessage({
          command: 'qrProcessResult',
          success: true,
          data: result.data,
          fileName: result.fileName
        })
      } else {
        // Send error message to webview
        panel.webview.postMessage({
          command: 'qrProcessResult',
          success: false,
          error: result.error || 'Erro desconhecido ao processar QR Code',
          fileName: result.fileName
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      panel.webview.postMessage({
        command: 'qrProcessResult',
        success: false,
        error: errorMessage,
        fileName: fileName
      })
    }
  }

  private static handleDecodeQr (imageData: string): void {
    const panel = QrReaderProvider.currentPanel
    if (!panel) {
      return
    }

    // Send message to webview to process the QR code using jsQR
    panel.webview.postMessage({
      command: 'processQrCode',
      imageData: imageData
    })
  }  private static getWebviewContent (extensionUri: vscode.Uri): string {
    return loadTemplate(extensionUri, 'qr-reader')
  }
}
