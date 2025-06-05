import * as vscode from 'vscode';
import { generateCNPJ } from './cnpjGenerator';
import { generateCPF } from './cpfGenerator';
import { generateUUID } from './uuidGenerator';

/**
 * Insere um valor gerado no cursor do editor de texto ativo
 * @param valueGenerator Função que gera o valor a ser inserido
 * @param formatted Se o valor deve ser formatado
 */
export async function insertGeneratedValue(
  valueGenerator: (formatted: boolean) => string,
  formatted: boolean = true
): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage('Nenhum editor ativo para inserir o valor gerado.');
    return;
  }

  const value = valueGenerator(formatted);
  
  // Insere o valor em cada seleção do editor
  editor.edit(editBuilder => {
    editor.selections.forEach(selection => {
      editBuilder.replace(selection, value);
    });
  });
}

/**
 * Insere um CNPJ no cursor do editor de texto ativo
 * @param formatted Se o CNPJ deve ser formatado
 */
export async function insertCNPJ(formatted: boolean = true): Promise<void> {
  await insertGeneratedValue(generateCNPJ, formatted);
}

/**
 * Insere um CPF no cursor do editor de texto ativo
 * @param formatted Se o CPF deve ser formatado
 */
export async function insertCPF(formatted: boolean = true): Promise<void> {
  await insertGeneratedValue(generateCPF, formatted);
}

/**
 * Insere um UUID no cursor do editor de texto ativo
 * @param formatted Se o UUID deve incluir hífens
 */
export async function insertUUID(formatted: boolean = true): Promise<void> {
  await insertGeneratedValue(generateUUID, formatted);
}
