export default {
  "*.{mjs,js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
  "*.{json,md,css,scss}": ["prettier --write"],
  "cli/src/registry/**/*": () => "npm run sync:showcase",
};
