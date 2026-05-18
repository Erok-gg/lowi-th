import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Sprint 10 post-audit : règle React 19 v7 a beaucoup de faux positifs
      // sur les patterns valides (data fetching post-mount, setInterval, callbacks).
      // Cf https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect
      // Maintenu en warn pour signaler les vrais antipatterns sans bloquer la CI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
  ]),
]);

export default eslintConfig;
