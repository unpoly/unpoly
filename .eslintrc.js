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
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-this-alias": "off"
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
        "it": "readonly",
        "expect": "readonly",
        "fixture": "readonly",
        "wait": "readonly",
        "beforeEach": "readonly",
        "afterEach": "readonly",
        "asyncSpec": "readonly",
      }
    }
  ]

}
