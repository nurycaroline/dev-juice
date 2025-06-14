import * as vscode from 'vscode'
import { loadTemplate } from '../utils/templateLoader'

/**
 * Provider for the Email Validator webview panel
 */
export class EmailValidatorProvider {
  /**
     * Track the currently active panels. Only allow a single panel to exist at a time.
     */
  public static currentPanel: EmailValidatorProvider | undefined

  public static readonly viewType = 'emailValidator'

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private readonly _disposables: vscode.Disposable[] = []

  public static createOrShow (extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (EmailValidatorProvider.currentPanel) {
      EmailValidatorProvider.currentPanel._panel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      EmailValidatorProvider.viewType,
      'Validador de Email',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src', 'templates')
        ]
      }
    )

    EmailValidatorProvider.currentPanel = new EmailValidatorProvider(panel, extensionUri)
  }

  private constructor (panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._extensionUri = extensionUri

    // Set the webview's initial html content
    this._update()

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
        case 'validateEmail':
          this._validateEmail(message.email)
          return
        case 'validateBulkEmails':
          this._validateBulkEmails(message.emails)
          return
        case 'copyToClipboard':
          this._copyToClipboard(message.text)
          return
        }
      },
      null,
      this._disposables
    )
  }

  /**
     * Validates a single email address
     */
  private _validateEmail (email: string) {
    const validation = this._performEmailValidation(email)

    this._panel.webview.postMessage({
      command: 'emailValidated',
      email: email,
      validation: validation,
      success: true
    })
  }

  /**
     * Validates multiple email addresses
     */
  private _validateBulkEmails (emailsText: string) {
    const emails = emailsText.split(/[,;\n\r]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0)

    const results = emails.map(email => ({
      email: email,
      validation: this._performEmailValidation(email)
    }))

    this._panel.webview.postMessage({
      command: 'bulkEmailsValidated',
      results: results,
      summary: this._generateSummary(results),
      success: true
    })
  }

  /**
     * Performs detailed email validation
     */
  private _performEmailValidation (email: string): any {
    const result = {
      isValid: false,
      format: 'Inválido',
      details: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[]
    }

    // Basic format validation
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

    // More detailed validation
    const [localPart, domain] = email.split('@')

    // RFC 5322 compliant regex (simplified)
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

    // Additional checks
    this._checkLocalPart(localPart, result)
    this._checkDomain(domain, result)
    this._checkCommonIssues(email, result)
    this._checkCommonDomains(domain, result)

    return result
  }

  /**
     * Validates the local part (before @)
     */
  private _checkLocalPart (localPart: string, result: any) {
    if (localPart.length > 64) {
      result.warnings.push('Parte local muito longa (máximo 64 caracteres)')
    }

    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      result.warnings.push('Parte local não deve começar ou terminar com ponto')
    }

    if (localPart.includes('..')) {
      result.warnings.push('Parte local não deve conter pontos consecutivos')
    }

    // Check for valid characters in local part
    const validLocalRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/
    if (!validLocalRegex.test(localPart)) {
      result.warnings.push('Parte local contém caracteres inválidos')
    }
  }

  /**
     * Validates the domain part (after @)
     */
  private _checkDomain (domain: string, result: any) {
    if (domain.length > 253) {
      result.warnings.push('Domínio muito longo (máximo 253 caracteres)')
    }

    if (domain.startsWith('-') || domain.endsWith('-')) {
      result.warnings.push('Domínio não deve começar ou terminar com hífen')
    }

    if (domain.startsWith('.') || domain.endsWith('.')) {
      result.warnings.push('Domínio não deve começar ou terminar com ponto')
    }

    // Check for valid domain format
    const domainParts = domain.split('.')
    if (domainParts.length < 2) {
      result.warnings.push('Domínio deve ter pelo menos um ponto')
    }

    // Check TLD
    const tld = domainParts[domainParts.length - 1]
    if (tld.length < 2) {
      result.warnings.push('TLD (extensão) deve ter pelo menos 2 caracteres')
    }

    // Check for numeric-only domain (usually invalid)
    if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
      result.warnings.push('Domínio parece ser um IP - geralmente inválido para email')
    }
  }

  /**
     * Checks for common email issues
     */
  private _checkCommonIssues (email: string, result: any) {
    // Multiple @ symbols
    if ((email.match(/@/g) || []).length > 1) {
      result.warnings.push('Email contém múltiplos símbolos @')
    }

    // Common typos in domains
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
  }    /**
     * Provides information about common email providers
     */
  private _checkCommonDomains (domain: string, result: any) {
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

  /**
     * Generates summary for bulk validation
     */
  private _generateSummary (results: any[]) {
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

  /**
     * Copies text to clipboard
     */
  private async _copyToClipboard (text: string) {
    try {
      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('Texto copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar texto:', error)
      vscode.window.showErrorMessage('Erro ao copiar texto para a área de transferência.')
    }
  }

  public dispose () {
    EmailValidatorProvider.currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()

    while (this._disposables.length) {
      const x = this._disposables.pop()
      if (x) {
        x.dispose()
      }
    }
  }
  private _update () {
    this._panel.webview.html = loadTemplate(this._extensionUri, 'email-validator.html')
  }
}
