# Copilot instructions for `builder-ui`

## Project context
- This repo is a Vite + React 19 + TypeScript front-end for a construction/builder management application.
- The app is intentionally still a thin shell (`src/App.tsx`, `src/main.tsx`), so add features in a clear, scalable structure rather than placing everything in one component.
- Treat `context-migration/openapi.yml` as the source of truth for backend contracts. Prefer Swagger-driven types and endpoint naming over ad-hoc API assumptions.

## Architecture and conventions
- Keep the app layered: `src/api` (HTTP client + endpoint wrappers), `src/features/*` (screens and use cases), `src/components/*` (reusable UI), `src/types/*` (Swagger-generated/domain models), and `src/lib/auth` (token/session helpers).
- Do not create business logic inside UI components; fetch data in hooks/services and pass typed data into components.
- Example patterns for this project: authentication/login/register/logout endpoints are under `/api/auth`, and the app is likely to add construction/company/machine/project domains next.
- Use TypeScript interfaces for every API contract; avoid `any` when a swagger schema exists.
- Prefer composition over large page components. A screen should orchestrate data fetching and state transitions, not contain all logic inline.

## API and auth patterns
- The backend uses JWT bearer auth (`bearerAuth` in `context-migration/openapi.yml`). Add `Authorization: Bearer <token>` to protected requests.
- Store the token in `sessionStorage` by default for browser session lifetime, and only use `localStorage` if the product explicitly requires “remember me”.
- Centralize token handling in one helper (`getToken`, `setToken`, `clearSession`, `authHeaders`) so login/logout and protected API calls behave consistently.
- For login flows, map `LoginResponse.token` to the session store and redirect to the authenticated dashboard after a successful response.
- For logout, call `/api/auth/logout` if the endpoint is available, then clear the session state immediately.

## Workflow and validation
- Install dependencies with `npm install` and run the app with `npm run dev`.
- Validate changes with `npm run build` and `npm run lint` before finishing feature work.
- Keep styling in Sass/CSS modules or standard `*.scss` files; do not introduce ad-hoc inline styles for shared UI.
- Follow the existing Vite/React setup; do not add heavy framework layers unless the app clearly needs them.

## Builder-domain guidance
- When working with construction management features, model entities from Swagger first: company, user, project/work order, equipment, and site/location records.
- Prefer typed request/response shapes, small API utilities, and explicit loading/error states instead of one large fetch helper.
- Use a consistent pattern for list/detail/edit screens: fetch -> map -> render -> handle errors/loading -> submit mutation.

## Quality bar
- Favor explicit names and typed contracts over clever abstractions.
- Keep code easy to trace from `App.tsx` to feature components to API calls.
- When the Swagger schema is ambiguous, prefer the OpenAPI contract over assumptions from a Java backend implementation.
