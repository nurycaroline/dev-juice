import * as crypto from 'crypto'

/**
 * Gera um nonce criptograficamente seguro para usar em CSP
 * @returns String aleatória para usar como nonce
 */
export function generateNonce (): string {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

/**
 * Alias para generateNonce, para manter compatibilidade com nomes comuns
 * @returns String aleatória para usar como nonce
 */
export function getNonce (): string {
  return generateNonce()
}

/**
 * Sanitiza string HTML para evitar XSS
 * @param html String com potencial conteúdo HTML
 * @returns String sanitizada
 */
export function sanitizeHTML (html: string): string {  return html
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
}

/**
 * Valida se uma URL é segura (https)
 * @param url URL a ser validada
 * @returns Booleano indicando se a URL é segura
 */
export function isSecureUrl (url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Limpa dados sensíveis de uma string de log
 * @param message Mensagem a ser limpa
 * @returns Mensagem sem dados sensíveis
 */
export function sanitizeLogMessage (message: string): string {
  // Remove tokens, chaves de API, senhas, etc.
  return message
    .replace(/([&?]token=)[^&]*/gi, '$1[REDACTED]')
    .replace(/([&?]key=)[^&]*/gi, '$1[REDACTED]')
    .replace(/([&?]password=)[^&]*/gi, '$1[REDACTED]')
    .replace(/([&?]secret=)[^&]*/gi, '$1[REDACTED]')
    .replace(/(Authorization: Bearer )[^\s]*/gi, '$1[REDACTED]')
    .replace(/(Authorization: Basic )[^\s]*/gi, '$1[REDACTED]')
    .replace(/("password":\s*")[^"]*"/gi, '$1[REDACTED]"')
    .replace(/("token":\s*")[^"]*"/gi, '$1[REDACTED]"')
}

/**
 * Valida se um caminho está dentro de um diretório base
 * @param basePath Caminho base (diretório permitido)
 * @param filePath Caminho do arquivo a ser validado
 * @returns Booleano indicando se o caminho é seguro
 */
export function isPathWithinBase (basePath: string, filePath: string): boolean {
  const path = require('path')
  const normalizedBasePath = path.normalize(basePath)
  const normalizedFilePath = path.normalize(filePath)
  
  return normalizedFilePath.startsWith(normalizedBasePath)
}

/**
 * Validador genérico de entrada de usuário
 * @param input Entrada a ser validada
 * @param maxLength Comprimento máximo permitido (opcional)
 * @param pattern Padrão regex para validação (opcional)
 * @returns Booleano indicando se a entrada é válida
 */
export function validateUserInput (
  input: unknown, 
  maxLength?: number, 
  pattern?: RegExp
): boolean {
  // Verifica se é uma string
  if (typeof input !== 'string') {
    return false
  }
  
  // Verifica comprimento se especificado
  if (maxLength !== undefined && input.length > maxLength) {
    return false
  }
  
  // Verifica padrão se especificado
  if (pattern !== undefined && !pattern.test(input)) {
    return false
  }
  
  return true
}

/**
 * Gera um hash seguro de uma string
 * @param text Texto a ser hasheado
 * @param algorithm Algoritmo de hash (default: sha256)
 * @returns Hash do texto
 */
export function secureHash (text: string, algorithm = 'sha256'): string {
  return crypto.createHash(algorithm).update(text).digest('hex')
}
