import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'
import { getTools } from '../../tools/toolRegistry'

/**
 * Comandos declarados no manifesto que NÃO abrem painel de webview
 * (comandos de editor + sobra de template). Ficam de fora do registro
 * de painéis de propósito e são exceções documentadas da regra 2.
 */
const NON_PANEL_COMMANDS: readonly string[] = [
  'dev-juice.ansiFormatterProcessSelection',
  'dev-juice.formatTextAlternatingCase',
  'dev-juice.formatTextCamelCase',
  'dev-juice.formatTextCapitalizedCase',
  'dev-juice.formatTextInverseCase',
  'dev-juice.formatTextKebabCase',
  'dev-juice.formatTextLowerCase',
  'dev-juice.formatTextPascalCase',
  'dev-juice.formatTextSentenceCase',
  'dev-juice.formatTextSnakeCase',
  'dev-juice.formatTextUpperCase',
  'dev-juice.formatTextDotNotation',
  'dev-juice.formatTextParamsStyle',
  'dev-juice.formatTextPathStyle',
  'dev-juice.insertCNPJFormatted',
  'dev-juice.insertCNPJUnformatted',
  'dev-juice.insertCPFFormatted',
  'dev-juice.insertCPFUnformatted',
  'dev-juice.insertUUIDFormatted',
  'dev-juice.insertUUIDUnformatted'
]

// Regra 1: todo comando do registro existe em contributes.commands
function commandsMissingFromManifest (
  registryCommands: readonly string[],
  manifestCommands: readonly string[]
): string[] {
  const manifest = new Set(manifestCommands)
  return registryCommands.filter(cmd => !manifest.has(cmd))
}

// Regra 2: todo comando de painel do manifesto existe no registro
function panelCommandsMissingFromRegistry (
  manifestCommands: readonly string[],
  registryCommands: readonly string[],
  nonPanelWhitelist: readonly string[]
): string[] {
  const registry = new Set(registryCommands)
  const whitelist = new Set(nonPanelWhitelist)
  return manifestCommands.filter(
    cmd => cmd.startsWith('dev-juice.') && !whitelist.has(cmd) && !registry.has(cmd)
  )
}

// Regra 3: todo template do registro existe em src/templates/
function templatesMissingOnDisk (
  templateNames: readonly string[],
  templatesDir: string
): string[] {
  return templateNames.filter(
    name => !fs.existsSync(path.join(templatesDir, `${name}.html`))
  )
}

const manifest = require('../../../package.json')
const manifestCommands: string[] = manifest.contributes.commands.map(
  (c: { command: string }) => c.command
)
const registryCommands = getTools().map(t => t.command)
const templatesDir = path.join(__dirname, '..', '..', '..', 'src', 'templates')

describe('registry ↔ manifest ↔ templates consistency (real repository)', () => {
  it('rule 1: every registry command is declared in package.json', () => {
    assert.deepStrictEqual(
      commandsMissingFromManifest(registryCommands, manifestCommands),
      []
    )
  })

  it('rule 2: every panel command in package.json exists in the registry', () => {
    assert.deepStrictEqual(
      panelCommandsMissingFromRegistry(manifestCommands, registryCommands, NON_PANEL_COMMANDS),
      []
    )
  })

  it('rule 3: every registry template file exists in src/templates', () => {
    assert.deepStrictEqual(
      templatesMissingOnDisk(getTools().map(t => t.template), templatesDir),
      []
    )
  })

  it('every panel command title in the manifest matches the registry title (ARCH-12)', () => {
    const manifestTitleByCommand = new Map<string, string>(
      manifest.contributes.commands.map((c: { command: string, title: string }) => [c.command, c.title])
    )
    for (const tool of getTools()) {
      assert.strictEqual(
        manifestTitleByCommand.get(tool.command),
        tool.title,
        `título de ${tool.command} deve coincidir com o registro`
      )
    }
  })

  it('all converter commands are reachable from the command palette (declared in manifest)', () => {
    const converterCommands = getTools()
      .filter(t => t.category === 'Conversores')
      .map(t => t.command)
    const manifestSet = new Set(manifestCommands)
    for (const cmd of converterCommands) {
      assert.ok(manifestSet.has(cmd), `${cmd} deve estar em contributes.commands`)
    }
  })
})

describe('registry consistency rules detect divergence (negative fixtures)', () => {
  it('rule 1 flags a registry command absent from the manifest', () => {
    assert.deepStrictEqual(
      commandsMissingFromManifest(['dev-juice.ghost'], ['dev-juice.real']),
      ['dev-juice.ghost']
    )
  })

  it('rule 2 flags a manifest panel command absent from the registry', () => {
    assert.deepStrictEqual(
      panelCommandsMissingFromRegistry(
        ['dev-juice.orphan', 'dev-juice.known'],
        ['dev-juice.known'],
        []
      ),
      ['dev-juice.orphan']
    )
  })

  it('rule 2 does not flag whitelisted non-panel (editor) commands', () => {
    assert.deepStrictEqual(
      panelCommandsMissingFromRegistry(
        ['dev-juice.formatTextCamelCase'],
        [],
        ['dev-juice.formatTextCamelCase']
      ),
      []
    )
  })

  it('rule 3 flags a registry template with no file on disk', () => {
    assert.deepStrictEqual(
      templatesMissingOnDisk(['definitely-not-a-real-template'], templatesDir),
      ['definitely-not-a-real-template']
    )
  })
})
