import * as vscode from 'vscode'
import { getToolsByCategory, ToolCategory, ToolDefinition } from '../tools/toolRegistry'

type TreeDataEvent = DevToolItem | undefined | null | void

const CATEGORY_DESCRIPTIONS: Record<ToolCategory, string> = {
  Geradores: 'Ferramentas para geração de dados',
  Formatação: 'Ferramentas de formatação de dados',
  Conversores: 'Ferramentas para conversão entre diferentes unidades',
  Utilitários: 'Ferramentas utilitárias para desenvolvimento'
}

export class DevJuiceProvider implements vscode.TreeDataProvider<DevToolItem> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeDataEvent> = new vscode.EventEmitter<TreeDataEvent>()
  readonly onDidChangeTreeData: vscode.Event<TreeDataEvent> = this._onDidChangeTreeData.event

  /**
   * @param groupsProvider fonte das ferramentas agrupadas por categoria.
   * Default: o registro único. Injetável para testes (ex.: registro vazio).
   */
  constructor (
    private readonly groupsProvider: () => Map<ToolCategory, ToolDefinition[]> = getToolsByCategory
  ) {}

  refresh (): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem (element: DevToolItem): vscode.TreeItem {
    return element
  }

  getChildren (element?: DevToolItem): Thenable<DevToolItem[]> {
    const groups = this.groupsProvider()

    if (!element) {
      const categories: DevToolItem[] = []
      for (const category of groups.keys()) {
        categories.push(new DevToolItem(
          category,
          CATEGORY_DESCRIPTIONS[category] ?? '',
          '',
          vscode.TreeItemCollapsibleState.Expanded
        ))
      }
      return Promise.resolve(categories)
    }

    const tools = groups.get(element.label as ToolCategory)
    if (!tools) {
      return Promise.resolve([])
    }

    return Promise.resolve(tools.map(tool => new DevToolItem(
      tool.title,
      tool.description,
      tool.command,
      vscode.TreeItemCollapsibleState.None
    )))
  }
}

export class DevToolItem extends vscode.TreeItem {
  constructor (
    public readonly label: string,
    public readonly tooltip: string,
    public readonly commandId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly iconType: string = 'key',
    public readonly showIcon: boolean = false
  ) {
    super(label, collapsibleState)

    this.tooltip = tooltip

    if (commandId) {
      this.command = {
        command: commandId,
        title: label
      }
    }

    if (showIcon) {
      this.iconPath = new vscode.ThemeIcon(iconType)
    }
  }

  contextValue = 'devTool'
}
