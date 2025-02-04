module.exports = {
  "root": true,
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    'plugin:@typescript-eslint/recommended'
  ],
  "parser": '@typescript-eslint/parser',
  "plugins": [
    '@typescript-eslint',
  ],
  // "parserOptions": {
  //   "ecmaVersion": 12
  // },
  "rules": {
    "semi": ["error", "never"],
    "no-implicit-globals": "error",
    "no-cond-assign": "off",
    "no-control-regex": "off",
    "getter-return": "off",
    "no-useless-escape": "warn",
    "arrow-parens": ["error", "always"],
    "object-curly-spacing": ["error", "always"],
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-this-alias": "off",
    "@typescript-eslint/space-before-function-paren": ["error", {
      "anonymous": "never",
      "named": "never",
      "asyncArrow": "always"
    }],
    "@typescript-eslint/no-var-requires": "off",
  },
  "globals": {
    "up": "writable",
    "jQuery": "readonly",
    "require": "readonly",
    "module": "readonly",
  },
  "overrides": [
    {
      "files": ["spec/**/*.js"],
      "globals": {
        "jasmine": "writable",
        "describe": "readonly",
        "xdescribe": "readonly",
        "it": "readonly",
        "xit": "readonly",
        "expect": "readonly",
        "expectAsync": "readonly",
        "beforeEach": "readonly",
        "beforeAll": "readonly",
        "afterEach": "readonly",
        "spyOn": "readonly",
        "spyOnProperty": "readonly",
        "pending": "readonly",
        "asyncSpec": "readonly",
        "fixture": "readonly",
        "fixtureStyle": "readonly",
        "fixtureStyleSheet": "readonly",
        "htmlFixture": "readonly",
        "htmlFixtureList": "readonly",
        "$fixture": "readonly",
        "wait": "readonly",
        "registerFixture": "readonly",
        "makeLayers": "readonly",
        "Trigger": "readonly",
        "promiseState": "readonly",
        "raceThenables": "readonly",
        "allowGlobalErrors": "readonly",
        "fixtureInOverlay": "readonly",
        "describeFallback": "readonly",
        "AgentDetector": "readonly",
        "safeHistory": "readonly",
      },
      "rules": {
        "@typescript-eslint/no-unused-vars": "off"
      },
    },
    {
      "files": ["bin/**/*.js"],
      "globals": {
        "process": "readonly",
      }
    }
  ]

}
