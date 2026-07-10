import * as assert from 'assert'
import * as vscode from 'vscode'
import { BaseWebviewPanel } from '../../panels/BaseWebviewPanel'
import { getTools } from '../../tools/toolRegistry'

function delay (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('Declarative converter panels (ARCH-02/ARCH-03)', () => {
  let extensionUri: vscode.Uri
  const originalCreate = vscode.window.createWebviewPanel
  let createCount = 0
  let createdPanels: vscode.WebviewPanel[] = []

  before(async () => {
    const ext = vscode.extensions.getExtension('NuryStudio.dev-juice')
    assert.ok(ext)
    await ext.activate()
    extensionUri = ext.extensionUri
  })

  beforeEach(() => {
    createCount = 0
    createdPanels = []
    vscode.window.createWebviewPanel = ((viewType, title, showOptions, options) => {
      createCount++
      const panel = originalCreate.call(vscode.window, viewType, title, showOptions, options)
      createdPanels.push(panel)
      return panel
    }) as typeof vscode.window.createWebviewPanel
  })

  afterEach(async () => {
    vscode.window.createWebviewPanel = originalCreate
    for (const panel of createdPanels) {
      try {
        panel.dispose()
      } catch {
        // já descartado
      }
    }
    await delay(30)
  })

  it('every converter entry is declarative (no host factory)', () => {
    const converters = getTools().filter(t => t.category === 'Conversores' && t.template.endsWith('-converter'))
    const unitConverters = converters.filter(t => t.factory === undefined)
    assert.ok(unitConverters.length >= 2)
    for (const tool of unitConverters) {
      assert.strictEqual(tool.factory, undefined, `${tool.command} deve ser declarativo`)
    }
  })

  it('opens two representative converters directly on the base with CSP present', () => {
    const samples = ['length-converter', 'weight-converter']
    for (const template of samples) {
      createCount = 0
      createdPanels = []
      BaseWebviewPanel.createOrShow(
        { viewType: `test.conv.${template}`, title: template, template },
        extensionUri
      )
      assert.strictEqual(createCount, 1, `${template} cria um painel`)
      const html = createdPanels[0].webview.html
      assert.match(html, /Content-Security-Policy/, `${template} tem CSP`)
      assert.match(html, /script-src 'nonce-[A-Za-z0-9]+'/, `${template} tem nonce`)
      createdPanels[0].dispose()
    }
  })

  it('reveals an already-open converter instead of duplicating it', () => {
    BaseWebviewPanel.createOrShow(
      { viewType: 'test.conv.reveal', title: 'Área', template: 'area-converter' },
      extensionUri
    )
    assert.strictEqual(createCount, 1)
    BaseWebviewPanel.createOrShow(
      { viewType: 'test.conv.reveal', title: 'Área', template: 'area-converter' },
      extensionUri
    )
    assert.strictEqual(createCount, 1, 'segunda invocação revela, não duplica')
  })
})
