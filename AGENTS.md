# Project instructions

- Use the project's Prettier configuration for all changed files.
- After editing, run `npm run format` and verify with `npm run format:check`.
- After creating or changing any component, page, hook, service, or other source file, run
  `npm run lint` and leave ESLint passing before considering the work complete.
- Keep React components readable; do not compress a component or JSX tree into a single line.
- Keep one blank line between consecutive `const`, `let`, or hook declarations and between
  distinct logical JSX blocks. Never group independent hook declarations with the comma operator.
- Before creating UI markup, inspect the components in `src/shared/components/ui` and prioritize
  reusing or extending them. Use `DataTable` for tabular data instead of creating a native table
  in a feature page. Create a feature-specific replacement only when the shared component cannot
  satisfy the required behavior, and document that limitation in the implementation summary.
