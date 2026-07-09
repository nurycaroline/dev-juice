import * as vscode from 'vscode'
import { DevJuiceProvider } from './providers/devJuiceProvider'
import { BaseWebviewPanel } from './panels/BaseWebviewPanel'
import { getTools } from './tools/toolRegistry'
import { registerEditorCommands } from './commands/editorCommands'

export function activate (context: vscode.ExtensionContext): void {
  const devJuiceProvider = new DevJuiceProvider()
  vscode.window.registerTreeDataProvider('devJuiceExplorer', devJuiceProvider)

  // Um comando por ferramenta, derivado do registro (fonte única de verdade).
  for (const tool of getTools()) {
    const disposable = vscode.commands.registerCommand(tool.command, () => {
      const ctor = tool.factory ? tool.factory() : undefined
      BaseWebviewPanel.createOrShow(
        { viewType: tool.command, title: tool.title, template: tool.template },
        context.extensionUri,
        ctor
      )
    })
    context.subscriptions.push(disposable)
  }

  registerEditorCommands(context)
}

export function deactivate (): void {
  // Sem cleanup adicional necessário.
}
