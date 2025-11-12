export default {
  "*.{mjs,js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
  "*.{json,md}": ["prettier --write"],
};
