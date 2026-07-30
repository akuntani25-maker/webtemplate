// Flat config (ESLint 9) — sejajar dengan apps/web agar ekstensi ESLint
// di VS Code memakai satu versi & satu gaya konfigurasi untuk seluruh monorepo.
import tseslint from 'typescript-eslint';

const config = [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.config.mjs'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        // Decorator NestJS
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Test boleh lebih longgar
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
];

export default config;
