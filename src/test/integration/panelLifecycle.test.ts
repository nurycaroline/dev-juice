import * as assert from 'assert'
import * as path from 'path'
import * as vscode from 'vscode'
import { BaseWebviewPanel } from '../../panels/BaseWebviewPanel'

function delay (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('BaseWebviewPanel lifecycle (ARCH-01)', () => {
  let extensionUri: vscode.Uri
  const originalCreate = vscode.window.createWebviewPanel
  const originalError = vscode.window.showErrorMessage

  let createCount = 0
  let createdPanels: vscode.WebviewPanel[] = []
  let lastOptions: (vscode.WebviewPanelOptions & vscode.WebviewOptions) | undefined
  let errorMessages: string[] = []

  before(async () => {
    const ext = vscode.extensions.getExtension('NuryStudio.dev-juice')
    assert.ok(ext, 'extension should be discoverable')
    await ext.activate()
    extensionUri = ext.extensionUri
  })

  beforeEach(() => {
    createCount = 0
    createdPanels = []
    lastOptions = undefined
    errorMessages = []

    const spiedCreate: typeof vscode.window.createWebviewPanel = (
      viewType, title, showOptions, options
    ) => {
      createCount++
      lastOptions = options as vscode.WebviewPanelOptions & vscode.WebviewOptions
      const panel = originalCreate.call(vscode.window, viewType, title, showOptions, options)
      createdPanels.push(panel)
      return panel
    }
    vscode.window.createWebviewPanel = spiedCreate

    const spiedError = ((message: string) => {
      errorMessages.push(message)
      return Promise.resolve(undefined)
    }) as unknown as typeof vscode.window.showErrorMessage
    vscode.window.showErrorMessage = spiedError
  })

  afterEach(async () => {
    vscode.window.createWebviewPanel = originalCreate
    vscode.window.showErrorMessage = originalError
    for (const panel of createdPanels) {
      try {
        panel.dispose()
      } catch {
        // já descartado
      }
    }
    await delay(30)
  })

  it('AC1: creates exactly one panel with scripts enabled and roots restricted to src/templates', () => {
    BaseWebviewPanel.createOrShow(
      { viewType: 'test.ac1', title: 'AC1', template: 'length-converter' },
      extensionUri
    )

    assert.strictEqual(createCount, 1)
    assert.strictEqual(lastOptions?.enableScripts, true)
    assert.ok(lastOptions?.localResourceRoots, 'localResourceRoots must be set')
    assert.strictEqual(lastOptions?.localResourceRoots?.length, 1)
    assert.ok(
      lastOptions?.localResourceRoots?.[0].fsPath.endsWith(path.join('src', 'templates')),
      'root must be restricted to src/templates'
    )
  })

  it('AC2: reveals the existing panel instead of creating a second one', () => {
    BaseWebviewPanel.createOrShow(
      { viewType: 'test.ac2', title: 'AC2', template: 'length-converter' },
      extensionUri
    )
    const revealSpy = { calls: 0 }
    const panel = createdPanels[0]
    const originalReveal = panel.reveal.bind(panel)
    panel.reveal = (...args: Parameters<typeof panel.reveal>) => {
      revealSpy.calls++
      return originalReveal(...args)
    }

    BaseWebviewPanel.createOrShow(
      { viewType: 'test.ac2', title: 'AC2', template: 'length-converter' },
      extensionUri
    )

    assert.strictEqual(createCount, 1, 'no second panel created')
    assert.strictEqual(revealSpy.calls, 1, 'existing panel revealed')
  })

  it('AC3: disposing clears the singleton so a new invocation creates a fresh panel', async () => {
    BaseWebviewPanel.createOrShow(
      { viewType: 'test.ac3', title: 'AC3', template: 'length-converter' },
      extensionUri
    )
    assert.strictEqual(createCount, 1)

    createdPanels[0].dispose()
    await delay(50)

    BaseWebviewPanel.createOrShow(
      { viewType: 'test.ac3', title: 'AC3', template: 'length-converter' },
      extensionUri
    )
    assert.strictEqual(createCount, 2, 'a new panel is created after dispose')
  })

  it('AC4: serves HTML through loadTemplate with a CSP meta tag and cryptographic nonce', () => {
    BaseWebviewPanel.createOrShow(
      { viewType: 'test.ac4', title: 'AC4', template: 'length-converter' },
      extensionUri
    )
    const html = createdPanels[0].webview.html
    assert.match(html, /Content-Security-Policy/)
    assert.match(html, /default-src 'none'/)
    assert.match(html, /script-src 'nonce-[A-Za-z0-9]+'/)
  })

  it('AC5: a missing template shows an error message and does not throw in the host', async () => {
    assert.doesNotThrow(() => {
      BaseWebviewPanel.createOrShow(
        { viewType: 'test.ac5', title: 'AC5', template: 'this-template-does-not-exist' },
        extensionUri
      )
    })
    await delay(30)
    assert.strictEqual(errorMessages.length, 1)
    assert.match(errorMessages[0], /Não foi possível carregar/)
  })
})
