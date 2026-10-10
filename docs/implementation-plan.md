# Implementation Plan

This plan follows the project requirements in `copilot-instructions.md` and the staged build sequence in `copilot-guide.md`.

## Progress

Legend: ✅ done · 🟡 in progress / partly done · ⬜ not started

| # | Step | Status |
|---|------|--------|
| 1 | Scaffold the app | ✅ Done |
| 2 | Create the database schema | ✅ Done; migration applied |
| 3 | Add Row-Level Security | ✅ Done; migration applied (access-control behavior still needs manual testing) |
| 4 | Implement authentication | 🟡 In progress |
| 5 | Build supply browsing | 🟡 In progress |
| 6 | Add supply CRUD | ⬜ Not started |
| 7 | Add supply photo storage | ⬜ Not started |
| 8 | Build project CRUD | ⬜ Not started |
| 9 | Implement project supply tracking | ⬜ Not started |
| 10 | Add profile and dashboard | ⬜ Not started |
| 11 | Build the admin panel | ⬜ Not started |
| 12 | Polish, document, and deploy | ⬜ Not started |

## Phase 1 — Foundation and security

### 1. Scaffold the app ✅

- Set up Vite as a vanilla JavaScript, multi-page app.
- Add Bootstrap and Bootstrap Icons, shared styling, a navbar, and `.env.example`.
- Register every HTML page in Vite's build inputs.
- **Verify:** `npm run dev` starts and every page builds.
- **Commit:** `chore: scaffold Vite multi-page project with Bootstrap`

### 2. Create the database schema 🟡

- Add migrations for `profiles`, `user_roles`, `categories`, `supplies`, `projects`, and `project_items`.
- Add constraints, foreign keys, indexes, and a signup trigger that creates a profile and default user role.
- **Verify:** migration applied with `npx supabase db push`.
- **Commit:** `feat(db): add initial schema migration`

### 3. Add Row-Level Security ✅

- Enable RLS on every public table and define owner, parent-project, category, and role policies.
- Add a server-side `is_admin()` helper; ensure users cannot grant themselves admin privileges.
- **Migration:** `supabase/migrations/20261010085523_add_rls_policies.sql`
- **Verify:** migration applied with `npx supabase db push`. Test with two users and an admin, including attempts to access or modify another user's data, before production release.
- **Commit:** `feat(db): enable RLS policies`

### 4. Implement authentication 🟡

- Add the Supabase client, auth service, login and register pages, route guards, and guest/user/admin-aware navbar links.
- Keep Supabase calls in services and protect pages with guards.
- **Progress:** Supabase client and auth service, login/register screens, route guards, and auth-aware navbar are implemented. Manual auth testing still requires local Supabase credentials and a running Supabase project. Authentication and sign-out errors are announced visibly in the navbar.
- **Verify:** build all pages, then register, sign in, sign out, and check protected-page behavior against Supabase. When email confirmation is enabled, verify the confirmation email and subsequent login.
- **Commit:** `feat(auth): register, login, logout and route guards`

## Phase 2 — Core inventory and project workflows

### 5. Build supply browsing 🟡

- Seed default categories and add the supplies service and listing page.
- Include category badges, color swatches, search, category filtering, sorting, and loading, empty, and error states.
- **Progress:** added a default-category migration, RLS-backed supply/category reads, and the responsive protected listing page. Applying the category seed and manually checking with a configured Supabase account remain.
- **Commit:** `feat(supplies): browse supplies with search and filters`

### 6. Add supply CRUD

- Build a shared create/edit form, validate inputs, and support deletion with confirmation.
- Provide success and error feedback.
- **Commit:** `feat(supplies): create, edit and delete supplies`

### 7. Add supply photo storage

- Create the `supply-photos` bucket and storage policies through a migration.
- Validate file type and size, store paths rather than URLs, and clean up replaced or deleted files.
- **Verify:** test upload, display, replacement, and deletion as different users.
- **Commit:** `feat(storage): supply photo upload and display`

### 8. Build project CRUD

- Add the projects service, project list and create/edit pages, status badges, and cover-file upload.
- **Verify:** test each project status and owner isolation.
- **Commit:** `feat(projects): manage projects with cover images`

### 9. Implement project supply tracking

- Build project details and let users add items linked to owned supplies or entered as new needs.
- Compute owned, partial, and missing quantities outside the UI; show completeness progress and a shopping list.
- Implement “Mark as purchased” to create and link an owned supply.
- **Verify:** test missing, fully owned, partial, and purchased flows.
- **Commit:** `feat(projects): track needed vs owned supplies`

## Phase 3 — Account, administration, and delivery

### 10. Add profile and dashboard

- Build the profile page and dashboard counts for supplies, projects, and items to buy, plus recent projects.
- Add avatar storage if in scope.
- **Commit:** `feat: profile page and dashboard`

### 11. Build the admin panel

- Add an admin-guarded page for category management, user and role management, and overall statistics.
- Rely on RLS for enforcement; client-side hiding is only for UX.
- **Verify:** test admin actions and confirm normal users cannot perform them through the API.
- **Commit:** `feat(admin): admin panel for categories and users`

### 12. Polish, document, and deploy

- Check responsive layouts, accessibility, and loading, empty, and error states across all screens.
- Write the README, architecture overview, and database documentation with an ER diagram.
- Deploy to Netlify or Vercel, configure environment variables, and document demo credentials.
- **Verify:** run the production build and smoke-test the deployed app.
- **Commits:** `docs: add README, architecture and database docs`; `chore: deployment config`

## Completion criteria

- At least five responsive screens; the planned app includes nine.
- All database changes and storage policies are in committed migrations.
- RLS protects every public table, with cross-user access tested.
- Services own data access; page scripts handle DOM and events.
- Each screen includes loading, empty, and error states.
- The app builds locally and is deployed with setup instructions and demo accounts.
- Commit each working step; the guide recommends spreading commits across at least three different days.
