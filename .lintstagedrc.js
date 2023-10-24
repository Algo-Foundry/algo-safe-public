module.exports = {
  // Type check TypeScript files
  "**/*.(ts|tsx)": () => "yarn tsc --noEmit",

  // Lint & Prettify TS and JS files
  "**/*.(ts|tsx|js)": (filenames) => [
    `yarn eslint ${filenames.join(" ")} --no-error-on-unmatched-pattern --fix`,
    `yarn prettier --no-error-on-unmatched-pattern --write ${filenames.join(" ")}`,
  ],

  // Prettify only Markdown and JSON files
  "**/*.(md|json)": (filenames) => `yarn prettier --no-error-on-unmatched-pattern --write ${filenames.join(" ")}`,
};
