// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { DevHelperProvider } from './providers/devHelperProvider'
import { insertCNPJ, insertCPF, insertUUID, formatToSentenceCase, formatToSnakeCase, formatToCamelCase, formatToKebabCase, formatToPascalCase, formatToLowerCase, formatToUpperCase, formatToCapitalizedCase, formatToAlternatingCase, formatToInverseCase, formatToDotNotation, formatToParamsStyle, formatToPathStyle } from './utils/insertUtils'

// Lazy imports para providers (só carregados quando necessário)
const lazyProviders = {
  get AngleConverterProvider () { return require('./providers/converters/angleConverterProvider').AngleConverterProvider },
  get AnsiFormatterProvider () { return require('./providers/ansiFormatterProvider').AnsiFormatterProvider },
  get AreaConverterProvider () { return require('./providers/converters/areaConverterProvider').AreaConverterProvider },
  get Base64EncoderProvider () { return require('./providers/base64EncoderProvider').Base64EncoderProvider },
  get CaseConverterProvider () { return require('./providers/converters/caseConverterProvider').CaseConverterProvider },
  get CNPJPanelProvider () { return require('./providers/cnpjPanelProvider').CNPJPanelProvider },
  get ColorConverterProvider () { return require('./providers/colorConverterProvider').ColorConverterProvider },
  get CPFPanelProvider () { return require('./providers/cpfPanelProvider').CPFPanelProvider },
  get CurrencyConverterProvider () { return require('./providers/converters/currencyConverterProvider').CurrencyConverterProvider },
  get DataStorageConverterProvider () { return require('./providers/converters/dataStorageConverterProvider').DataStorageConverterProvider },
  get DateCalculatorProvider () { return require('./providers/dateCalculatorProvider').DateCalculatorProvider },
  get DryVolumeConverterProvider () { return require('./providers/converters/dryVolumeConverterProvider').DryVolumeConverterProvider },
  get EmailValidatorProvider () { return require('./providers/emailValidatorProvider').EmailValidatorProvider },
  get EnergyConverterProvider () { return require('./providers/converters/energyConverterProvider').EnergyConverterProvider },
  get ForceConverterProvider () { return require('./providers/converters/forceConverterProvider').ForceConverterProvider },
  get FuelConsumptionConverterProvider () { return require('./providers/converters/fuelConsumptionConverterProvider').FuelConsumptionConverterProvider },
  get HashGeneratorProvider () { return require('./providers/hashGeneratorProvider').HashGeneratorProvider },
  get JsonFormatterProvider () { return require('./providers/jsonFormatterProvider').JsonFormatterProvider },
  get LengthConverterProvider () { return require('./providers/converters/lengthConverterProvider').LengthConverterProvider },
  get NumbersConverterProvider () { return require('./providers/converters/numbersConverterProvider').NumbersConverterProvider },
  get PasswordGeneratorProvider () { return require('./providers/passwordGeneratorProvider').PasswordGeneratorProvider },
  get PixDecoderProvider () { return require('./providers/pixDecoderProvider').PixDecoderProvider },
  get PixPanelProvider () { return require('./providers/pixPanelProvider').PixPanelProvider },
  get PowerConverterProvider () { return require('./providers/converters/powerConverterProvider').PowerConverterProvider },
  get PressureConverterProvider () { return require('./providers/converters/pressureConverterProvider').PressureConverterProvider },
  get QrReaderProvider () { return require('./providers/qrReaderProvider').QrReaderProvider },
  get RegexTesterProvider () { return require('./providers/regexTesterProvider').RegexTesterProvider },
  get SpeedConverterProvider () { return require('./providers/converters/speedConverterProvider').SpeedConverterProvider },
  get TemperatureConverterProvider () { return require('./providers/converters/temperatureConverterProvider').TemperatureConverterProvider },
  get TextFormatterProvider () { return require('./providers/textFormatterProvider').TextFormatterProvider },
  get TimeConverterProvider () { return require('./providers/converters/timeConverterProvider').TimeConverterProvider },
  get UrlEncoderProvider () { return require('./providers/urlEncoderProvider').UrlEncoderProvider },
  get UUIDPanelProvider () { return require('./providers/uuidPanelProvider').UUIDPanelProvider },
  get VolumeConverterProvider () { return require('./providers/converters/volumeConverterProvider').VolumeConverterProvider },
  get WeightConverterProvider () { return require('./providers/converters/weightConverterProvider').WeightConverterProvider }
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

  // ANSI Formatter command
  const ansiFormatterDisposable = vscode.commands.registerCommand('dev-helper.ansiFormatter', () => {
    lazyProviders.AnsiFormatterProvider.createOrShow(context.extensionUri)
  })

  // ANSI Formatter Process Selection command
  const ansiFormatterProcessSelectionDisposable = vscode.commands.registerCommand('dev-helper.ansiFormatterProcessSelection', () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showErrorMessage('Nenhum editor ativo para processar a seleção.')
      return
    }

    const selection = editor.selection
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Nenhum texto selecionado. Selecione texto contendo códigos ANSI.')
      return
    }

    const text = editor.document.getText(selection)
    // Define o padrão ANSI para substituição
    const ansiPattern = /\u001b\[[0-9;]*[A-Za-z]/g
    
    // Remove os códigos ANSI
    const processedText = text.replace(ansiPattern, '')
    
    // Substitui o texto selecionado
    editor.edit(editBuilder => {
      editBuilder.replace(selection, processedText)
    }).then(success => {
      if (success) {
        vscode.window.showInformationMessage('Códigos ANSI removidos com sucesso!')
      } else {
        vscode.window.showErrorMessage('Falha ao remover códigos ANSI.')
      }
    })
  })

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

  // Regex Tester command
  const regexTesterDisposable = vscode.commands.registerCommand('dev-helper.regexTester', () => {
    lazyProviders.RegexTesterProvider.createOrShow(context.extensionUri)
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

  // Area Converter command
  const areaConverterDisposable = vscode.commands.registerCommand('dev-helper.areaConverter', () => {
    lazyProviders.AreaConverterProvider.createOrShow(context.extensionUri)
  })

  // Length Converter command
  const lengthConverterDisposable = vscode.commands.registerCommand('dev-helper.lengthConverter', () => {
    lazyProviders.LengthConverterProvider.createOrShow(context.extensionUri)
  })

  // Temperature Converter command
  const temperatureConverterDisposable = vscode.commands.registerCommand('dev-helper.temperatureConverter', () => {
    lazyProviders.TemperatureConverterProvider.createOrShow(context.extensionUri)
  })

  // Volume Converter command
  const volumeConverterDisposable = vscode.commands.registerCommand('dev-helper.volumeConverter', () => {
    lazyProviders.VolumeConverterProvider.createOrShow(context.extensionUri)
  })

  // Weight Converter command
  const weightConverterDisposable = vscode.commands.registerCommand('dev-helper.weightConverter', () => {
    lazyProviders.WeightConverterProvider.createOrShow(context.extensionUri)
  })

  // Angle Converter command
  const angleConverterDisposable = vscode.commands.registerCommand('dev-helper.angleConverter', () => {
    lazyProviders.AngleConverterProvider.createOrShow(context.extensionUri)
  })

  // Case Converter command
  const caseConverterDisposable = vscode.commands.registerCommand('dev-helper.caseConverter', () => {
    lazyProviders.CaseConverterProvider.createOrShow(context.extensionUri)
  })

  // Currency Converter command
  const currencyConverterDisposable = vscode.commands.registerCommand('dev-helper.currencyConverter', () => {
    lazyProviders.CurrencyConverterProvider.createOrShow(context.extensionUri)
  })

  // Data Storage Converter command
  const dataStorageConverterDisposable = vscode.commands.registerCommand('dev-helper.dataStorageConverter', () => {
    lazyProviders.DataStorageConverterProvider.createOrShow(context.extensionUri)
  })

  // Dry Volume Converter command
  const dryVolumeConverterDisposable = vscode.commands.registerCommand('dev-helper.dryVolumeConverter', () => {
    lazyProviders.DryVolumeConverterProvider.createOrShow(context.extensionUri)
  })

  // Energy Converter command
  const energyConverterDisposable = vscode.commands.registerCommand('dev-helper.energyConverter', () => {
    lazyProviders.EnergyConverterProvider.createOrShow(context.extensionUri)
  })

  // Force Converter command
  const forceConverterDisposable = vscode.commands.registerCommand('dev-helper.forceConverter', () => {
    lazyProviders.ForceConverterProvider.createOrShow(context.extensionUri)
  })

  // Fuel Consumption Converter command
  const fuelConsumptionConverterDisposable = vscode.commands.registerCommand('dev-helper.fuelConsumptionConverter', () => {
    lazyProviders.FuelConsumptionConverterProvider.createOrShow(context.extensionUri)
  })

  // Numbers Converter command
  const numbersConverterDisposable = vscode.commands.registerCommand('dev-helper.numbersConverter', () => {
    lazyProviders.NumbersConverterProvider.createOrShow(context.extensionUri)
  })

  // Power Converter command
  const powerConverterDisposable = vscode.commands.registerCommand('dev-helper.powerConverter', () => {
    lazyProviders.PowerConverterProvider.createOrShow(context.extensionUri)
  })

  // Pressure Converter command
  const pressureConverterDisposable = vscode.commands.registerCommand('dev-helper.pressureConverter', () => {
    lazyProviders.PressureConverterProvider.createOrShow(context.extensionUri)
  })

  // Speed Converter command
  const speedConverterDisposable = vscode.commands.registerCommand('dev-helper.speedConverter', () => {
    lazyProviders.SpeedConverterProvider.createOrShow(context.extensionUri)
  })

  // Time Converter command
  const timeConverterDisposable = vscode.commands.registerCommand('dev-helper.timeConverter', () => {
    lazyProviders.TimeConverterProvider.createOrShow(context.extensionUri)
  })

  // Add the commands to the extension context - Organizados em ordem alfabética
  context.subscriptions.push(
    ansiFormatterDisposable,
    ansiFormatterProcessSelectionDisposable,
    areaConverterDisposable,
    angleConverterDisposable,
    base64EncoderDisposable,
    colorConverterDisposable,
    currencyConverterDisposable,
    dateCalculatorDisposable,
    dataStorageConverterDisposable,
    dryVolumeConverterDisposable,
    emailValidatorDisposable,
    energyConverterDisposable,
    forceConverterDisposable,
    fuelConsumptionConverterDisposable,
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
    lengthConverterDisposable,
    numbersConverterDisposable,
    passwordGeneratorDisposable,
    pixDecoderDisposable,
    qrReaderDisposable,
    regexTesterDisposable,
    speedConverterDisposable,
    temperatureConverterDisposable,
    textFormatterDisposable,
    timeConverterDisposable,
    urlEncoderDisposable,
    volumeConverterDisposable,
    weightConverterDisposable,
    caseConverterDisposable,
    powerConverterDisposable,
    pressureConverterDisposable
  )
}

// This method is called when your extension is deactivated
export function deactivate () {
  // Extension cleanup if needed
}
