import * as QRCode from 'qrcode'

/**
 * Interface para os dados do PIX
 */
export interface PixData {
    /** Chave PIX (CPF, CNPJ, email, telefone ou chave aleatória) */
    pixKey: string;
    /** Nome do recebedor */
    merchantName: string;
    /** Cidade do recebedor */
    merchantCity: string;
    /** Valor da transação (opcional) */
    amount?: number;
    /** Descrição da transação (opcional) */
    description?: string;
    /** ID da transação (opcional) */
    txId?: string;
}

/**
 * Classe para gerar códigos PIX
 */
export class PixGenerator {
    
  /**
     * Gera um código PIX EMV baseado nos dados fornecidos
     */
  static generatePixCode (data: PixData): string {
    const payload = this.buildPixPayload(data)
    const crc = this.calculateCRC16(payload + '6304')
    return payload + '6304' + crc
  }

  /**
     * Constrói o payload PIX
     */
  private static buildPixPayload (data: PixData): string {
    let payload = ''
        
    // Payload Format Indicator (obrigatório)
    payload += '000201'
        
    // Point of Initiation Method (opcional, mas recomendado para PIX estático)
    payload += '010212'
        
    // Merchant Account Information (chave PIX)
    const merchantAccountInfo = this.buildMerchantAccountInfo(data.pixKey, data.description, data.txId)
    payload += '26' + this.formatLength(merchantAccountInfo.length) + merchantAccountInfo
        
    // Merchant Category Code (obrigatório, 0000 para pessoa física)
    payload += '52040000'
        
    // Transaction Currency (986 = BRL)
    payload += '5303986'
        
    // Transaction Amount (opcional)
    if (data.amount && data.amount > 0) {
      const amountStr = data.amount.toFixed(2)
      payload += '54' + this.formatLength(amountStr.length) + amountStr
    }
        
    // Country Code (BR)
    payload += '5802BR'
        
    // Merchant Name
    const merchantName = data.merchantName.substring(0, 25) // Máximo 25 caracteres
    payload += '59' + this.formatLength(merchantName.length) + merchantName
        
    // Merchant City
    const merchantCity = data.merchantCity.substring(0, 15) // Máximo 15 caracteres
    payload += '60' + this.formatLength(merchantCity.length) + merchantCity
        
    // Additional Data Field Template (opcional)
    if (data.description) {
      const additionalData = this.buildAdditionalDataField(data.description)
      payload += '62' + this.formatLength(additionalData.length) + additionalData
    }
        
    return payload
  }

  /**
     * Constrói as informações da conta do comerciante (chave PIX)
     */
  private static buildMerchantAccountInfo (pixKey: string, description?: string): string {
    let merchantInfo = ''
        
    // GUI (Globally Unique Identifier) para PIX
    merchantInfo += '0014BR.GOV.BCB.PIX'
        
    // Chave PIX
    merchantInfo += '01' + this.formatLength(pixKey.length) + pixKey
        
    // Descrição (opcional)
    if (description) {
      const desc = description.substring(0, 72) // Máximo 72 caracteres
      merchantInfo += '02' + this.formatLength(desc.length) + desc
    }
        
    return merchantInfo
  }

  /**
     * Constrói o campo de dados adicionais
     */
  private static buildAdditionalDataField (description: string): string {
    const desc = description.substring(0, 72) // Máximo 72 caracteres
    return '05' + this.formatLength(desc.length) + desc
  }

  /**
     * Formata o comprimento para 2 dígitos
     */
  private static formatLength (length: number): string {
    return length.toString().padStart(2, '0')
  }

  /**
     * Calcula o CRC16 para validação do código PIX
     */
  private static calculateCRC16 (data: string): string {
    const polynomial = 0x1021
    let crc = 0xFFFF
        
    for (let i = 0; i < data.length; i++) {
      crc ^= (data.charCodeAt(i) << 8)
            
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial
        } else {
          crc = crc << 1
        }
        crc &= 0xFFFF
      }
    }
        
    return crc.toString(16).toUpperCase().padStart(4, '0')
  }

  /**
     * Gera um QR Code a partir do código PIX
     */
  static async generatePixQRCode (data: PixData): Promise<string> {
    const pixCode = this.generatePixCode(data)
        
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(pixCode, {
        type: 'image/png',
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
            
      return qrCodeDataUrl
    } catch (error) {
      throw new Error('Erro ao gerar QR Code: ' + error)
    }
  }

  /**
     * Valida se uma chave PIX tem formato válido
     */
  static validatePixKey (pixKey: string): { isValid: boolean; type: string } {
    const trimmedKey = pixKey.trim()
        
    // CPF (11 dígitos)
    if (/^\d{11}$/.test(trimmedKey)) {
      return { isValid: true, type: 'CPF' }
    }
        
    // CNPJ (14 dígitos)
    if (/^\d{14}$/.test(trimmedKey)) {
      return { isValid: true, type: 'CNPJ' }
    }
        
    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedKey)) {
      return { isValid: true, type: 'Email' }
    }
        
    // Telefone (+5511999999999)
    if (/^\+55\d{10,11}$/.test(trimmedKey)) {
      return { isValid: true, type: 'Telefone' }
    }
        
    // Chave aleatória (UUID)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedKey)) {
      return { isValid: true, type: 'Chave Aleatória' }
    }
        
    return { isValid: false, type: 'Inválida' }
  }
}
