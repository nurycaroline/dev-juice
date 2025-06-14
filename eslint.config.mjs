import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [{
  files: ['**/*.ts'],
  ignores: [
    'out/**',
    'node_modules/**',
    '*.d.ts',
    'coverage/**',
    'dist/**'
  ],
  plugins: {
    '@typescript-eslint': typescriptEslint
  },
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: import.meta.dirname
    }
  },
  rules: {
    indent: ['error', 2],
    'no-tabs': 'error',
    semi: ['error', 'never'],
    quotes: ['error', 'single'],
    'comma-dangle': ['error', 'never'],
    'space-before-function-paren': ['error', 'always'],
    'keyword-spacing': 'error',
    'space-infix-ops': 'error',
    'space-before-blocks': 'error',
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    '@typescript-eslint/naming-convention': ['warn', {
      selector: 'import',
      format: ['camelCase', 'PascalCase']
    }],
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    curly: 'warn',
    eqeqeq: 'warn',
    'no-throw-literal': 'warn'
  }
}]
