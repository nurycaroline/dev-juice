// Idempotency gate for the publish workflow.
//
// Reads the local version from package.json, queries the Marketplace for the
// list of already-published versions, and emits a `should-publish` GitHub
// Actions output so the workflow only calls `vsce publish` when the local
// version is not yet on the store. This keeps push-to-main idempotent: doc-only
// pushes that don't bump the version succeed without attempting a redundant
// publish (which the Marketplace would reject anyway).
//
// Inputs (env):
//   GITHUB_OUTPUT - set by GitHub Actions; the script appends `should-publish=...`.
//
// Exits 0 in all deterministic cases (including "already published" and
// "Marketplace query failed"). A real publish failure is surfaced by `vsce
// publish` itself downstream, not here.

import { appendFile, readFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(await readFile('package.json', 'utf8'))
const id = `${pkg.publisher}.${pkg.name}`
const localVersion = pkg.version

let publishedVersions = []
let queryError = null
try {
  const stdout = execSync(`npx --no-install @vscode/vsce show --json ${id}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
  const data = JSON.parse(stdout)
  publishedVersions = (data.versions ?? []).map(v => v.version)
} catch (err) {
  queryError = err instanceof Error ? err.message : String(err)
}

const alreadyPublished = publishedVersions.includes(localVersion)
const shouldPublish = !alreadyPublished

console.log(`Extension id:      ${id}`)
console.log(`Local version:     ${localVersion}`)
if (queryError) {
  console.log(`Published version: (unknown — query failed: ${queryError})`)
} else {
  console.log(`Published versions: ${publishedVersions.length ? publishedVersions.join(', ') : '(none)'}`)
}
console.log(`Should publish:    ${shouldPublish}`)

const ghOutput = process.env.GITHUB_OUTPUT
if (ghOutput) {
  await appendFile(ghOutput, `should-publish=${shouldPublish}\n`)
}

process.exit(0)
