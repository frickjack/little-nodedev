module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-typescript',
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-namespace": "off",
    "max-classes-per-file": "off",
    "no-underscore-dangle": "off",
    "import/extensions": "off",
    "import/prefer-default-export": "off",
    "no-param-reassign": "off",
    "no-multiple-empty-lines": "off",
    "no-plusplus": "off",
    "class-methods-use-this": "off",
    "no-restricted-syntax": "off",
    "function-paren-newline": "off",
    "no-prototype-builtins": "off",
    "import/no-extraneous-dependencies": "off",
    "@typescript-eslint/lines-between-class-members": "off",
  },
};
