import * as vscode from 'vscode'
import * as crypto from 'crypto'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'

interface PasswordOptions {
  length: number
  lowercase: boolean
  uppercase: boolean
  numbers: boolean
  symbols: boolean
  customChars?: string
  avoidAmbiguous?: boolean
  avoidSequential?: boolean
}

export class PasswordGeneratorPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['generatePassword', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'generatePassword':
      this._generatePassword(message.options as PasswordOptions)
      return
    case 'copyToClipboard':
      void this._copyToClipboard(message.text as string)
      return
    }
  }

  private _generatePassword (options: PasswordOptions): void {
    try {
      const charset = this._buildCharset(options)
      if (charset.length === 0) {
        void this.postMessage({
          command: 'passwordGenerated',
          error: 'Selecione pelo menos um tipo de caractere',
          success: false
        })
        return
      }
      const password = this._createPassword(charset, options.length)
      void this.postMessage({
        command: 'passwordGenerated',
        password: password,
        strength: this._calculateStrength(password, options),
        success: true
      })
    } catch (error) {
      console.error('Erro ao gerar senha:', error)
      void this.postMessage({
        command: 'passwordGenerated',
        error: 'Erro ao gerar senha',
        success: false
      })
    }
  }

  private _buildCharset (options: PasswordOptions): string {
    let charset = ''
    if (options.lowercase) {
      charset += 'abcdefghijklmnopqrstuvwxyz'
    }
    if (options.uppercase) {
      charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    }
    if (options.numbers) {
      charset += '0123456789'
    }
    if (options.symbols) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    }
    if (options.customChars) {
      charset += options.customChars
    }
    return charset
  }

  private _createPassword (charset: string, length: number): string {
    let password = ''
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length)
      password += charset[randomIndex]
    }
    return password
  }

  private _calculateStrength (password: string, options: PasswordOptions): string {
    let score = 0
    if (password.length >= 8) {
      score += 1
    }
    if (password.length >= 12) {
      score += 1
    }
    if (password.length >= 16) {
      score += 1
    }
    if (options.lowercase) {
      score += 1
    }
    if (options.uppercase) {
      score += 1
    }
    if (options.numbers) {
      score += 1
    }
    if (options.symbols) {
      score += 2
    }
    if (score <= 2) {
      return 'Fraca'
    }
    if (score <= 4) {
      return 'Média'
    }
    if (score <= 6) {
      return 'Forte'
    }
    return 'Muito Forte'
  }

  private async _copyToClipboard (text: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('Senha copiada para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar senha:', error)
      vscode.window.showErrorMessage('Erro ao copiar senha para a área de transferência.')
    }
  }
}
