module.exports = {
  extends: ['expo', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prettier/prettier': 'warn',
  },
};
