import * as vscode from 'vscode'
import {
  insertCNPJ,
  insertCPF,
  insertUUID,
  formatToSentenceCase,
  formatToSnakeCase,
  formatToCamelCase,
  formatToKebabCase,
  formatToPascalCase,
  formatToLowerCase,
  formatToUpperCase,
  formatToCapitalizedCase,
  formatToAlternatingCase,
  formatToInverseCase,
  formatToDotNotation,
  formatToParamsStyle,
  formatToPathStyle
} from '../utils/insertUtils'

/** Remove códigos ANSI da seleção atual do editor ativo. */
function processAnsiSelection (): void {
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
  const ansiPattern = /\u001b\[[0-9;]*[A-Za-z]/g
  const processedText = text.replace(ansiPattern, '')

  editor.edit(editBuilder => {
    editBuilder.replace(selection, processedText)
  }).then(success => {
    if (success) {
      vscode.window.showInformationMessage('Códigos ANSI removidos com sucesso!')
    } else {
      vscode.window.showErrorMessage('Falha ao remover códigos ANSI.')
    }
  })
}

/**
 * Comandos de editor que não abrem webview (formatação da seleção, inserção de
 * valores gerados). Ficam fora do registro de painéis e são registrados aqui.
 */
const editorCommandHandlers: Record<string, () => void> = {
  'dev-juice.ansiFormatterProcessSelection': processAnsiSelection,
  'dev-juice.formatTextAlternatingCase': formatToAlternatingCase,
  'dev-juice.formatTextCamelCase': formatToCamelCase,
  'dev-juice.formatTextCapitalizedCase': formatToCapitalizedCase,
  'dev-juice.formatTextInverseCase': formatToInverseCase,
  'dev-juice.formatTextKebabCase': formatToKebabCase,
  'dev-juice.formatTextLowerCase': formatToLowerCase,
  'dev-juice.formatTextPascalCase': formatToPascalCase,
  'dev-juice.formatTextSentenceCase': formatToSentenceCase,
  'dev-juice.formatTextSnakeCase': formatToSnakeCase,
  'dev-juice.formatTextUpperCase': formatToUpperCase,
  'dev-juice.formatTextDotNotation': formatToDotNotation,
  'dev-juice.formatTextParamsStyle': formatToParamsStyle,
  'dev-juice.formatTextPathStyle': formatToPathStyle,
  'dev-juice.insertCNPJFormatted': () => insertCNPJ(true),
  'dev-juice.insertCNPJUnformatted': () => insertCNPJ(false),
  'dev-juice.insertCPFFormatted': () => insertCPF(true),
  'dev-juice.insertCPFUnformatted': () => insertCPF(false),
  'dev-juice.insertUUIDFormatted': () => insertUUID(true),
  'dev-juice.insertUUIDUnformatted': () => insertUUID(false)
}

/** Ids dos comandos de editor (não abrem painel). */
export const EDITOR_COMMAND_IDS: readonly string[] = Object.keys(editorCommandHandlers)

export function registerEditorCommands (context: vscode.ExtensionContext): void {
  for (const [id, handler] of Object.entries(editorCommandHandlers)) {
    context.subscriptions.push(vscode.commands.registerCommand(id, handler))
  }
}
