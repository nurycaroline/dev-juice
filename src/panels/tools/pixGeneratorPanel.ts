import * as vscode from 'vscode'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'
import { PixGenerator, PixData } from '../../utils/pixGenerator'

/**
 * SPEC_DEVIATION (ARCH-10): a spec pedia sanitizar via `sanitizeHTML` o HTML de
 * fallback de erro do antigo `pixPanelProvider.ts:209`, que interpolava `${error}`
 * cru no HTML. Com a unificação (AD-002), TODO HTML passa por `loadTemplate` na
 * base e a falha de template vira `showErrorMessage` (texto puro, sem HTML). O
 * vetor de injeção foi ELIMINADO em vez de sanitizado — mais forte que o pedido.
 * Reason: manter um fallback HTML só para sanitizá-lo recriaria um caminho de HTML
 * fora de `loadTemplate`, violando AD-002. O escape de `sanitizeHTML` continua
 * coberto por teste unitário (securityUtils: "neutralizes a script tag payload").
 */
export class PixGeneratorPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['validatePixKey', 'generatePix', 'copyToClipboard', 'copyImageToClipboard', 'downloadQRCode']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'validatePixKey':
      this._validatePixKey(message.pixKey as string)
      return
    case 'generatePix':
      void this._generatePix(message.data as PixData)
      return
    case 'copyToClipboard':
      void this._copyToClipboard(message.text as string)
      return
    case 'copyImageToClipboard':
      void this._copyImageToClipboard()
      return
    case 'downloadQRCode':
      void this._downloadQRCode(message.dataUrl as string)
      return
    }
  }

  private _validatePixKey (pixKey: string): void {
    const validation = PixGenerator.validatePixKey(pixKey)
    void this.postMessage({ command: 'pixKeyValidation', validation: validation })
  }

  private async _generatePix (data: PixData): Promise<void> {
    try {
      const validation = PixGenerator.validatePixKey(data.pixKey)
      if (!validation.isValid) {
        throw new Error('Chave PIX inválida. Verifique o formato da chave.')
      }
      const pixCode = PixGenerator.generatePixCode(data)
      const qrCodeDataUrl = await PixGenerator.generatePixQRCode(data)
      void this.postMessage({
        command: 'pixGenerated',
        pixCode: pixCode,
        qrCodeDataUrl: qrCodeDataUrl
      })
      vscode.window.showInformationMessage('PIX QR Code gerado com sucesso!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao gerar PIX'
      void this.postMessage({ command: 'error', message: errorMessage })
      vscode.window.showErrorMessage(`Erro ao gerar PIX: ${errorMessage}`)
    }
  }

  private async _copyToClipboard (text: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('Código PIX copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error)
      vscode.window.showErrorMessage('Erro ao copiar código PIX para a área de transferência.')
    }
  }

  private async _copyImageToClipboard (): Promise<void> {
    vscode.window.showInformationMessage(
      'Para copiar a imagem, clique com o botão direito no QR Code e selecione "Copiar Imagem".'
    )
  }

  private async _downloadQRCode (dataUrl: string): Promise<void> {
    try {
      const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('pix-qrcode.png'),
        filters: { 'Imagens PNG': ['png'] }
      })
      if (saveUri) {
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        await vscode.workspace.fs.writeFile(saveUri, buffer)
        vscode.window.showInformationMessage(`QR Code salvo em: ${saveUri.fsPath}`)
      }
    } catch (error) {
      console.error('Erro ao salvar QR Code:', error)
      vscode.window.showErrorMessage('Erro ao salvar QR Code.')
    }
  }
}
