import type * as vscode from 'vscode'

export type ToolCategory = 'Geradores' | 'Conversores' | 'Formatação' | 'Utilitários'

/**
 * Construtor de uma subclasse de painel com lógica no host.
 * A base instancia via `new Ctor(panel, extensionUri)`.
 */
export type PanelConstructor = new (
  panel: vscode.WebviewPanel,
  extensionUri: vscode.Uri
) => object

export interface ToolDefinition {
  /** id do comando, ex.: 'dev-juice.lengthConverter' — imutável (compat com keybindings) */
  command: string
  /** Título do painel e do item da tree, ex.: 'Conversor de Comprimento' */
  title: string
  /** Tooltip exibido no item da tree view */
  description: string
  category: ToolCategory
  /** Codicon (sem o wrapper `$(...)`), ex.: 'symbol-ruler' */
  icon: string
  /** Nome do template em src/templates (sem .html) */
  template: string
  /**
   * Ausente → painel declarativo (BaseWebviewPanel direto, lógica vive no template).
   * Presente → lazy require da subclasse (preserva o padrão lazyProviders atual).
   */
  factory?: () => PanelConstructor
}

const tools: readonly ToolDefinition[] = [
  // ── Geradores ────────────────────────────────────────────────────────────
  {
    command: 'dev-juice.generateCNPJ',
    title: 'Gerador de CNPJ',
    description: 'Gerar número de CNPJ válido',
    category: 'Geradores',
    icon: 'key',
    template: 'cnpj-generator',
    factory: () => require('../panels/tools/cnpjPanel').CnpjPanel
  },
  {
    command: 'dev-juice.generateCPF',
    title: 'Gerador de CPF',
    description: 'Gerar número de CPF válido',
    category: 'Geradores',
    icon: 'key',
    template: 'cpf-generator',
    factory: () => require('../panels/tools/cpfPanel').CpfPanel
  },
  {
    command: 'dev-juice.hashGenerator',
    title: 'Gerador de Hash',
    description: 'Gerar hashes MD5, SHA1, SHA256',
    category: 'Geradores',
    icon: 'key',
    template: 'hash-generator',
    factory: () => require('../panels/tools/hashGeneratorPanel').HashGeneratorPanel
  },
  {
    command: 'dev-juice.passwordGenerator',
    title: 'Gerador de Senhas',
    description: 'Gerar senhas seguras com opções customizáveis',
    category: 'Geradores',
    icon: 'shield',
    template: 'password-generator',
    factory: () => require('../panels/tools/passwordGeneratorPanel').PasswordGeneratorPanel
  },
  {
    command: 'dev-juice.generatePix',
    title: 'Gerador de PIX QR Code',
    description: 'Gerar código PIX com QR Code',
    category: 'Geradores',
    icon: 'credit-card',
    template: 'pix-generator',
    factory: () => require('../panels/tools/pixGeneratorPanel').PixGeneratorPanel
  },
  {
    command: 'dev-juice.generateUUID',
    title: 'Gerador de UUID',
    description: 'Gerar UUID (Identificador Único Universal)',
    category: 'Geradores',
    icon: 'key',
    template: 'uuid-generator',
    factory: () => require('../panels/tools/uuidPanel').UuidPanel
  },

  // ── Formatação ───────────────────────────────────────────────────────────
  {
    command: 'dev-juice.ansiFormatter',
    title: 'Formatador de Logs ANSI',
    description: 'Formatar logs com códigos ANSI',
    category: 'Formatação',
    icon: 'terminal',
    template: 'ansi-formatter',
    factory: () => require('../panels/tools/ansiFormatterPanel').AnsiFormatterPanel
  },
  {
    command: 'dev-juice.textFormatter',
    title: 'Formatação de Texto',
    description: 'Formatar texto em vários estilos (camelCase, snake_case, etc.)',
    category: 'Formatação',
    icon: 'symbol-string',
    template: 'text-formatter',
    factory: () => require('../panels/tools/textFormatterPanel').TextFormatterPanel
  },
  {
    command: 'dev-juice.formatJson',
    title: 'Formatador JSON',
    description: 'Formatar e validar código JSON',
    category: 'Formatação',
    icon: 'json',
    template: 'json-formatter',
    factory: () => require('../panels/tools/jsonFormatterPanel').JsonFormatterPanel
  },

  // ── Conversores (declarativos: lógica vive no template) ──────────────────
  {
    command: 'dev-juice.angleConverter',
    title: 'Conversor de Ângulo',
    description: 'Converter entre diferentes unidades de ângulo',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'angle-converter'
  },
  {
    command: 'dev-juice.areaConverter',
    title: 'Conversor de Área',
    description: 'Converter entre diferentes unidades de área',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'area-converter'
  },
  {
    command: 'dev-juice.dataStorageConverter',
    title: 'Conversor de Armazenamento de Dados',
    description: 'Converter entre diferentes unidades de armazenamento de dados',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'data-storage-converter'
  },
  {
    command: 'dev-juice.lengthConverter',
    title: 'Conversor de Comprimento',
    description: 'Converter entre diferentes unidades de comprimento',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'length-converter'
  },
  {
    command: 'dev-juice.fuelConsumptionConverter',
    title: 'Conversor de Consumo de Combustível',
    description: 'Converter entre diferentes unidades de consumo de combustível',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'fuel-consumption-converter'
  },
  {
    command: 'dev-juice.colorConverter',
    title: 'Conversor de Cores',
    description: 'Converter entre formatos de cores (HEX, RGB, HSL)',
    category: 'Conversores',
    icon: 'color-mode',
    template: 'color-converter',
    factory: () => require('../panels/tools/colorConverterPanel').ColorConverterPanel
  },
  {
    command: 'dev-juice.energyConverter',
    title: 'Conversor de Energia',
    description: 'Converter entre diferentes unidades de energia',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'energy-converter'
  },
  {
    command: 'dev-juice.forceConverter',
    title: 'Conversor de Força',
    description: 'Converter entre diferentes unidades de força',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'force-converter'
  },
  {
    command: 'dev-juice.currencyConverter',
    title: 'Conversor de Moedas',
    description: 'Converter entre diferentes moedas',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'currency-converter'
  },
  {
    command: 'dev-juice.numbersConverter',
    title: 'Conversor de Números',
    description: 'Converter entre diferentes bases numéricas (decimal, binário, hexadecimal, etc.)',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'numbers-converter'
  },
  {
    command: 'dev-juice.weightConverter',
    title: 'Conversor de Peso e Massa',
    description: 'Converter entre diferentes unidades de peso e massa',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'weight-converter'
  },
  {
    command: 'dev-juice.powerConverter',
    title: 'Conversor de Potência',
    description: 'Converter entre diferentes unidades de potência',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'power-converter'
  },
  {
    command: 'dev-juice.pressureConverter',
    title: 'Conversor de Pressão',
    description: 'Converter entre diferentes unidades de pressão',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'pressure-converter'
  },
  {
    command: 'dev-juice.temperatureConverter',
    title: 'Conversor de Temperatura',
    description: 'Converter entre diferentes unidades de temperatura',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'temperature-converter'
  },
  {
    command: 'dev-juice.timeConverter',
    title: 'Conversor de Tempo',
    description: 'Converter entre diferentes unidades de tempo',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'time-converter'
  },
  {
    command: 'dev-juice.speedConverter',
    title: 'Conversor de Velocidade',
    description: 'Converter entre diferentes unidades de velocidade',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'speed-converter'
  },
  {
    command: 'dev-juice.volumeConverter',
    title: 'Conversor de Volume',
    description: 'Converter entre diferentes unidades de volume',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'volume-converter'
  },
  {
    command: 'dev-juice.dryVolumeConverter',
    title: 'Conversor de Volume (Seco)',
    description: 'Converter entre diferentes unidades de volume para materiais secos',
    category: 'Conversores',
    icon: 'arrow-swap',
    template: 'dry-volume-converter'
  },

  // ── Utilitários ──────────────────────────────────────────────────────────
  {
    command: 'dev-juice.dateCalculator',
    title: 'Calculadora de Data',
    description: 'Calcular diferenças entre datas e formatos',
    category: 'Utilitários',
    icon: 'calendar',
    template: 'date-calculator',
    factory: () => require('../panels/tools/dateCalculatorPanel').DateCalculatorPanel
  },
  {
    command: 'dev-juice.base64Encoder',
    title: 'Codificador Base64',
    description: 'Codificar/decodificar texto em Base64',
    category: 'Utilitários',
    icon: 'lock',
    template: 'base64-encoder',
    factory: () => require('../panels/tools/base64Panel').Base64Panel
  },
  {
    command: 'dev-juice.pixDecoder',
    title: 'PIX QR Code Decoder',
    description: 'Decodificar códigos PIX QR',
    category: 'Utilitários',
    icon: 'zap',
    template: 'pix-decoder',
    factory: () => require('../panels/tools/pixDecoderPanel').PixDecoderPanel
  },
  {
    command: 'dev-juice.qrReader',
    title: 'QR Code Reader',
    description: 'Ler e decodificar códigos QR',
    category: 'Utilitários',
    icon: 'device-camera',
    template: 'qr-reader',
    factory: () => require('../panels/tools/qrReaderPanel').QrReaderPanel
  },
  {
    command: 'dev-juice.regexTester',
    title: 'Testador de Regex',
    description: 'Testar e validar expressões regulares',
    category: 'Utilitários',
    icon: 'search',
    template: 'regex-tester',
    factory: () => require('../panels/tools/regexTesterPanel').RegexTesterPanel
  },
  {
    command: 'dev-juice.urlEncoder',
    title: 'URL Encoder/Decoder',
    description: 'Codificar e decodificar URLs',
    category: 'Utilitários',
    icon: 'link',
    template: 'url-encoder',
    factory: () => require('../panels/tools/urlEncoderPanel').UrlEncoderPanel
  },
  {
    command: 'dev-juice.emailValidator',
    title: 'Validador de Email',
    description: 'Validar formato de endereços de email',
    category: 'Utilitários',
    icon: 'mail',
    template: 'email-validator',
    factory: () => require('../panels/tools/emailValidatorPanel').EmailValidatorPanel
  }
]

const CATEGORY_ORDER: readonly ToolCategory[] = [
  'Geradores',
  'Formatação',
  'Conversores',
  'Utilitários'
]

/** Todas as ferramentas de painel declaradas (fonte única de verdade). */
export function getTools (): readonly ToolDefinition[] {
  return tools
}

/** Ferramentas agrupadas por categoria, na ordem de exibição da tree view. */
export function getToolsByCategory (): Map<ToolCategory, ToolDefinition[]> {
  const grouped = new Map<ToolCategory, ToolDefinition[]>()
  for (const category of CATEGORY_ORDER) {
    grouped.set(category, [])
  }
  for (const tool of tools) {
    const bucket = grouped.get(tool.category)
    if (bucket) {
      bucket.push(tool)
    }
  }
  return grouped
}
