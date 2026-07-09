import * as assert from 'assert'
import { validateWebviewMessage, MAX_PAYLOAD_LENGTH } from '../../panels/BaseWebviewPanel'

const WHITELIST = ['encode', 'decode'] as const

describe('validateWebviewMessage', () => {
  it('rejects a non-object payload', () => {
    for (const raw of [null, undefined, 'encode', 42, true]) {
      const result = validateWebviewMessage(raw, WHITELIST)
      assert.strictEqual(result.ok, false)
      if (!result.ok) {
        assert.strictEqual(result.reason, 'not-object')
      }
    }
  })

  it('rejects a message without a command field', () => {
    const result = validateWebviewMessage({ text: 'hi' }, WHITELIST)
    assert.strictEqual(result.ok, false)
    if (!result.ok) {
      assert.strictEqual(result.reason, 'no-command')
    }
  })

  it('rejects a message whose command is not a string', () => {
    const result = validateWebviewMessage({ command: 123 }, WHITELIST)
    assert.strictEqual(result.ok, false)
    if (!result.ok) {
      assert.strictEqual(result.reason, 'no-command')
    }
  })

  it('rejects a command outside the whitelist', () => {
    const result = validateWebviewMessage({ command: 'deleteEverything' }, WHITELIST)
    assert.strictEqual(result.ok, false)
    if (!result.ok) {
      assert.strictEqual(result.reason, 'not-whitelisted')
    }
  })

  it('rejects a string field larger than the payload limit', () => {
    const huge = 'a'.repeat(MAX_PAYLOAD_LENGTH + 1)
    const result = validateWebviewMessage({ command: 'encode', text: huge }, WHITELIST)
    assert.strictEqual(result.ok, false)
    if (!result.ok) {
      assert.strictEqual(result.reason, 'payload-too-large')
    }
  })

  it('accepts a string field exactly at the payload limit (boundary)', () => {
    const atLimit = 'a'.repeat(MAX_PAYLOAD_LENGTH)
    const result = validateWebviewMessage({ command: 'encode', text: atLimit }, WHITELIST)
    assert.strictEqual(result.ok, true)
  })

  it('accepts a valid whitelisted message and preserves the payload', () => {
    const result = validateWebviewMessage({ command: 'encode', text: 'dev' }, WHITELIST)
    assert.strictEqual(result.ok, true)
    if (result.ok) {
      assert.strictEqual(result.message.command, 'encode')
      assert.strictEqual(result.message.text, 'dev')
    }
  })

  it('accepts non-string payload fields (numbers/booleans from tool protocols)', () => {
    const result = validateWebviewMessage(
      { command: 'encode', length: 16, uppercase: true },
      WHITELIST
    )
    assert.strictEqual(result.ok, true)
  })

  it('rejects every command when the whitelist is empty (declarative panels)', () => {
    const result = validateWebviewMessage({ command: 'encode' }, [])
    assert.strictEqual(result.ok, false)
    if (!result.ok) {
      assert.strictEqual(result.reason, 'not-whitelisted')
    }
  })
})
