import * as vscode from 'vscode'

/**
 * Interface para providers de webview
 */
export interface WebviewProvider {
  dispose(): void
  reveal(column?: vscode.ViewColumn): void
}

/**
 * Manager centralizado para webview panels
 * Reduz o uso de memória limitando o número de panels ativos
 */
export class WebviewManager {
  private static instance: WebviewManager
  private readonly activePanels: Map<string, vscode.WebviewPanel> = new Map()
  private readonly maxActivePanels = 3 // Limite de panels ativos

  public static getInstance (): WebviewManager {
    if (!WebviewManager.instance) {
      WebviewManager.instance = new WebviewManager()
    }
    return WebviewManager.instance
  }

  /**
   * Cria ou mostra um webview panel
   */
  public createOrShowPanel (
    id: string,
    title: string,
    column: vscode.ViewColumn | undefined,
    options: vscode.WebviewPanelOptions & vscode.WebviewOptions,
    onDispose?: () => void
  ): vscode.WebviewPanel {
    // Se o panel já existe, apenas mostra
    const existingPanel = this.activePanels.get(id)
    if (existingPanel) {
      existingPanel.reveal(column)
      return existingPanel
    }

    // Verifica se precisa fechar panels antigos para liberar memória
    this.enforceMaxPanels()

    // Cria novo panel
    const panel = vscode.window.createWebviewPanel(
      id,
      title,
      column ?? vscode.ViewColumn.One,
      options
    )

    // Adiciona ao mapa de panels ativos
    this.activePanels.set(id, panel)

    // Configura listener para limpeza quando o panel é fechado
    panel.onDidDispose(() => {
      this.activePanels.delete(id)
      if (onDispose) {
        onDispose()
      }
    })

    return panel
  }

  /**
   * Remove um panel específico
   */
  public disposePanel (id: string): void {
    const panel = this.activePanels.get(id)
    if (panel) {
      panel.dispose()
      this.activePanels.delete(id)
    }
  }

  /**
   * Obtém um panel ativo
   */
  public getPanel (id: string): vscode.WebviewPanel | undefined {
    return this.activePanels.get(id)
  }

  /**
   * Verifica se um panel está ativo
   */
  public hasPanel (id: string): boolean {
    return this.activePanels.has(id)
  }

  /**
   * Obtém a lista de panels ativos
   */
  public getActivePanels (): string[] {
    return Array.from(this.activePanels.keys())
  }

  /**
   * Força o limite máximo de panels ativos
   * Remove os panels menos recentemente usados
   */
  private enforceMaxPanels (): void {
    if (this.activePanels.size >= this.maxActivePanels) {
      // Remove o primeiro panel (mais antigo)
      const firstKey = this.activePanels.keys().next().value
      if (firstKey) {
        this.disposePanel(firstKey)
      }
    }
  }

  /**
   * Dispõe todos os panels ativos
   */
  public disposeAll (): void {
    for (const [id] of this.activePanels) {
      this.disposePanel(id)
    }
  }

  /**
   * Obtém estatísticas de uso
   */
  public getStats (): { activePanels: number; maxPanels: number } {
    return {
      activePanels: this.activePanels.size,
      maxPanels: this.maxActivePanels
    }
  }
}
