import * as vscode from 'vscode'
import { insertText } from '../utils/insertUtils'
import { loadTemplate } from '../utils/templateLoader'

/**
 * Interface for PIX merchant information
 */
interface PixMerchantInfo {
  gui?: string;
  pixKey?: string;
  keyType?: string;
  name?: string;
  city?: string;
  additionalInfo?: string;
  unknownFields?: Record<string, string>;
}

/**
 * Interface for PIX transaction information
 */
interface PixTransactionInfo {
  categoryCode?: string;
  currency?: string;
  currencyName?: string;
  amount?: number;
  countryCode?: string;
}

/**
 * Interface for PIX additional information
 */
interface PixAdditionalInfo {
  referenceLabel?: string;
  paymentSystemTemplate?: string;
  unknownFields?: Record<string, string>;
}

/**
 * Interface for decoded PIX data
 */
interface DecodedPixData {
  version: string;
  initMethod: string;
  merchantInfo: PixMerchantInfo;
  transactionInfo: PixTransactionInfo;
  additionalInfo: PixAdditionalInfo;
  crc: string;
  crcValid?: boolean;
  unknownFields?: Record<string, string>;
}

export class PixDecoderProvider {
  // Making currentPanel readonly to fix SonarLint warning
  private static currentPanel: vscode.WebviewPanel | undefined

  public static createOrShow (extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (PixDecoderProvider.currentPanel) {
      PixDecoderProvider.currentPanel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      'pixDecoder',
      'PIX QR Code Decoder',
      column ?? vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src', 'templates')
        ]
      }
    )

    PixDecoderProvider.currentPanel = panel        // Set the webview's initial html content
    panel.webview.html = PixDecoderProvider.getWebviewContent(extensionUri)

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
        case 'decodePixString':
          PixDecoderProvider.handleDecodePixString(message.pixCode)
          break
        case 'decodeQrImage':
          PixDecoderProvider.handleDecodeQrImage(message.imageData)
          break
        case 'insertInEditor':
          insertText(message.text)
          break
        case 'copyToClipboard':
          vscode.env.clipboard.writeText(message.text)
          vscode.window.showInformationMessage('Dados do PIX copiados para a área de transferência!')
          break
        }
      },
      undefined
    )

    // Listen for when the panel is disposed
    panel.onDidDispose(
      () => {
        PixDecoderProvider.currentPanel = undefined
      },
      null
    )
  }
  private static handleDecodePixString (pixCode: string): void {
    const panel = PixDecoderProvider.currentPanel
    if (!panel) {
      return
    }

    try {
      const decodedData = PixDecoderProvider.decodePixPayload(pixCode)
      panel.webview.postMessage({
        command: 'pixDecodeResult',
        result: decodedData,
        success: true
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      panel.webview.postMessage({
        command: 'pixDecodeResult',
        result: { error: errorMessage },
        success: false
      })
    }
  }

  private static handleDecodeQrImage (imageData: string): void {
    const panel = PixDecoderProvider.currentPanel
    if (!panel) {
      return
    }

    // Send message to webview to process the QR code using jsQR
    panel.webview.postMessage({
      command: 'processPixQrCode',
      imageData: imageData
    })
  } private static decodePixPayload (payload: string): DecodedPixData {
    // Remove whitespace and validate basic format
    const cleanPayload = payload.trim()

    if (!cleanPayload) {
      throw new Error('Código PIX vazio')
    }      // Check if it's a valid PIX payload (should start with specific patterns)
    // More flexible regex to accept different PIX formats
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
      while (index < cleanPayload.length - 4) { // -4 for CRC at the end
        if (index + 4 > cleanPayload.length) {
          break // Not enough data for tag and length
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
        case '00': // Payload Format Indicator
          result.version = value
          break
        case '01': // Point of Initiation Method
          result.initMethod = value
          break
        case '26': // Merchant Account Information (PIX)
          result.merchantInfo = PixDecoderProvider.parsePixMerchantInfo(value)
          break
        case '52': // Merchant Category Code
          result.transactionInfo.categoryCode = value
          break
        case '53': // Transaction Currency
          result.transactionInfo.currency = value
          result.transactionInfo.currencyName = value === '986' ? 'BRL (Real Brasileiro)' : value
          break
        case '54': // Transaction Amount
          result.transactionInfo.amount = parseFloat(value)
          break
        case '58': // Country Code
          result.transactionInfo.countryCode = value
          break
        case '59': // Merchant Name
          result.merchantInfo.name = value
          break
        case '60': // Merchant City
          result.merchantInfo.city = value
          break
        case '62': // Additional Data Field Template
          result.additionalInfo = PixDecoderProvider.parseAdditionalInfo(value)
          break
        case '63': // CRC16
          result.crc = value
          break
        default:
          // Store unknown fields
          result.unknownFields ??= {}
          result.unknownFields[id] = value
          break
        }

        index += 4 + length
      }      // Validate CRC
      if (result.crc) {
        const payloadWithoutCrc = cleanPayload.substring(0, cleanPayload.length - 4)
        const calculatedCrc = PixDecoderProvider.calculateCRC16(payloadWithoutCrc)
        result.crcValid = result.crc.toUpperCase() === calculatedCrc.toUpperCase()
      } else if (cleanPayload.length >= 4) {
        // If no CRC found, try to extract from the end of the payload
        const lastTag = cleanPayload.substring(cleanPayload.length - 8, cleanPayload.length - 6)
        if (lastTag === '63') {
          result.crc = cleanPayload.substring(cleanPayload.length - 4)
          const payloadWithoutCrc = cleanPayload.substring(0, cleanPayload.length - 8)
          const calculatedCrc = PixDecoderProvider.calculateCRC16(payloadWithoutCrc + '6304')
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
      case '00': // GUI
        info.gui = fieldValue
        break
      case '01': // PIX Key
        info.pixKey = fieldValue
        info.keyType = PixDecoderProvider.detectPixKeyType(fieldValue)
        break
      case '02': // Additional Info
        info.additionalInfo = fieldValue
        break
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
      case '05': // Reference Label
        info.referenceLabel = fieldValue
        break
      case '50': // Payment System Specific Template
        info.paymentSystemTemplate = fieldValue
        break
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
    // CPF/CNPJ pattern
    if (/^\d{11}$/.test(pixKey)) {
      return 'CPF'
    }
    if (/^\d{14}$/.test(pixKey)) {
      return 'CNPJ'
    }

    // Email pattern
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
      return 'E-mail'
    }

    // Phone pattern
    if (/^\+55\d{10,11}$/.test(pixKey)) {
      return 'Telefone'
    }

    // UUID pattern (EVP)
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
  } private static getWebviewContent (extensionUri: vscode.Uri): string {
    return loadTemplate(extensionUri, 'pix-decoder')
  }
}
