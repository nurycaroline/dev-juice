import * as assert from 'assert'
import { getTools, getToolsByCategory, ToolCategory } from '../../tools/toolRegistry'

describe('toolRegistry.getTools', () => {
  it('declares every existing panel tool (34 entries)', () => {
    assert.strictEqual(getTools().length, 34)
  })

  it('has unique command ids', () => {
    const commands = getTools().map(t => t.command)
    assert.strictEqual(new Set(commands).size, commands.length)
  })

  it('namespaces every command under dev-juice', () => {
    for (const tool of getTools()) {
      assert.match(tool.command, /^dev-juice\./)
    }
  })

  it('does not reference the non-existent CaseConverter tool', () => {
    for (const tool of getTools()) {
      assert.doesNotMatch(tool.command, /caseConverter/i)
      assert.doesNotMatch(tool.template, /case-converter/i)
    }
  })

  it('gives every tool a title, description and template', () => {
    for (const tool of getTools()) {
      assert.ok(tool.title.length > 0, `${tool.command} title`)
      assert.ok(tool.description.length > 0, `${tool.command} description`)
      assert.ok(tool.template.length > 0, `${tool.command} template`)
    }
  })

  it('splits entries into declarative (no factory) and host-logic (factory)', () => {
    const withFactory = getTools().filter(t => typeof t.factory === 'function')
    const declarative = getTools().filter(t => t.factory === undefined)
    assert.strictEqual(withFactory.length, 17)
    assert.strictEqual(declarative.length, 17)
  })
})

describe('toolRegistry.getToolsByCategory', () => {
  it('groups tools into the four categories with the expected counts', () => {
    const grouped = getToolsByCategory()
    const counts: Record<ToolCategory, number> = {
      Geradores: grouped.get('Geradores')?.length ?? 0,
      Formatação: grouped.get('Formatação')?.length ?? 0,
      Conversores: grouped.get('Conversores')?.length ?? 0,
      Utilitários: grouped.get('Utilitários')?.length ?? 0
    }
    assert.strictEqual(counts.Geradores, 6)
    assert.strictEqual(counts['Formatação'], 3)
    assert.strictEqual(counts.Conversores, 18)
    assert.strictEqual(counts['Utilitários'], 7)
  })

  it('accounts for every tool exactly once across categories', () => {
    const grouped = getToolsByCategory()
    let total = 0
    for (const bucket of grouped.values()) {
      total += bucket.length
    }
    assert.strictEqual(total, getTools().length)
  })
})
