import * as vscode from 'vscode'
import { loadTemplateWithCache } from './templateCache'

/**
 * Carrega um template HTML de um arquivo com cache
 * @param extensionUri URI da extensão
 * @param templateName Nome do template (sem extensão)
 * @returns Conteúdo do template HTML
 */
export function loadTemplate (extensionUri: vscode.Uri, templateName: string): string {
  return loadTemplateWithCache(extensionUri, templateName)
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
