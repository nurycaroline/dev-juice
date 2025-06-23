import * as vscode from 'vscode'

type TreeDataEvent = DevToolItem | undefined | null | void;

export class DevJuiceProvider implements vscode.TreeDataProvider<DevToolItem> {
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
            'dev-juice.generateCNPJ',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'CPF',
            'Gerar número de CPF válido',
            'dev-juice.generateCPF',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Gerador de Hash',
            'Gerar hashes MD5, SHA1, SHA256',
            'dev-juice.hashGenerator',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Gerador de Senhas',
            'Gerar senhas seguras com opções customizáveis',
            'dev-juice.passwordGenerator',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'PIX QR Code',
            'Gerar código PIX com QR Code',
            'dev-juice.generatePix',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'UUID',
            'Gerar UUID (Identificador Único Universal)',
            'dev-juice.generateUUID',
            vscode.TreeItemCollapsibleState.None
          )
          // Add more generators here as needed
        ])
      } else if (element.label === 'Formatação') {
        return Promise.resolve([
          new DevToolItem(
            'Formatador de Logs ANSI',
            'Formatar logs com códigos ANSI',
            'dev-juice.ansiFormatter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Formatador de Texto',
            'Formatar texto em vários estilos (camelCase, snake_case, etc.)',
            'dev-juice.textFormatter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Formatador JSON',
            'Formatar e validar código JSON',
            'dev-juice.formatJson',
            vscode.TreeItemCollapsibleState.None
          )
          // Add more formatting tools here as needed
        ])
      } else if (element.label === 'Conversores') {
        return Promise.resolve([
          new DevToolItem(
            'Conversor de Ângulo',
            'Converter entre diferentes unidades de ângulo',
            'dev-juice.angleConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Área',
            'Converter entre diferentes unidades de área',
            'dev-juice.areaConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Armazenamento de Dados',
            'Converter entre diferentes unidades de armazenamento de dados',
            'dev-juice.dataStorageConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Comprimento',
            'Converter entre diferentes unidades de comprimento',
            'dev-juice.lengthConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Consumo de Combustível',
            'Converter entre diferentes unidades de consumo de combustível',
            'dev-juice.fuelConsumptionConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Cores',
            'Converter entre formatos de cores (HEX, RGB, HSL)',
            'dev-juice.colorConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Energia',
            'Converter entre diferentes unidades de energia',
            'dev-juice.energyConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Força',
            'Converter entre diferentes unidades de força',
            'dev-juice.forceConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Moedas',
            'Converter entre diferentes moedas',
            'dev-juice.currencyConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Números',
            'Converter entre diferentes bases numéricas (decimal, binário, hexadecimal, etc.)',
            'dev-juice.numbersConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Peso e Massa',
            'Converter entre diferentes unidades de peso e massa',
            'dev-juice.weightConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Potência',
            'Converter entre diferentes unidades de potência',
            'dev-juice.powerConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Pressão',
            'Converter entre diferentes unidades de pressão',
            'dev-juice.pressureConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Temperatura',
            'Converter entre diferentes unidades de temperatura',
            'dev-juice.temperatureConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Tempo',
            'Converter entre diferentes unidades de tempo',
            'dev-juice.timeConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Velocidade',
            'Converter entre diferentes unidades de velocidade',
            'dev-juice.speedConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Volume',
            'Converter entre diferentes unidades de volume',
            'dev-juice.volumeConverter',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Conversor de Volume (Seco)',
            'Converter entre diferentes unidades de volume para materiais secos',
            'dev-juice.dryVolumeConverter',
            vscode.TreeItemCollapsibleState.None
          )
        ])

      } else if (element.label === 'Utilitários') {
        return Promise.resolve([

          // Utilities from second block
          new DevToolItem(
            'Calculadora de Data',
            'Calcular diferenças entre datas e formatos',
            'dev-juice.dateCalculator',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Codificador Base64',
            'Codificar/decodificar texto em Base64',
            'dev-juice.base64Encoder',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'PIX Decoder',
            'Decodificar códigos PIX QR',
            'dev-juice.pixDecoder',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'QR Code Reader',
            'Ler e decodificar códigos QR',
            'dev-juice.qrReader',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Testador de Regex',
            'Testar e validar expressões regulares',
            'dev-juice.regexTester',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'URL Encoder/Decoder',
            'Codificar e decodificar URLs',
            'dev-juice.urlEncoder',
            vscode.TreeItemCollapsibleState.None
          ),
          new DevToolItem(
            'Validador de Email',
            'Validar formato de endereços de email',
            'dev-juice.emailValidator',
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
          'Formatação',
          'Ferramentas de formatação de dados',
          '',
          vscode.TreeItemCollapsibleState.Expanded
        ),
        new DevToolItem(
          'Conversores',
          'Ferramentas para conversão entre diferentes unidades',
          '',
          vscode.TreeItemCollapsibleState.Expanded
        ),
        new DevToolItem(
          'Utilitários',
          'Ferramentas utilitárias para desenvolvimento',
          '',
          vscode.TreeItemCollapsibleState.Expanded
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
