import * as assert from 'assert'
import { DevJuiceProvider, DevToolItem } from '../../providers/devJuiceProvider'
import { getTools, getToolsByCategory, ToolCategory, ToolDefinition } from '../../tools/toolRegistry'

describe('DevJuiceProvider tree derived from registry (ARCH-05)', () => {
  it('renders the four categories at the root in registry order', async () => {
    const provider = new DevJuiceProvider()
    const roots = await provider.getChildren()
    assert.deepStrictEqual(
      roots.map(item => item.label),
      ['Geradores', 'Formatação', 'Conversores', 'Utilitários']
    )
  })

  it('renders, per category, exactly the registry tools for that category', async () => {
    const provider = new DevJuiceProvider()
    const grouped = getToolsByCategory()
    const roots = await provider.getChildren()
    for (const root of roots) {
      const children = await provider.getChildren(root)
      const expected = grouped.get(root.label as ToolCategory) ?? []
      assert.strictEqual(children.length, expected.length, `contagem de ${root.label}`)
      assert.deepStrictEqual(
        children.map(c => c.commandId),
        expected.map(t => t.command)
      )
    }
  })

  it('total leaf items equal the number of tools in the registry', async () => {
    const provider = new DevJuiceProvider()
    const roots = await provider.getChildren()
    let total = 0
    for (const root of roots) {
      total += (await provider.getChildren(root)).length
    }
    assert.strictEqual(total, getTools().length)
  })

  it('leaf items carry a command and a tooltip', async () => {
    const provider = new DevJuiceProvider()
    const roots = await provider.getChildren()
    const firstCategory = roots[0]
    const children = await provider.getChildren(firstCategory)
    const leaf = children[0] as DevToolItem
    assert.ok(leaf.command)
    assert.strictEqual(leaf.command?.command, leaf.commandId)
    assert.ok(leaf.tooltip.length > 0)
  })

  it('renders empty without throwing when the registry is empty (edge case)', async () => {
    const emptyProvider = new DevJuiceProvider(() => new Map<ToolCategory, ToolDefinition[]>())
    const roots = await emptyProvider.getChildren()
    assert.deepStrictEqual(roots, [])
  })
})
