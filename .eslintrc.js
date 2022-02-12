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
    "no-implicit-globals": "error",
    "no-cond-assign": "off",
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
    "jasmine": "writable"
  }
};

