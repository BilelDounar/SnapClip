module.exports = {
  root: true,
  env: {browser: true, es2021: true, node: true},
  parser: '@typescript-eslint/parser',
  parserOptions: {ecmaVersion: 2021, sourceType: 'module'},
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'src-tauri/target', 'node_modules'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {argsIgnorePattern: '^_', varsIgnorePattern: '^_'},
    ],
  },
};
