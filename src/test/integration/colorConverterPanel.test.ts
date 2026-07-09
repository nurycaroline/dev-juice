import * as assert from 'assert'
import * as vscode from 'vscode'
import { ColorConverterPanel } from '../../panels/tools/colorConverterPanel'
import { ValidatedMessage } from '../../panels/BaseWebviewPanel'

class TestableColorPanel extends ColorConverterPanel {
  public readonly captured: Array<Record<string, unknown>> = []

  constructor () {
    super({} as unknown as vscode.WebviewPanel, {} as unknown as vscode.Uri)
  }

  protected postMessage (msg: unknown): Thenable<boolean> {
    this.captured.push(msg as Record<string, unknown>)
    return Promise.resolve(true)
  }

  public feed (message: ValidatedMessage): void {
    this.onMessage(message)
  }
}

describe('ColorConverterPanel message protocol (ARCH-02)', () => {
  it('converts HEX #ff0000 to rgb(255, 0, 0)', () => {
    const panel = new TestableColorPanel()
    panel.feed({ command: 'convertColor', color: '#ff0000', fromFormat: 'hex' })
    const payload = panel.captured[0]
    assert.strictEqual(payload.command, 'colorConverted')
    assert.strictEqual(payload.success, true)
    const result = payload.result as Record<string, unknown>
    assert.strictEqual(result.rgb, 'rgb(255, 0, 0)')
    assert.strictEqual(result.hex, '#FF0000')
  })

  it('reports failure for an invalid HEX value', () => {
    const panel = new TestableColorPanel()
    panel.feed({ command: 'convertColor', color: 'nothex', fromFormat: 'hex' })
    assert.strictEqual(panel.captured[0].command, 'colorConverted')
    assert.strictEqual(panel.captured[0].success, false)
  })
})
