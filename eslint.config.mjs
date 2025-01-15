import eslint from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import babelParser from "@babel/eslint-parser";

export default [
  eslint.configs.recommended,
  react.configs.flat.recommended,
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        sourceType: "module",
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-env", "@babel/preset-react"]
        },
        ecmaVersion: "latest",
        ecmaFeatures: {
          modules: true,
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.es2025,
        ...globals.node,
        ...globals.worker
      },
    },
    plugins: {
      react
    },
    rules: {
      "react/react-in-jsx-scope": 0,
      "react/prop-types": 0,
      "react/display-name": 0,
      "react/no-unescaped-entities": 0,
      "react-hooks/exhaustive-deps": 0,
      "react/jsx-no-target-blank": 0,
      "array-callback-return": 2,
      "arrow-spacing": [2, {
        "before": true,
        "after": true
      }],
      "block-spacing": [2, "always"],
      "comma-style": [2, "last"],
      "dot-location": [2, "property"],
      "dot-notation": 2,
      "eqeqeq": 2,
      "indent": [2, 2, {
        "SwitchCase": 1,
        "ignoreComments": true
      }],
      "no-async-promise-executor": 0,
      "no-const-assign": 2,
      "no-constant-condition": 0,
      "no-var": 2,
      "no-console": 0,
      "no-case-declarations": 0,
      "no-dupe-args": 2,
      "no-dupe-keys": 2,
      "no-duplicate-case": 2,
      "no-empty": 2,
      "no-extra-boolean-cast": 2,
      "no-extra-semi": 2,
      "no-obj-calls": 2,
      "no-tabs": 2,
      "no-unexpected-multiline": 2,
      "no-unreachable": 2,
      "no-alert": 2,
      "no-caller": 2,
      "no-eval": 2,
      "no-extra-bind": 2,
      "no-implied-eval": 2,
      "no-lone-blocks": 2,
      "no-multi-spaces": 2,
      "no-return-assign": 2,
      "no-self-assign": 2,
      "no-self-compare": 2,
      "no-useless-call": 2,
      "no-useless-concat": 2,
      "no-undef": 2,
      "no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "no-useless-constructor": 2,
      "no-dupe-class-members": 2,
      "no-unneeded-ternary": 2,
      "no-iterator": 2,
      "no-new-wrappers": 2,
      "object-shorthand": 2,
      "prefer-const": [2, {"destructuring": "all"}],
      "prefer-spread": 2,
      "prefer-rest-params": 2,
      "prefer-arrow-callback": 2,
      "quotes": [2, "double", {
        "avoidEscape": true,
        "allowTemplateLiterals": true
      }],
      "radix": [2, "always"],
      "require-atomic-updates": 0,
      "semi": 2,
      "space-before-blocks": 2,
      "strict": [2, "safe"],
      "space-in-parens": [2, "never"],
      "space-before-function-paren": [2, {
        "anonymous": "never",
        "named": "never",
        "asyncArrow": "always"
      }],
      "template-curly-spacing": 2,
      "use-isnan": 2,
      "valid-typeof": 2,
      "wrap-iife": [2, "inside"]
    }
  }
];
