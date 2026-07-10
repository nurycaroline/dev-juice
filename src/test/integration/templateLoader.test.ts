import * as assert from 'assert'
import * as vscode from 'vscode'
import { loadTemplate } from '../../utils/templateLoader'

describe('templateLoader.loadTemplate (spec edge cases)', () => {
  let extensionUri: vscode.Uri

  before(async () => {
    const ext = vscode.extensions.getExtension('NuryStudio.dev-juice')
    assert.ok(ext)
    await ext.activate()
    extensionUri = ext.extensionUri
  })

  it('loads a real template with CSP and nonce applied', () => {
    const html = loadTemplate(extensionUri, 'length-converter')
    assert.match(html, /Content-Security-Policy/)
    assert.match(html, /script-src 'nonce-[A-Za-z0-9]+'/)
  })

  it('fails with a controlled error on a path-traversal template name (does not read outside src/templates)', () => {
    assert.throws(
      () => loadTemplate(extensionUri, '../../package'),
      /Não foi possível carregar o template/
    )
  })
})
