import * as vscode from 'vscode'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'

interface EmailValidationResult {
  isValid: boolean
  format: string
  details: string[]
  warnings: string[]
  suggestions: string[]
}

interface ValidationSummary {
  total: number
  valid: number
  invalid: number
  withWarnings: number
  validPercentage: number
}

interface EmailWithValidation {
  email: string
  validation: EmailValidationResult
}

export class EmailValidatorPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['validateEmail', 'validateBulkEmails', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'validateEmail':
      this._validateEmail(message.email as string)
      return
    case 'validateBulkEmails':
      this._validateBulkEmails(message.emails as string)
      return
    case 'copyToClipboard':
      void this._copyToClipboard(message.text as string)
      return
    }
  }

  private _validateEmail (email: string): void {
    const validation = this._performEmailValidation(email)
    void this.postMessage({
      command: 'emailValidated',
      email: email,
      validation: validation,
      success: true
    })
  }

  private _validateBulkEmails (emailsText: string): void {
    const emails = emailsText.split(/[,;\n\r]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0)
    const results = emails.map(email => ({
      email: email,
      validation: this._performEmailValidation(email)
    }))
    void this.postMessage({
      command: 'bulkEmailsValidated',
      results: results,
      summary: this._generateSummary(results),
      success: true
    })
  }

  private _performEmailValidation (email: string): EmailValidationResult {
    const result: EmailValidationResult = {
      isValid: false,
      format: 'Inválido',
      details: [],
      warnings: [],
      suggestions: []
    }

    const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isBasicValid = basicRegex.test(email)

    if (!isBasicValid) {
      result.details.push('Formato básico inválido')
      if (!email.includes('@')) {
        result.suggestions.push('Email deve conter o símbolo @')
      }
      if (!email.includes('.')) {
        result.suggestions.push('Email deve conter um domínio com ponto')
      }
      if (email.includes(' ')) {
        result.suggestions.push('Email não pode conter espaços')
      }
      return result
    }

    const [localPart, domain] = email.split('@')
    const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    const isRfcCompliant = rfcRegex.test(email)

    if (isRfcCompliant) {
      result.isValid = true
      result.format = 'Válido'
      result.details.push('Formato RFC 5322 compliant')
    } else {
      result.format = 'Formato inválido'
      result.details.push('Não está em conformidade com RFC 5322')
    }

    this._checkLocalPart(localPart, result)
    this._checkDomain(domain, result)
    this._checkCommonIssues(email, result)
    this._checkCommonDomains(domain, result)

    return result
  }

  private _checkLocalPart (localPart: string, result: EmailValidationResult): void {
    if (localPart.length > 64) {
      result.warnings.push('Parte local muito longa (máximo 64 caracteres)')
    }
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      result.warnings.push('Parte local não deve começar ou terminar com ponto')
    }
    if (localPart.includes('..')) {
      result.warnings.push('Parte local não deve conter pontos consecutivos')
    }
    const validLocalRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/
    if (!validLocalRegex.test(localPart)) {
      result.warnings.push('Parte local contém caracteres inválidos')
    }
  }

  private _checkDomain (domain: string, result: EmailValidationResult): void {
    if (domain.length > 253) {
      result.warnings.push('Domínio muito longo (máximo 253 caracteres)')
    }
    if (domain.startsWith('-') || domain.endsWith('-')) {
      result.warnings.push('Domínio não deve começar ou terminar com hífen')
    }
    if (domain.startsWith('.') || domain.endsWith('.')) {
      result.warnings.push('Domínio não deve começar ou terminar com ponto')
    }
    const domainParts = domain.split('.')
    if (domainParts.length < 2) {
      result.warnings.push('Domínio deve ter pelo menos um ponto')
    }
    const tld = domainParts[domainParts.length - 1]
    if (tld.length < 2) {
      result.warnings.push('TLD (extensão) deve ter pelo menos 2 caracteres')
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
      result.warnings.push('Domínio parece ser um IP - geralmente inválido para email')
    }
  }

  private _checkCommonIssues (email: string, result: EmailValidationResult): void {
    if ((email.match(/@/g) || []).length > 1) {
      result.warnings.push('Email contém múltiplos símbolos @')
    }
    const commonTypos = [
      { wrong: 'gmail.co', correct: 'gmail.com' },
      { wrong: 'gmail.cm', correct: 'gmail.com' },
      { wrong: 'gamil.com', correct: 'gmail.com' },
      { wrong: 'gmai.com', correct: 'gmail.com' },
      { wrong: 'yahoo.co', correct: 'yahoo.com' },
      { wrong: 'hotmial.com', correct: 'hotmail.com' },
      { wrong: 'hotmai.com', correct: 'hotmail.com' },
      { wrong: 'outlok.com', correct: 'outlook.com' }
    ]
    const domain = email.split('@')[1]
    const typo = commonTypos.find(t => domain === t.wrong)
    if (typo) {
      result.suggestions.push(`Você quis dizer ${email.replace(typo.wrong, typo.correct)}?`)
    }
  }

  private _checkCommonDomains (domain: string, result: EmailValidationResult): void {
    const providers: { [key: string]: string } = {
      'gmail.com': 'Google Gmail',
      'yahoo.com': 'Yahoo Mail',
      'yahoo.com.br': 'Yahoo Brasil',
      'hotmail.com': 'Microsoft Hotmail',
      'outlook.com': 'Microsoft Outlook',
      'live.com': 'Microsoft Live',
      'msn.com': 'Microsoft MSN',
      'terra.com.br': 'Terra Brasil',
      'uol.com.br': 'UOL Brasil',
      'globo.com': 'Globo',
      'ig.com.br': 'iG Brasil',
      'bol.com.br': 'BOL Brasil'
    }
    const provider = providers[domain.toLowerCase()]
    if (provider) {
      result.details.push(`Provedor: ${provider}`)
    }
  }

  private _generateSummary (results: EmailWithValidation[]): ValidationSummary {
    const total = results.length
    const valid = results.filter(r => r.validation.isValid).length
    const invalid = total - valid
    const withWarnings = results.filter(r => r.validation.warnings.length > 0).length
    return {
      total,
      valid,
      invalid,
      withWarnings,
      validPercentage: Math.round((valid / total) * 100)
    }
  }

  private async _copyToClipboard (text: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('Texto copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar texto:', error)
      vscode.window.showErrorMessage('Erro ao copiar texto para a área de transferência.')
    }
  }
}
