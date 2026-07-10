import * as assert from 'assert'
import * as vscode from 'vscode'
import { BaseWebviewPanel } from '../../panels/BaseWebviewPanel'
import { CpfPanel } from '../../panels/tools/cpfPanel'
import { PixGeneratorPanel } from '../../panels/tools/pixGeneratorPanel'

function delay (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('Generator panels gain CSP via loadTemplate (ARCH-03/ARCH-10)', () => {
  let extensionUri: vscode.Uri
  const originalCreate = vscode.window.createWebviewPanel
  let createdPanels: vscode.WebviewPanel[] = []

  before(async () => {
    const ext = vscode.extensions.getExtension('NuryStudio.dev-juice')
    assert.ok(ext)
    await ext.activate()
    extensionUri = ext.extensionUri
  })

  beforeEach(() => {
    createdPanels = []
    vscode.window.createWebviewPanel = ((viewType, title, showOptions, options) => {
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

  it('CPF generator HTML contains a CSP meta tag and nonce (previously loaded raw via fs)', () => {
    BaseWebviewPanel.createOrShow(
      { viewType: 'test.gen.cpf', title: 'CPF', template: 'cpf-generator' },
      extensionUri,
      CpfPanel
    )
    const html = createdPanels[0].webview.html
    assert.match(html, /Content-Security-Policy/)
    assert.match(html, /default-src 'none'/)
    assert.match(html, /script-src 'nonce-[A-Za-z0-9]+'/)
  })

  it('PIX generator HTML contains a CSP meta tag (fallback error-HTML vector removed)', () => {
    BaseWebviewPanel.createOrShow(
      { viewType: 'test.gen.pix', title: 'PIX', template: 'pix-generator' },
      extensionUri,
      PixGeneratorPanel
    )
    const html = createdPanels[0].webview.html
    assert.match(html, /Content-Security-Policy/)
    assert.match(html, /script-src 'nonce-[A-Za-z0-9]+'/)
  })
})
