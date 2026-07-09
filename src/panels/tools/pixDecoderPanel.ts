import * as vscode from 'vscode'
import { insertText } from '../../utils/insertUtils'
import { QRCodeProcessor } from '../../utils/qrCodeProcessor'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'

interface PixMerchantInfo {
  gui?: string
  pixKey?: string
  keyType?: string
  name?: string
  city?: string
  additionalInfo?: string
  unknownFields?: Record<string, string>
}

interface PixTransactionInfo {
  categoryCode?: string
  currency?: string
  currencyName?: string
  amount?: number
  countryCode?: string
}

interface PixAdditionalInfo {
  referenceLabel?: string
  paymentSystemTemplate?: string
  unknownFields?: Record<string, string>
}

interface DecodedPixData {
  version: string
  initMethod: string
  merchantInfo: PixMerchantInfo
  transactionInfo: PixTransactionInfo
  additionalInfo: PixAdditionalInfo
  crc: string
  crcValid?: boolean
  unknownFields?: Record<string, string>
}

export class PixDecoderPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['decodePixString', 'decodeQrImage', 'processQRImage', 'insertInEditor', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'decodePixString':
      this._handleDecodePixString(message.pixCode as string)
      return
    case 'decodeQrImage':
      this._handleDecodeQrImage(message.imageData as string)
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
      vscode.window.showInformationMessage('Dados do PIX copiados para a área de transferência!')
      return
    }
  }

  private _handleDecodePixString (pixCode: string): void {
    try {
      const decodedData = PixDecoderPanel.decodePixPayload(pixCode)
      void this.postMessage({ command: 'pixDecodeResult', result: decodedData, success: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      void this.postMessage({
        command: 'pixDecodeResult',
        result: { error: errorMessage },
        success: false
      })
    }
  }

  private _handleDecodeQrImage (imageData: string): void {
    void this.postMessage({ command: 'processPixQrCode', imageData: imageData })
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
          fileName: result.fileName,
          data: result.data
        })
        try {
          const decodedData = PixDecoderPanel.decodePixPayload(result.data)
          void this.postMessage({ command: 'pixDecodeResult', result: decodedData, success: true })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
          void this.postMessage({
            command: 'pixDecodeResult',
            result: { error: errorMessage },
            success: false
          })
        }
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

  private static decodePixPayload (payload: string): DecodedPixData {
    const cleanPayload = payload.trim()
    if (!cleanPayload) {
      throw new Error('Código PIX vazio')
    }
    const pixRegex = /^00020\d/
    if (!pixRegex.test(cleanPayload)) {
      throw new Error(`Formato de código PIX inválido. Código deve começar com '00020'. Código recebido: "${cleanPayload.substring(0, Math.min(20, cleanPayload.length))}${cleanPayload.length > 20 ? '...' : ''}"`)
    }

    const result: DecodedPixData = {
      version: '',
      initMethod: '',
      merchantInfo: {},
      transactionInfo: {},
      additionalInfo: {},
      crc: ''
    }

    let index = 0
    try {
      while (index < cleanPayload.length - 4) {
        if (index + 4 > cleanPayload.length) {
          break
        }
        const id = cleanPayload.substring(index, index + 2)
        const lengthStr = cleanPayload.substring(index + 2, index + 4)
        if (!/^\d{2}$/.test(lengthStr)) {
          break
        }
        const length = parseInt(lengthStr, 10)
        if (index + 4 + length > cleanPayload.length) {
          break
        }
        const value = cleanPayload.substring(index + 4, index + 4 + length)
        switch (id) {
        case '00': result.version = value; break
        case '01': result.initMethod = value; break
        case '26': result.merchantInfo = PixDecoderPanel.parsePixMerchantInfo(value); break
        case '52': result.transactionInfo.categoryCode = value; break
        case '53':
          result.transactionInfo.currency = value
          result.transactionInfo.currencyName = value === '986' ? 'BRL (Real Brasileiro)' : value
          break
        case '54': result.transactionInfo.amount = parseFloat(value); break
        case '58': result.transactionInfo.countryCode = value; break
        case '59': result.merchantInfo.name = value; break
        case '60': result.merchantInfo.city = value; break
        case '62': result.additionalInfo = PixDecoderPanel.parseAdditionalInfo(value); break
        case '63': result.crc = value; break
        default:
          result.unknownFields ??= {}
          result.unknownFields[id] = value
          break
        }
        index += 4 + length
      }
      if (result.crc) {
        const payloadWithoutCrc = cleanPayload.substring(0, cleanPayload.length - 4)
        const calculatedCrc = PixDecoderPanel.calculateCRC16(payloadWithoutCrc)
        result.crcValid = result.crc.toUpperCase() === calculatedCrc.toUpperCase()
      } else if (cleanPayload.length >= 4) {
        const lastTag = cleanPayload.substring(cleanPayload.length - 8, cleanPayload.length - 6)
        if (lastTag === '63') {
          result.crc = cleanPayload.substring(cleanPayload.length - 4)
          const payloadWithoutCrc = cleanPayload.substring(0, cleanPayload.length - 8)
          const calculatedCrc = PixDecoderPanel.calculateCRC16(payloadWithoutCrc + '6304')
          result.crcValid = result.crc.toUpperCase() === calculatedCrc.toUpperCase()
        }
      }
      return result
    } catch (error) {
      throw new Error(`Erro ao decodificar PIX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  private static parsePixMerchantInfo (value: string): PixMerchantInfo {
    const info: PixMerchantInfo = {}
    let index = 0
    while (index < value.length) {
      const id = value.substring(index, index + 2)
      const length = parseInt(value.substring(index + 2, index + 4), 10)
      const fieldValue = value.substring(index + 4, index + 4 + length)
      switch (id) {
      case '00': info.gui = fieldValue; break
      case '01':
        info.pixKey = fieldValue
        info.keyType = PixDecoderPanel.detectPixKeyType(fieldValue)
        break
      case '02': info.additionalInfo = fieldValue; break
      default:
        info.unknownFields ??= {}
        info.unknownFields[id] = fieldValue
        break
      }
      index += 4 + length
    }
    return info
  }

  private static parseAdditionalInfo (value: string): PixAdditionalInfo {
    const info: PixAdditionalInfo = {}
    let index = 0
    while (index < value.length) {
      const id = value.substring(index, index + 2)
      const length = parseInt(value.substring(index + 2, index + 4), 10)
      const fieldValue = value.substring(index + 4, index + 4 + length)
      switch (id) {
      case '05': info.referenceLabel = fieldValue; break
      case '50': info.paymentSystemTemplate = fieldValue; break
      default:
        info.unknownFields ??= {}
        info.unknownFields[id] = fieldValue
        break
      }
      index += 4 + length
    }
    return info
  }

  private static detectPixKeyType (pixKey: string): string {
    if (/^\d{11}$/.test(pixKey)) {
      return 'CPF'
    }
    if (/^\d{14}$/.test(pixKey)) {
      return 'CNPJ'
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
      return 'E-mail'
    }
    if (/^\+55\d{10,11}$/.test(pixKey)) {
      return 'Telefone'
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pixKey)) {
      return 'Chave Aleatória (EVP)'
    }
    return 'Tipo desconhecido'
  }

  private static calculateCRC16 (data: string): string {
    const polynomial = 0x1021
    let crc = 0xFFFF
    for (let i = 0; i < data.length; i++) {
      crc ^= (data.charCodeAt(i) << 8)
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial
        } else {
          crc <<= 1
        }
        crc &= 0xFFFF
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0')
  }
}
