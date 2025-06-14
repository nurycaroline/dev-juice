import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Cache global para templates HTML carregados
 */
class TemplateCache {  private static instance: TemplateCache
  private readonly cache: Map<string, string> = new Map()

  public static getInstance (): TemplateCache {
    if (!TemplateCache.instance) {
      TemplateCache.instance = new TemplateCache()
    }
    return TemplateCache.instance
  }

  /**
   * Carrega um template com cache
   */
  public loadTemplate (extensionUri: vscode.Uri, templateName: string): string {
    const cacheKey = `${extensionUri.fsPath}/${templateName}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const templatePath = path.join(extensionUri.fsPath, 'src', 'templates', `${templateName}.html`)
    
    try {
      const content = fs.readFileSync(templatePath, 'utf8')
      this.cache.set(cacheKey, content)
      return content
    } catch (error) {
      console.error(`Erro ao carregar template ${templateName}:`, error)
      const fallback = `<html><body><h1>Erro ao carregar template</h1><p>Template ${templateName} não encontrado.</p></body></html>`
      this.cache.set(cacheKey, fallback)
      return fallback
    }
  }

  /**
   * Limpa o cache (útil para desenvolvimento)
   */
  public clearCache (): void {
    this.cache.clear()
  }

  /**
   * Remove um template específico do cache
   */
  public removeFromCache (extensionUri: vscode.Uri, templateName: string): void {
    const cacheKey = `${extensionUri.fsPath}/${templateName}`
    this.cache.delete(cacheKey)
  }
}

/**
 * Função helper para usar o cache de templates
 */
export function loadTemplateWithCache (extensionUri: vscode.Uri, templateName: string): string {
  return TemplateCache.getInstance().loadTemplate(extensionUri, templateName)
}

export { TemplateCache }
