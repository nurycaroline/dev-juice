import { defineConfig } from '@vscode/test-cli'

export default defineConfig([
  {
    label: 'unit',
    files: 'out/test/unit/**/*.test.js',
    version: 'stable',
    mocha: {
      ui: 'bdd',
      timeout: 20000
    }
  },
  {
    label: 'integration',
    files: 'out/test/integration/**/*.test.js',
    version: 'stable',
    mocha: {
      ui: 'bdd',
      timeout: 20000
    }
  }
])
