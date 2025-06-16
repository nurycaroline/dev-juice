import * as vscode from 'vscode'

type TreeDataEvent = DevToolItem | undefined | null | void;

export class DevHelperProvider implements vscode.TreeDataProvider<DevToolItem> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeDataEvent> = new vscode.EventEmitter<TreeDataEvent>()
  readonly onDidChangeTreeData: vscode.Event<TreeDataEvent> = this._onDidChangeTreeData.event

  refresh (): void {
    this._onDidChangeTreeData.fire()
  }


  getTreeItem (element: DevToolItem): vscode.TreeItem {
    return element
  }

  getChildren (element?: DevToolItem): Thenable<DevToolItem[]> {
    if (element) {
      if (element.label === 'Geradores') {
        return Promise.resolve([
          new DevToolItem(
            'CNPJ',
            'Gerar número de CNPJ válido',
            'dev-helper.generateCNPJ',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'CPF',
            'Gerar número de CPF válido',
            'dev-helper.generateCPF',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Gerador de Hash',
            'Gerar hashes MD5, SHA1, SHA256',
            'dev-helper.hashGenerator',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Gerador de Senhas',
            'Gerar senhas seguras com opções customizáveis',
            'dev-helper.passwordGenerator',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'PIX QR Code',
            'Gerar código PIX com QR Code',
            'dev-helper.generatePix',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'UUID',
            'Gerar UUID (Identificador Único Universal)',
            'dev-helper.generateUUID',
            vscode.TreeItemCollapsibleState.None
          )
          // Add more generators here as needed
        ])
      } else if (element.label === 'Utilitários') {
        return Promise.resolve([
          new DevToolItem(
            'Calculadora de Data',
            'Calcular diferenças entre datas e formatos',
            'dev-helper.dateCalculator',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Codificador Base64',
            'Codificar/decodificar texto em Base64',
            'dev-helper.base64Encoder',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Cores',
            'Converter entre formatos de cores (HEX, RGB, HSL)',
            'dev-helper.colorConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Formatação de texto',
            'Formatar texto em vários estilos (camelCase, snake_case, etc.)',
            'dev-helper.textFormatter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Formatador JSON',
            'Formatar e validar código JSON',
            'dev-helper.formatJson',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'PIX Decoder',
            'Decodificar códigos PIX QR',
            'dev-helper.pixDecoder',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'QR Code Reader',
            'Ler e decodificar códigos QR',
            'dev-helper.qrReader',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'URL Encoder/Decoder',
            'Codificar e decodificar URLs',
            'dev-helper.urlEncoder',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Validador de Email',
            'Validar formato de endereços de email',
            'dev-helper.emailValidator',
            vscode.TreeItemCollapsibleState.None
          )
          // Add more utilities here as needed
        ])
      }
      return Promise.resolve([])
    } else {
      // Root level items
      return Promise.resolve([
        new DevToolItem(
          'Geradores',
          'Ferramentas para geração de dados',
          '',
          vscode.TreeItemCollapsibleState.Expanded
        ),
        new DevToolItem(
          'Utilitários',
          'Ferramentas utilitárias para desenvolvimento',
          '',
          vscode.TreeItemCollapsibleState.Collapsed
        )
        // Add more categories here as needed
      ])
    }
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
