import * as vscode from 'vscode'
import { generateCNPJ } from './cnpjGenerator'
import { generateCPF } from './cpfGenerator'
import { generateUUID } from './uuidGenerator'
import { PixGenerator, PixData } from './pixGenerator'
import { TextFormatter } from './textFormatter'

/**
 * Insere um valor gerado no cursor do editor de texto ativo
 * @param valueGenerator Função que gera o valor a ser inserido
 * @param formatted Se o valor deve ser formatado
 */
export async function insertGeneratedValue (
  valueGenerator: (formatted: boolean) => string,
  formatted: boolean = true
): Promise<void> {
  const editor = vscode.window.activeTextEditor

  if (!editor) {
    vscode.window.showErrorMessage('Nenhum editor ativo para inserir o valor gerado.')
    return
  }

  const value = valueGenerator(formatted)
  
  // Insere o valor em cada seleção do editor
  editor.edit(editBuilder => {
    editor.selections.forEach(selection => {
      editBuilder.replace(selection, value)
    })
  })
}

/**
 * Insere um CNPJ no cursor do editor de texto ativo
 * @param formatted Se o CNPJ deve ser formatado
 */
export async function insertCNPJ (formatted: boolean = true): Promise<void> {
  await insertGeneratedValue(generateCNPJ, formatted)
}

/**
 * Insere um CPF no cursor do editor de texto ativo
 * @param formatted Se o CPF deve ser formatado
 */
export async function insertCPF (formatted: boolean = true): Promise<void> {
  await insertGeneratedValue(generateCPF, formatted)
}

/**
 * Insere um UUID no cursor do editor de texto ativo
 * @param formatted Se o UUID deve incluir hífens
 */
export async function insertUUID (formatted: boolean = true): Promise<void> {
  await insertGeneratedValue(generateUUID, formatted)
}

/**
 * Insere um código PIX no cursor do editor de texto ativo
 * @param pixData Dados do PIX a ser gerado
 */
export async function insertPixCode (pixData: PixData): Promise<void> {
  const editor = vscode.window.activeTextEditor

  if (!editor) {
    vscode.window.showErrorMessage('Nenhum editor ativo para inserir o código PIX.')
    return
  }

  try {
    const validation = PixGenerator.validatePixKey(pixData.pixKey)
    if (!validation.isValid) {
      vscode.window.showErrorMessage('Chave PIX inválida. Verifique o formato da chave.')
      return
    }

    const pixCode = PixGenerator.generatePixCode(pixData)
    
    // Insere o código PIX em cada seleção do editor
    editor.edit(editBuilder => {
      editor.selections.forEach(selection => {
        editBuilder.replace(selection, pixCode)
      })
    })

    vscode.window.showInformationMessage('Código PIX inserido com sucesso!')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao gerar PIX'
    vscode.window.showErrorMessage(`Erro ao gerar PIX: ${errorMessage}`)
  }
}

/**
 * Insere um texto genérico no cursor do editor de texto ativo
 * @param text Texto a ser inserido
 */
export async function insertText (text: string): Promise<void> {
  const editor = vscode.window.activeTextEditor

  if (!editor) {
    vscode.window.showErrorMessage('Nenhum editor ativo para inserir o texto.')
    return
  }

  // Insere o texto em cada seleção do editor
  editor.edit(editBuilder => {
    editor.selections.forEach(selection => {
      editBuilder.replace(selection, text)
    })
  })

  vscode.window.showInformationMessage('Texto inserido com sucesso!')
}

/**
 * Formata o texto selecionado no editor de acordo com o formato especificado
 * @param formatFunction Função que aplica a formatação
 * @param formatName Nome do formato para mensagem de feedback
 */
export async function formatSelectedText (
  formatFunction: (text: string) => string,
  formatName: string
): Promise<void> {
  const editor = vscode.window.activeTextEditor

  if (!editor) {
    vscode.window.showErrorMessage('Nenhum editor ativo para formatar o texto.')
    return
  }

  const selections = editor.selections
  if (selections.length === 0 || selections.every(sel => sel.isEmpty)) {
    vscode.window.showWarningMessage('Selecione o texto que deseja formatar.')
    return
  }

  // Aplica formatação em cada seleção
  editor.edit(editBuilder => {
    selections.forEach(selection => {
      if (!selection.isEmpty) {
        const selectedText = editor.document.getText(selection)
        const formattedText = formatFunction(selectedText)
        editBuilder.replace(selection, formattedText)
      }
    })
  })

  vscode.window.showInformationMessage(`Texto formatado para ${formatName}!`)
}

// Funções de formatação específicas
export async function formatToSentenceCase (): Promise<void> {
  await formatSelectedText(toSentenceCase, 'Sentence case')
}

export async function formatToSnakeCase (): Promise<void> {
  await formatSelectedText(toSnakeCase, 'snake_case')
}

export async function formatToCamelCase (): Promise<void> {
  await formatSelectedText(toCamelCase, 'camelCase')
}

export async function formatToKebabCase (): Promise<void> {
  await formatSelectedText(toKebabCase, 'kebab-case')
}

export async function formatToPascalCase (): Promise<void> {
  await formatSelectedText(toPascalCase, 'PascalCase')
}

export async function formatToLowerCase (): Promise<void> {
  await formatSelectedText(toLowerCase, 'lower case')
}

export async function formatToUpperCase (): Promise<void> {
  await formatSelectedText(toUpperCase, 'UPPER CASE')
}

export async function formatToCapitalizedCase (): Promise<void> {
  await formatSelectedText(toCapitalizedCase, 'Capitalized Case')
}

export async function formatToAlternatingCase (): Promise<void> {
  await formatSelectedText(toAlternatingCase, 'aLtErNaTiNg cAsE')
}

export async function formatToInverseCase (): Promise<void> {
  await formatSelectedText(toInverseCase, 'InVeRsE CaSe')
}

export async function formatToDotNotation (): Promise<void> {
  await formatSelectedText(toDotNotation, 'Dot Notation')
}

export async function formatToParamsStyle (): Promise<void> {
  await formatSelectedText(toParamsStyle, 'Params Style')
}

export async function formatToPathStyle (): Promise<void> {
  await formatSelectedText(toPathStyle, 'Path Style')
}

// Funções auxiliares de formatação - agora usando TextFormatter aprimorado
function toSentenceCase (text: string): string {
  return TextFormatter.toSentenceCase(text)
}

function toSnakeCase (text: string): string {
  return TextFormatter.toSnakeCase(text)
}

function toCamelCase (text: string): string {
  return TextFormatter.toCamelCase(text)
}

function toKebabCase (text: string): string {
  return TextFormatter.toKebabCase(text)
}

function toPascalCase (text: string): string {
  return TextFormatter.toPascalCase(text)
}

function toLowerCase (text: string): string {
  return text.toLowerCase()
}

function toUpperCase (text: string): string {
  return text.toUpperCase()
}

function toCapitalizedCase (text: string): string {
  return TextFormatter.toCapitalizedCase(text)
}

function toAlternatingCase (text: string): string {
  return TextFormatter.toAlternatingCase(text)
}

function toInverseCase (text: string): string {
  return TextFormatter.toInverseCase(text)
}

function toDotNotation (text: string): string {
  return TextFormatter.toDotNotation(text)
}

function toParamsStyle (text: string): string {
  return TextFormatter.toParamsStyle(text)
}

function toPathStyle (text: string): string {
  return TextFormatter.toPathStyle(text)
}
