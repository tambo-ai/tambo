export default {
  // Exclude .mjs config files from linting
  "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
  "*.{json,md,mdx,css,scss}": ["prettier --write"],
  // Explicitly ignore .mjs files
  "*.mjs": [],
};
