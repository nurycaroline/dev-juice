// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { DevHelperProvider } from './providers/devHelperProvider'
import { insertCNPJ, insertCPF, insertUUID, formatToSentenceCase, formatToSnakeCase, formatToCamelCase, formatToKebabCase, formatToPascalCase, formatToLowerCase, formatToUpperCase, formatToCapitalizedCase, formatToAlternatingCase, formatToInverseCase, formatToDotNotation, formatToParamsStyle, formatToPathStyle } from './utils/insertUtils'

// Lazy imports para providers (só carregados quando necessário)
const lazyProviders = {
  get Base64EncoderProvider () { return require('./providers/base64EncoderProvider').Base64EncoderProvider },
  get CNPJPanelProvider () { return require('./providers/cnpjPanelProvider').CNPJPanelProvider },
  get ColorConverterProvider () { return require('./providers/colorConverterProvider').ColorConverterProvider },
  get CPFPanelProvider () { return require('./providers/cpfPanelProvider').CPFPanelProvider },
  get DateCalculatorProvider () { return require('./providers/dateCalculatorProvider').DateCalculatorProvider },
  get EmailValidatorProvider () { return require('./providers/emailValidatorProvider').EmailValidatorProvider },
  get HashGeneratorProvider () { return require('./providers/hashGeneratorProvider').HashGeneratorProvider },
  get JsonFormatterProvider () { return require('./providers/jsonFormatterProvider').JsonFormatterProvider },
  get PasswordGeneratorProvider () { return require('./providers/passwordGeneratorProvider').PasswordGeneratorProvider },
  get PixDecoderProvider () { return require('./providers/pixDecoderProvider').PixDecoderProvider },
  get PixPanelProvider () { return require('./providers/pixPanelProvider').PixPanelProvider },
  get QrReaderProvider () { return require('./providers/qrReaderProvider').QrReaderProvider },
  get TextFormatterProvider () { return require('./providers/textFormatterProvider').TextFormatterProvider },
  get UrlEncoderProvider () { return require('./providers/urlEncoderProvider').UrlEncoderProvider },
  get UUIDPanelProvider () { return require('./providers/uuidPanelProvider').UUIDPanelProvider }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate (context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "dev-helper" is now active!')

  // Register the tree data provider for the view
  const devHelperProvider = new DevHelperProvider()
  vscode.window.registerTreeDataProvider('devHelperExplorer', devHelperProvider)

  // Register commands - Organizados em ordem alfabética

  // Base64 Encoder command
  const base64EncoderDisposable = vscode.commands.registerCommand('dev-helper.base64Encoder', () => {
    lazyProviders.Base64EncoderProvider.createOrShow(context.extensionUri)
  })

  // Color Converter command
  const colorConverterDisposable = vscode.commands.registerCommand('dev-helper.colorConverter', () => {
    lazyProviders.ColorConverterProvider.createOrShow(context.extensionUri)
  })

  // Date Calculator command
  const dateCalculatorDisposable = vscode.commands.registerCommand('dev-helper.dateCalculator', () => {
    lazyProviders.DateCalculatorProvider.createOrShow(context.extensionUri)
  })
  
  // Email Validator command
  const emailValidatorDisposable = vscode.commands.registerCommand('dev-helper.emailValidator', () => {
    lazyProviders.EmailValidatorProvider.createOrShow(context.extensionUri)
  })

  // Format JSON command
  const formatJsonDisposable = vscode.commands.registerCommand('dev-helper.formatJson', () => {
    lazyProviders.JsonFormatterProvider.createOrShow(context.extensionUri)
  })

  // Generate CNPJ command - now opens the webview panel
  const generateCNPJDisposable = vscode.commands.registerCommand('dev-helper.generateCNPJ', () => {
    lazyProviders.CNPJPanelProvider.createOrShow(context.extensionUri)
  })

  // Generate CPF command
  const generateCPFDisposable = vscode.commands.registerCommand('dev-helper.generateCPF', () => {
    lazyProviders.CPFPanelProvider.createOrShow(context.extensionUri)
  })

  // Generate PIX command
  const generatePixDisposable = vscode.commands.registerCommand('dev-helper.generatePix', () => {
    lazyProviders.PixPanelProvider.createOrShow(context.extensionUri)
  })
  
  // Generate UUID command
  const generateUUIDDisposable = vscode.commands.registerCommand('dev-helper.generateUUID', () => {
    lazyProviders.UUIDPanelProvider.createOrShow(context.extensionUri)
  })

  // Hash Generator command
  const hashGeneratorDisposable = vscode.commands.registerCommand('dev-helper.hashGenerator', () => {
    lazyProviders.HashGeneratorProvider.createOrShow(context.extensionUri)
  })

  // Hello World command (from template)
  const helloWorldDisposable = vscode.commands.registerCommand('dev-helper.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from Dev Helper!')
  })

  // Password Generator command
  const passwordGeneratorDisposable = vscode.commands.registerCommand('dev-helper.passwordGenerator', () => {
    lazyProviders.PasswordGeneratorProvider.createOrShow(context.extensionUri)
  })

  // PIX Decoder command
  const pixDecoderDisposable = vscode.commands.registerCommand('dev-helper.pixDecoder', () => {
    lazyProviders.PixDecoderProvider.createOrShow(context.extensionUri)
  })

  // QR Reader command
  const qrReaderDisposable = vscode.commands.registerCommand('dev-helper.qrReader', () => {
    lazyProviders.QrReaderProvider.createOrShow(context.extensionUri)
  })

  // Text Formatter command
  const textFormatterDisposable = vscode.commands.registerCommand('dev-helper.textFormatter', () => {
    lazyProviders.TextFormatterProvider.createOrShow(context.extensionUri)
  })

  // URL Encoder command
  const urlEncoderDisposable = vscode.commands.registerCommand('dev-helper.urlEncoder', () => {
    lazyProviders.UrlEncoderProvider.createOrShow(context.extensionUri)
  })

  // Comandos de formatação de texto para seleção no editor - Organizados em ordem alfabética

  // Formatar para aLtErNaTiNg cAsE
  const formatAlternatingCaseDisposable = vscode.commands.registerCommand('dev-helper.formatTextAlternatingCase', () => {
    formatToAlternatingCase()
  })

  // Formatar para camelCase
  const formatCamelCaseDisposable = vscode.commands.registerCommand('dev-helper.formatTextCamelCase', () => {
    formatToCamelCase()
  })

  // Formatar para Capitalized Case
  const formatCapitalizedCaseDisposable = vscode.commands.registerCommand('dev-helper.formatTextCapitalizedCase', () => {
    formatToCapitalizedCase()
  })

  // Formatar para InVeRsE CaSe
  const formatInverseCaseDisposable = vscode.commands.registerCommand('dev-helper.formatTextInverseCase', () => {
    formatToInverseCase()
  })

  // Formatar para kebab-case
  const formatKebabCaseDisposable = vscode.commands.registerCommand('dev-helper.formatTextKebabCase', () => {
    formatToKebabCase()
  })

  // Formatar para lower case
  const formatLowerCaseDisposable = vscode.commands.registerCommand('dev-helper.formatTextLowerCase', () => {
    formatToLowerCase()
  })

  // Formatar para PascalCase
  const formatPascalCaseDisposable = vscode.commands.registerCommand('dev-helper.formatTextPascalCase', () => {
    formatToPascalCase()
  })

  // Formatar para Sentence case
  const formatSentenceCaseDisposable = vscode.commands.registerCommand('dev-helper.formatTextSentenceCase', () => {
    formatToSentenceCase()
  })

  // Formatar para snake_case
  const formatSnakeCaseDisposable = vscode.commands.registerCommand('dev-helper.formatTextSnakeCase', () => {
    formatToSnakeCase()
  })

  // Formatar para UPPER CASE
  const formatUpperCaseDisposable = vscode.commands.registerCommand('dev-helper.formatTextUpperCase', () => {
    formatToUpperCase()
  })

  // Formatar para dot.notation
  const formatDotNotationDisposable = vscode.commands.registerCommand('dev-helper.formatTextDotNotation', () => {
    formatToDotNotation()
  })

  // Formatar para Params: Style
  const formatParamsStyleDisposable = vscode.commands.registerCommand('dev-helper.formatTextParamsStyle', () => {
    formatToParamsStyle()
  })

  // Formatar para path/style
  const formatPathStyleDisposable = vscode.commands.registerCommand('dev-helper.formatTextPathStyle', () => {
    formatToPathStyle()
  })

  // Comandos para inserir valores gerados diretamente no editor - Organizados em ordem alfabética

  // Inserir CNPJ formatado
  const insertCNPJFormattedDisposable = vscode.commands.registerCommand('dev-helper.insertCNPJFormatted', () => {
    insertCNPJ(true)
  })

  // Inserir CNPJ não formatado
  const insertCNPJUnformattedDisposable = vscode.commands.registerCommand('dev-helper.insertCNPJUnformatted', () => {
    insertCNPJ(false)
  })

  // Inserir CPF formatado
  const insertCPFFormattedDisposable = vscode.commands.registerCommand('dev-helper.insertCPFFormatted', () => {
    insertCPF(true)
  })

  // Inserir CPF não formatado
  const insertCPFUnformattedDisposable = vscode.commands.registerCommand('dev-helper.insertCPFUnformatted', () => {
    insertCPF(false)
  })

  // Inserir UUID formatado
  const insertUUIDFormattedDisposable = vscode.commands.registerCommand('dev-helper.insertUUIDFormatted', () => {
    insertUUID(true)
  })

  // Inserir UUID não formatado
  const insertUUIDUnformattedDisposable = vscode.commands.registerCommand('dev-helper.insertUUIDUnformatted', () => {
    insertUUID(false)
  })

  // Add the commands to the extension context - Organizados em ordem alfabética
  context.subscriptions.push(
    base64EncoderDisposable,
    colorConverterDisposable,
    dateCalculatorDisposable,
    emailValidatorDisposable,
    formatAlternatingCaseDisposable,
    formatCamelCaseDisposable,
    formatCapitalizedCaseDisposable,
    formatInverseCaseDisposable,
    formatJsonDisposable,
    formatKebabCaseDisposable,
    formatLowerCaseDisposable,
    formatPascalCaseDisposable,
    formatSentenceCaseDisposable,
    formatSnakeCaseDisposable,
    formatUpperCaseDisposable,
    formatDotNotationDisposable,
    formatParamsStyleDisposable,
    formatPathStyleDisposable,
    generateCNPJDisposable,
    generateCPFDisposable,
    generatePixDisposable,
    generateUUIDDisposable,
    hashGeneratorDisposable,
    helloWorldDisposable,
    insertCNPJFormattedDisposable,
    insertCNPJUnformattedDisposable,
    insertCPFFormattedDisposable,
    insertCPFUnformattedDisposable,
    insertUUIDFormattedDisposable,
    insertUUIDUnformattedDisposable,
    passwordGeneratorDisposable,
    pixDecoderDisposable,
    qrReaderDisposable,
    textFormatterDisposable,
    urlEncoderDisposable
  )
}

// This method is called when your extension is deactivated
export function deactivate () {
  // Extension cleanup if needed
}
