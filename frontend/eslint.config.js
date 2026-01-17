export default [
  {
    ignores: ["dist/*", "node_modules/*"],
  },
  {
      files: ["**/*.{js,jsx,ts,tsx}"],
      rules: {
          "react/react-in-jsx-scope": "off",
          "react/prop-types": "off",
      },
      languageOptions: {
          parserOptions: {
              ecmaVersion: "latest",
              sourceType: "module",
              ecmaFeatures: {
                  jsx: true,
              },
          },
      }
  }
];
