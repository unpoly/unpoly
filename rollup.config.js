// import coffeescriptPlugin from 'rollup-plugin-coffee-script';
import typescript from 'typescript'
import typescriptPlugin from '@rollup/plugin-typescript';
// import typescriptPlugin from 'rollup-plugin-typescript2';
// import commonjsPlugin from '@rollup/plugin-commonjs';

export default {
  input: './lib/assets/javascripts/unpoly.js',
  output: {
    file: 'dist/unpoly.js',
    format: 'iife'
  },
  plugins: [
    // coffeescriptPlugin({ include: '**/*.coffee' }),
    // commonjsPlugin({ extensions: ['.js', '.coffee']}),
    typescriptPlugin({ target: 'es5', include: '**/unpoly.js' })
  ]
};
