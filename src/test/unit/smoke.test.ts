import * as assert from 'assert'
import { secureHash } from '../../utils/securityUtils'

describe('Unit smoke', () => {
  it('secureHash produces a stable sha256 hex digest', () => {
    const hash = secureHash('dev-juice')
    assert.strictEqual(hash.length, 64)
    assert.match(hash, /^[0-9a-f]{64}$/)
    assert.strictEqual(hash, secureHash('dev-juice'))
  })
})
