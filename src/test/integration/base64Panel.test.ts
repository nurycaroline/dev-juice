import * as assert from 'assert'
import * as vscode from 'vscode'
import { Base64Panel } from '../../panels/tools/base64Panel'
import { ValidatedMessage } from '../../panels/BaseWebviewPanel'

/**
 * Exercita o protocolo de mensagens do painel base64 sem depender de um webview
 * real: alimenta mensagens validadas e captura as respostas postadas.
 */
class TestableBase64Panel extends Base64Panel {
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

describe('Base64Panel message protocol (ARCH-02/ARCH-08)', () => {
  it('encodes "dev" to "ZGV2"', () => {
    const panel = new TestableBase64Panel()
    panel.feed({ command: 'encode', text: 'dev' })
    assert.deepStrictEqual(panel.captured[0], {
      command: 'encoded',
      result: 'ZGV2',
      success: true
    })
  })

  it('decodes "ZGV2" back to "dev"', () => {
    const panel = new TestableBase64Panel()
    panel.feed({ command: 'decode', text: 'ZGV2' })
    assert.deepStrictEqual(panel.captured[0], {
      command: 'decoded',
      result: 'dev',
      success: true
    })
  })

  it('round-trips arbitrary text through encode then decode', () => {
    const encoder = new TestableBase64Panel()
    encoder.feed({ command: 'encode', text: 'Dev Juice 123' })
    const encoded = encoder.captured[0].result as string

    const decoder = new TestableBase64Panel()
    decoder.feed({ command: 'decode', text: encoded })
    assert.strictEqual(decoder.captured[0].result, 'Dev Juice 123')
  })

  it('rejects a decode payload with invalid base64 characters', () => {
    const panel = new TestableBase64Panel()
    panel.feed({ command: 'decode', text: 'not base64!!' })
    assert.strictEqual(panel.captured[0].command, 'decoded')
    assert.strictEqual(panel.captured[0].success, false)
  })
})
