import * as assert from 'assert'
import { generateNonce, sanitizeHTML, validateUserInput, secureHash } from '../../utils/securityUtils'

describe('securityUtils.generateNonce', () => {
  it('returns at least 32 alphanumeric characters', () => {
    const nonce = generateNonce()
    assert.ok(nonce.length >= 32, `expected >= 32 chars, got ${nonce.length}`)
    assert.match(nonce, /^[A-Za-z0-9]+$/)
  })

  it('produces unique values across many samples (cryptographic randomness)', () => {
    const samples = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      samples.add(generateNonce())
    }
    assert.strictEqual(samples.size, 1000)
  })
})

describe('securityUtils.sanitizeHTML', () => {
  it('escapes the ampersand', () => {
    assert.strictEqual(sanitizeHTML('a & b'), 'a &amp; b')
  })

  it('escapes the less-than sign', () => {
    assert.strictEqual(sanitizeHTML('a < b'), 'a &lt; b')
  })

  it('escapes the greater-than sign', () => {
    assert.strictEqual(sanitizeHTML('a > b'), 'a &gt; b')
  })

  it('escapes the double quote', () => {
    assert.strictEqual(sanitizeHTML('say "hi"'), 'say &quot;hi&quot;')
  })

  it('escapes the single quote', () => {
    assert.strictEqual(sanitizeHTML('it\'s'), 'it&#039;s')
  })

  it('neutralizes a script tag payload', () => {
    assert.strictEqual(
      sanitizeHTML('<script>alert(1)</script>'),
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    )
  })
})

describe('securityUtils.validateUserInput', () => {
  it('rejects non-string input', () => {
    assert.strictEqual(validateUserInput(123), false)
    assert.strictEqual(validateUserInput(null), false)
    assert.strictEqual(validateUserInput(undefined), false)
    assert.strictEqual(validateUserInput({}), false)
  })

  it('accepts a plain string with no constraints', () => {
    assert.strictEqual(validateUserInput('hello'), true)
  })

  it('rejects a string longer than maxLength', () => {
    assert.strictEqual(validateUserInput('abcdef', 3), false)
  })

  it('accepts a string within maxLength', () => {
    assert.strictEqual(validateUserInput('abc', 3), true)
  })

  it('rejects a string not matching the pattern', () => {
    assert.strictEqual(validateUserInput('abc', undefined, /^[0-9]+$/), false)
  })

  it('accepts a string matching the pattern', () => {
    assert.strictEqual(validateUserInput('123', undefined, /^[0-9]+$/), true)
  })
})

describe('securityUtils.secureHash', () => {
  it('returns a 64-char lowercase hex sha256 digest by default', () => {
    const hash = secureHash('dev-juice')
    assert.match(hash, /^[0-9a-f]{64}$/)
  })

  it('is deterministic for the same input', () => {
    assert.strictEqual(secureHash('abc'), secureHash('abc'))
  })

  it('produces different digests for different inputs', () => {
    assert.notStrictEqual(secureHash('abc'), secureHash('abd'))
  })

  it('honors an explicit algorithm argument', () => {
    assert.match(secureHash('abc', 'md5'), /^[0-9a-f]{32}$/)
  })
})
