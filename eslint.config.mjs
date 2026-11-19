import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'coverage/**',
      '.migration-audit/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  ...nextCoreWebVitals,
];

export default eslintConfig;
