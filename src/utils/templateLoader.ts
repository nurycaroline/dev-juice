import * as vscode from 'vscode'
import * as fs from 'fs'
import { generateNonce } from './securityUtils'

// Cache para templates carregados
const templateCache: Record<string, string> = {}

/**
 * Carrega um template HTML de um arquivo com cache
 * @param extensionUri URI da extensão
 * @param templateName Nome do template (sem extensão)
 * @returns Conteúdo do template HTML
 */
function loadTemplateWithCache (extensionUri: vscode.Uri, templateName: string): string {
  const cacheKey = `${templateName}`
  
  // Verifica se o template já está no cache
  if (templateCache[cacheKey]) {
    return templateCache[cacheKey]
  }
  
  // Monta o caminho para o arquivo de template
  const templatePath = vscode.Uri.joinPath(extensionUri, 'src', 'templates', `${templateName}.html`)
  
  try {
    // Lê o arquivo do template
    const fileContent = fs.readFileSync(templatePath.fsPath, 'utf8')
    
    // Armazena no cache para uso futuro
    templateCache[cacheKey] = fileContent
    
    return fileContent
  } catch (error) {
    console.error(`Erro ao carregar template ${templateName}:`, error)
    throw new Error(`Não foi possível carregar o template ${templateName}`)
  }
}

/**
 * Limpa o cache de templates
 */
export function clearTemplateCache (): void {
  Object.keys(templateCache).forEach(key => {
    delete templateCache[key]
  })
}

/**
 * Carrega um template HTML de um arquivo com cache
 * @param extensionUri URI da extensão
 * @param templateName Nome do template (sem extensão)
 * @returns Conteúdo do template HTML com CSP aplicado
 */
export function loadTemplate (extensionUri: vscode.Uri, templateName: string): string {
  const rawTemplate = loadTemplateWithCache(extensionUri, templateName)
  const nonce = generateNonce()
  
  // Adiciona Content Security Policy ao template
  return insertCSP(rawTemplate, extensionUri, nonce)
}

/**
 * Insere Content Security Policy em um template HTML
 * @param template Template HTML original
 * @param extensionUri URI da extensão para uso no CSP
 * @param nonce Nonce para uso nos scripts
 * @returns Template com CSP aplicado
 */
function insertCSP (template: string, extensionUri: vscode.Uri, nonce: string): string {  // Define o CSP
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' vscode-resource:; img-src vscode-resource: https:; script-src 'nonce-${nonce}';">`
  
  // Adiciona o nonce a todos os scripts no template
  let processedTemplate = template.replace(/<script/g, `<script nonce="${nonce}"`)
  
  // Insere a meta tag CSP no cabeçalho do HTML
  const headRegex = /<head>[\s\S]*?<\/head>/
  const headMatch = headRegex.exec(processedTemplate)
  if (headMatch) {
    const head = headMatch[0]
    const newHead = head.replace('<head>', `<head>\n    ${csp}`)
    processedTemplate = processedTemplate.replace(head, newHead)
  } else {
    // Se não encontrar a tag head, adiciona no início do documento
    processedTemplate = processedTemplate.replace(/<!DOCTYPE html>/i, `<!DOCTYPE html>\n<head>\n    ${csp}\n</head>`)
  }
  
  return processedTemplate
}

/**
 * Processa um template HTML substituindo placeholders
 * @param template Conteúdo do template
 * @param variables Objeto com variáveis para substituição
 * @returns Template processado
 */
export function processTemplate (template: string, variables: Record<string, string> = {}): string {
  let processedTemplate = template
    
  // Substitui variáveis no formato {{variableName}}
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g')
    processedTemplate = processedTemplate.replace(placeholder, value)
  }
    
  return processedTemplate
}

/**
 * Carrega e processa um template HTML
 * @param extensionUri URI da extensão
 * @param templateName Nome do template
 * @param variables Variáveis para substituição
 * @returns Template processado
 */
export function loadAndProcessTemplate (
  extensionUri: vscode.Uri, 
  templateName: string, 
  variables: Record<string, string> = {}
): string {
  const template = loadTemplate(extensionUri, templateName)
  return processTemplate(template, variables)
}
