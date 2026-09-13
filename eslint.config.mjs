import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@stylistic': stylistic,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        up: 'writable',
        jQuery: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      '@stylistic/semi': ['error', 'never'],
      'no-implicit-globals': 'error',
      'no-cond-assign': 'off',
      'no-control-regex': 'off',
      'getter-return': 'off',
      'no-useless-escape': 'warn',
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@stylistic/space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      }],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: ['spec/**/*.js'],
    languageOptions: {
      globals: {
        jasmine: 'writable',
        describe: 'readonly',
        fdescribe: 'readonly',
        xdescribe: 'readonly',
        it: 'readonly',
        fit: 'readonly',
        xit: 'readonly',
        expect: 'readonly',
        expectAsync: 'readonly',
        beforeEach: 'readonly',
        beforeAll: 'readonly',
        afterEach: 'readonly',
        spyOn: 'readonly',
        spyOnProperty: 'readonly',
        pending: 'readonly',
        fixture: 'readonly',
        helloFixture: 'readonly',
        fixtureStyle: 'readonly',
        fixtureStyleSheet: 'readonly',
        htmlFixture: 'readonly',
        htmlFixtureList: 'readonly',
        $fixture: 'readonly',
        wait: 'readonly',
        registerFixture: 'readonly',
        fileList: 'readonly',
        makeLayers: 'readonly',
        Trigger: 'readonly',
        promiseState: 'readonly',
        allowGlobalErrors: 'readonly',
        describeFallback: 'readonly',
        extendDescribe: 'readonly',
        AgentDetector: 'readonly',
        specs: 'writable',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      // typescript-eslint's recommended config turns no-undef off, since tsc covers it.
      // We have no tsc, and specs need it: a spec file extracted from a larger one is its
      // own module, so anything it used from the enclosing file's scope is now undefined.
      // It also catches an assignment that forgot its const, which leaks a global that
      // outlives the fixture it points at.
      'no-undef': 'error',
    },
  },
  {
    files: ['bin/**/*.{js,mjs}', 'tooling/**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    // The one part of the runner that ships to the browser: a Jasmine reporter that
    // posts to the terminal. See tooling/README.md.
    files: ['tooling/runner/browser/poster.js'],
    languageOptions: {
      globals: {
        jasmine: 'readonly',
        specs: 'readonly',
      },
    },
  },
  {
    files: ['tooling/build/webpack/**/*.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
      },
    },
  },
)
