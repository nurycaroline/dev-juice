import * as assert from 'assert'
import * as vscode from 'vscode'

describe('Integration smoke', () => {
  it('activates the extension and registers a known command', async () => {
    const ext = vscode.extensions.getExtension('NuryStudio.dev-juice')
    assert.ok(ext, 'extension should be discoverable')

    await ext.activate()
    assert.strictEqual(ext.isActive, true)

    const commands = await vscode.commands.getCommands(true)
    assert.ok(
      commands.includes('dev-juice.base64Encoder'),
      'a known command should be registered on activation'
    )
  })
})
