import * as assert from 'assert'
import * as vscode from 'vscode'
import { getTools } from '../../tools/toolRegistry'
import { EDITOR_COMMAND_IDS } from '../../commands/editorCommands'

describe('Extension wiring derived from the registry (ARCH-04/ARCH-11)', () => {
  before(async () => {
    const ext = vscode.extensions.getExtension('NuryStudio.dev-juice')
    assert.ok(ext)
    await ext.activate()
  })

  it('registers a command for every tool in the registry', async () => {
    const commands = await vscode.commands.getCommands(true)
    const registered = new Set(commands)
    for (const tool of getTools()) {
      assert.ok(registered.has(tool.command), `${tool.command} deve estar registrado`)
    }
  })

  it('registers every editor command', async () => {
    const commands = await vscode.commands.getCommands(true)
    const registered = new Set(commands)
    for (const id of EDITOR_COMMAND_IDS) {
      assert.ok(registered.has(id), `${id} deve estar registrado`)
    }
  })

  it('no longer exposes the removed helloWorld command', async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(!commands.includes('dev-juice.helloWorld'))
  })
})
