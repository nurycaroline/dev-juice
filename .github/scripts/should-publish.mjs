// Idempotency gate for the publish workflow.
//
// Reads the local version from package.json, queries both the VS Code
// Marketplace and Open VSX for already-published versions, and emits two
// GitHub Actions outputs so the workflow only calls `vsce publish` /
// `ovsx publish` when the local version is not yet on the respective store.
// This keeps push-to-main idempotent: doc-only pushes that don't bump the
// version succeed without attempting a redundant publish (which both stores
// would reject anyway).
//
// The two stores are checked independently because they can drift: the
// extension may exist on the Marketplace but not yet on Open VSX (Cursor's
// registry), in which case only the Open VSX publish runs.
//
// Inputs (env):
//   GITHUB_OUTPUT - set by GitHub Actions; the script appends
//                   `should-publish=...` and `should-publish-openvsx=...`.
//
// Exits 0 in all deterministic cases (including "already published" and
// "query failed"). A real publish failure is surfaced by `vsce publish` /
// `ovsx publish` itself downstream, not here.

import { appendFile, readFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'

const OPEN_VSX_API = 'https://open-vsx.org/api'

const pkg = JSON.parse(await readFile('package.json', 'utf8'))
const id = `${pkg.publisher}.${pkg.name}`
const namespace = pkg.publisher
const extensionName = pkg.name
const localVersion = pkg.version

// ── VS Code Marketplace ──────────────────────────────────────────────────────
let marketplaceVersions = []
let marketplaceError = null
try {
  const stdout = execSync(`npx --no-install @vscode/vsce show --json ${id}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
  const data = JSON.parse(stdout)
  marketplaceVersions = (data.versions ?? []).map(v => v.version)
} catch (err) {
  marketplaceError = err instanceof Error ? err.message : String(err)
}

const shouldPublishMarketplace = !marketplaceVersions.includes(localVersion)

// ── Open VSX ─────────────────────────────────────────────────────────────────
// Node 18+ has a global fetch; the workflow runs on Node 20. A 404 means the
// extension was never published to Open VSX yet → publish. A network error is
// treated as "unknown" → publish (ovsx will fail loudly if the version already
// exists, which is the safer default than silently skipping).
let openVsxVersions = []
let openVsxError = null
try {
  const response = await fetch(`${OPEN_VSX_API}/${namespace}/${extensionName}`)
  if (response.status === 404) {
    // Extension not yet on Open VSX — nothing to compare against.
  } else if (!response.ok) {
    openVsxError = `HTTP ${response.status} ${response.statusText}`
  } else {
    const data = await response.json()
    openVsxVersions = Object.keys(data.allVersions ?? {})
  }
} catch (err) {
  openVsxError = err instanceof Error ? err.message : String(err)
}

const shouldPublishOpenVsx = !openVsxVersions.includes(localVersion)

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`Extension id:        ${id}`)
console.log(`Local version:       ${localVersion}`)
if (marketplaceError) {
  console.log(`Marketplace versions: (unknown — query failed: ${marketplaceError})`)
} else {
  console.log(`Marketplace versions: ${marketplaceVersions.length ? marketplaceVersions.join(', ') : '(none)'}`)
}
console.log(`Should publish (Marketplace): ${shouldPublishMarketplace}`)
if (openVsxError) {
  console.log(`Open VSX versions:    (unknown — query failed: ${openVsxError})`)
} else {
  console.log(`Open VSX versions:    ${openVsxVersions.length ? openVsxVersions.join(', ') : '(none — not yet published)'}`)
}
console.log(`Should publish (Open VSX):   ${shouldPublishOpenVsx}`)

const ghOutput = process.env.GITHUB_OUTPUT
if (ghOutput) {
  await appendFile(ghOutput, `should-publish=${shouldPublishMarketplace}\n`)
  await appendFile(ghOutput, `should-publish-openvsx=${shouldPublishOpenVsx}\n`)
}

process.exit(0)
