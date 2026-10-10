# Implementation Plan

This plan follows the project requirements in `copilot-instructions.md` and the staged build sequence in `copilot-guide.md`.

## Progress

Legend: ✅ done · 🟡 in progress / partly done · ⬜ not started

| # | Step | Status |
|---|------|--------|
| 1 | Scaffold the app | ✅ Done |
| 2 | Create the database schema | ✅ Done; migration applied |
| 3 | Add Row-Level Security | 🟡 Targeted two-user checks pass for supplies, projects, and project items; more tables/storage remain |
| 4 | Implement authentication | 🟡 Implemented; live Supabase flow tests pending |
| 5 | Build supply browsing | 🟡 Implemented; seed and live Supabase checks pending |
| 6 | Add supply CRUD | 🟡 Create/delete and cross-user read/update/delete denial verified; own edit and validation/error checks remain |
| 7 | Add supply photo storage | 🟡 Owner upload and cross-user read/delete isolation verified; display/replacement and validation/error checks remain |
| 8 | Build project CRUD | 🟡 CRUD smoke tests and cross-user row read/update/delete denial verified; project-file isolation remains |
| 9 | Implement project supply tracking | 🟡 Core flows and cross-user project-item read/update/delete/purchase denial verified; additional edge cases remain |
| 10 | Add profile and dashboard | ✅ Implemented; cross-user storage isolation remains to verify |
| 11 | Build the admin panel | ✅ Implemented and verified; cross-user deletion tested; editing remains untested |
| 12 | Polish, document, and deploy | ⬜ Not started |

## Phase 1 — Foundation and security

### 1. Scaffold the app ✅

- Set up Vite as a vanilla JavaScript, multi-page app.
- Add Bootstrap and Bootstrap Icons, shared styling, a navbar, and `.env.example`.
- Register every HTML page in Vite's build inputs.
- **Verify:** `npm run dev` starts and every page builds.
- **Commit:** `chore: scaffold Vite multi-page project with Bootstrap`

### 2. Create the database schema ✅

- Add migrations for `profiles`, `user_roles`, `categories`, `supplies`, `projects`, and `project_items`.
- Add constraints, foreign keys, indexes, and a signup trigger that creates a profile and default user role.
- **Verify:** migration applied with `npx supabase db push`.
- **Commit:** `feat(db): add initial schema migration`

### 3. Add Row-Level Security 🟡

- Enable RLS on every public table and define owner, parent-project, category, and role policies.
- Add a server-side `is_admin()` helper; ensure users cannot grant themselves admin privileges.
- **Migration:** `supabase/migrations/20261010085523_add_rls_policies.sql`
- **Verify:** migration applied with `npx supabase db push`. Test with two users and an admin, including attempts to access or modify another user's data, before production release.
- **Commit:** `feat(db): enable RLS policies`

### 4. Implement authentication 🟡

- Add the Supabase client, auth service, login and register pages, route guards, and guest/user/admin-aware navbar links.
- Keep Supabase calls in services and protect pages with guards.
- **Progress:** Supabase client and auth service, login/register screens, route guards, and auth-aware navbar are implemented and merged into `main`. Manual auth testing against the configured Supabase project remains.
- **Verify:** build all pages, then register, sign in, sign out, and check protected-page behavior against Supabase. When email confirmation is enabled, verify the confirmation email and subsequent login.
- **Commit:** `feat(auth): register, login, logout and route guards`

## Phase 2 — Core inventory and project workflows

### 5. Build supply browsing 🟡

- Seed default categories and add the supplies service and listing page.
- Include category badges, color swatches, search, category filtering, sorting, and loading, empty, and error states.
- **Progress:** the default-category migration, RLS-backed supply/category reads, and responsive protected listing page are implemented and merged into `main`. Applying the migration and verifying real inventory/category reads remain.
- **Commit:** `feat(supplies): browse supplies with search and filters`

### 6. Add supply CRUD — next

- **Stage 1 — Data operations and validation** ✅
  - Extend `src/services/suppliesService.js` with create, get-by-id, update, and delete operations.
  - Keep query/data access in the service; rely on RLS for ownership enforcement.
  - Add form validation for required name/category and non-negative numeric quantity. The database already rejects blank names and negative quantities; category is currently nullable, so do not imply the database requires it unless a schema migration is added.
  - **Done when:** service methods surface Supabase errors and invalid values cannot be submitted from the form.
- **Stage 2 — Create supply** ✅
  - Add a supply form page and register it in Vite.
  - Load categories through the service and provide fields for category, name, brand, color code/hex, quantity, unit, and notes.
  - Include loading, error, success/navigation, and submit-disabled-while-saving behavior.
  - **Done when:** a signed-in user can create a supply and see it on the inventory page.
- **Stage 3 — Edit supply** ✅
  - Reuse the create form for editing, load the selected supply by ID, and prefill its values.
  - Handle missing/unauthorized rows without rendering a success state; updates must still be constrained by RLS.
  - **Done when:** editing persists the changes and the listing reflects them.
- **Stage 4 — Delete from inventory** ✅
  - Add per-item edit and delete actions to the listing.
  - Require confirmation before deletion, disable the action while saving, and report errors visibly.
  - Refresh the inventory after a successful deletion.
  - **Done when:** cancel keeps the item; confirming removes it from the database and listing.
- **Stage 5 — Integration checks and documentation** 🟡
  - Run the production build and manually test create, edit, delete, invalid values, and service error states.
  - With two users, verify one user cannot edit or delete the other user's supply.
  - Update README/setup guidance if the new screens change the user flow.
  - **Progress:** a live temporary supply was created and removed. A second authenticated account saw no supplies and could not retrieve, update, or delete the owner's record; direct mutation attempts returned the expected no-access errors and a database check confirmed the row was unchanged. Own-record edit, invalid-input, and error-state checks remain.
- **Overall acceptance checks:** create and edit a supply; verify its list card updates; cancel and confirm deletion; test invalid values; verify cross-user updates/deletes are rejected or affect zero rows.
- **Out of scope:** supply photo upload and file cleanup (Step 7).
- **Branch:** `feature/step-6-supply-crud` from latest `main`.
- **Commit:** `feat(supplies): create, edit and delete supplies`

### 7. Add supply photo storage

- **Stage 1 — Private bucket and policies** ✅
  - Create the private `supply-photos` bucket with a 5 MB size limit and JPEG/PNG/WebP MIME allowlist.
  - Add storage object policies restricting read/write/delete to the authenticated user's `{user_id}/` folder; admins retain their database-authorized moderation access.
  - **Done when:** migration builds and policy paths match the storage service convention.
- **Stage 2 — Storage service and display** ✅
  - Validate image MIME type and size before upload; use unique `{user_id}/{uuid}.{ext}` paths.
  - Create short-lived signed URLs for private images and render them on supply cards.
  - **Done when:** valid images upload and display; unsupported/oversized files fail with a user-visible error.
- **Stage 3 — Create and replace photos** ✅
  - Add optional photo selection and local preview to the shared supply form.
  - On create, upload before inserting the row and remove the newly uploaded file if the database insert fails.
  - On edit, upload the replacement, update the row's path, then clean the old file; compensate by removing the new file if the row update fails.
- **Stage 4 — Delete cleanup** ✅
  - On supply deletion, remove the database row and its photo; report cleanup failures explicitly so orphaned storage objects can be cleaned up.
- **Stage 5 — Integration checks and documentation** 🟡
  - Test upload, display, replacement, delete cleanup, invalid type/size, and cross-user storage isolation.
  - Run the production build and update setup and manual test guidance.
  - **Progress:** migration `20261010101407` is recorded as applied remotely. Read-only policy inspection confirms the four `supply_photos_*` object policies target authenticated users and constrain access to the caller's folder or admins. On 2026-10-10, an authenticated owner uploaded a temporary PNG; a second ordinary account could not create a signed display URL, and its delete request left the object intact. The owner then removed it, with a database check confirming cleanup. The non-owner storage delete call returned no API error despite making no change. Supply-photo rendering/replacement, invalid type/size UI checks, and configured bucket limit/MIME metadata remain pending.
- **Migration:** `supabase/migrations/20261010101407_add_supply_photos_storage.sql`
- **Commit:** `feat(storage): supply photo upload and display`

### 8. Build project CRUD

- **Stage 1 — Project data service** ✅
  - Add RLS-backed list, get-by-ID, create, update, and delete operations in `src/services/projectsService.js`.
  - Include owner identity on create; let project RLS enforce access on every operation.
  - **Done when:** service errors are explicit, missing/inaccessible records are not reported as success, and project queries return associated cover/pattern paths.
- **Stage 2 — Project list** ✅
  - Add `pages/projects.html` and its Vite entry with loading, error, empty, and populated states.
  - Show title, description excerpt, status badge, and optional cover; include navigation to create/edit.
  - Add filtering by planned/in-progress/completed status and an understandable empty state.
  - **Done when:** signed-in users see only their own projects and can navigate into project CRUD.
- **Stage 3 — Create and edit projects** ✅
  - Add a shared project form with title, description, and status (`planned`, `in_progress`, `completed`).
  - Reuse the form for create/edit, prefill existing data, validate title/status, and disable submit while saving.
  - **Done when:** create/edit persists valid values and the project list reflects them.
- **Stage 4 — Private project file storage** ✅
  - Create a private `project-files` bucket with documented size/type limits and policies restricting objects to each owner's `{user_id}/` folder; admins retain authorized moderation access.
  - Store object paths in `cover_path` and `pattern_path`, never public URLs; render private files using signed URLs.
  - Validate cover image and pattern-file types/sizes, generate unique paths, and compensate for failed database writes during upload/replacement.
  - **Done when:** file access is owner-scoped, replacement preserves the old file until the row update succeeds, and cleanup errors are visible.
- **Stage 5 — Delete and file cleanup** ✅
  - Add confirmed project deletion and clean up its cover/pattern files after the database row is deleted.
  - If storage cleanup fails, report the orphaned path explicitly without claiming all cleanup succeeded.
  - **Done when:** cancel preserves the project; confirmed deletion removes it and reports any file-cleanup failure.
- **Stage 6 — Integration tests and documentation** 🟡
  - Run the production build; test every status, create/edit/delete, invalid input, file type/size validation, and cross-user project/file isolation.
  - Update README, architecture, database, and manual test documentation.
  - **Progress:** production build, editor diagnostics, whitespace checks, local project/file validation assertions, and authenticated project CRUD/storage smoke tests pass. The linked Supabase project records migration `20261010104047` as applied; read-only SQL confirms a private 10 MB bucket with the expected MIME allowlist and four authenticated owner/admin policies. Anonymous listing returns an empty result, and the local guest route redirects to login. An authenticated temporary project exercised all three statuses and filtering, create/edit, cover PNG preview and replacement, PDF upload and signed access (HTTP 200), pattern removal, cancel/confirm deletion, and file cleanup. A second ordinary account saw no project and received explicit no-access errors when reading/updating/deleting it; the row remained unchanged. Cross-user project-file access and simulated storage-cleanup failures remain untested.
- **Acceptance checks:** users cannot read or modify another user's project or project files; all three statuses display correctly; uploads and replacements persist the right paths; deletion and failures are explicit.
- **Out of scope:** project-item lists, owned/partial/missing calculations, and shopping lists (Step 9).
- **Branch:** `feature/step-8-project-crud` from latest `main`.
- **Commit:** `feat(projects): manage projects with cover images`

### 9. Implement project supply tracking

- **Stage 1 — Secure item operations and quantity calculations** ✅
  - Add service methods to load a project with its project items and visible owned supplies.
  - Add service-layer item creation/update/deletion and calculate `owned`, `partial`, or `missing` plus shortage quantities.
  - Add a migration that enforces linked supplies belong to the project owner (or the caller is an admin); preserve project-item RLS and foreign-key behavior.
  - Treat differing or unspecified units as incomparable rather than claiming an item is owned; surface the full need as missing until a compatible supply is linked.
  - **Progress:** project-item read/write service methods and service-layer quantity calculations are implemented; migration `20261010142000` tightens project-item linkage policies and prevents duplicate links to the same owned supply within a project. Local calculation/validation assertions, the production build, and linked policy/index inspection pass.
  - **Done when:** service outputs report correct ownership quantities and unauthorized links are rejected server-side.
- **Stage 2 — Project detail and supply-item entry** ✅
  - Add a protected `pages/project-detail.html`, its Vite entry, and a link from each project card.
  - Render project information, progress, owned/partial/missing groups, and loading, empty, and error states.
  - Let users add an item by linking one of their supplies or describing a new need (category, name, brand/color, quantity, unit).
  - **Progress:** protected detail screen, project summary, progress bar, ownership groups, and add-item form are implemented. The page calls the item and category services; source text is rendered with DOM text APIs.
  - **Done when:** an item can be added and shown under the correct ownership state without data access in the page layer.
- **Stage 3 — Item maintenance and shopping list** ✅
  - Allow editing needed quantity/details and removing an item with confirmation.
  - Show missing/short quantities and a focused shopping list, with counts and accessible progress.
  - **Progress:** editable items, confirmed removal, partial/missing shortfall details, and shopping-list filtering are implemented. Local production build, editor diagnostics, and whitespace checks pass.
  - **Done when:** edits/removals refresh progress and only incomplete items appear on the shopping list.
- **Stage 4 — Mark as purchased** ✅
  - Add a transactional, RLS-safe database function to create/link a supply for a missing need or increase a linked partial supply by only its shortfall.
  - Make repeat calls safe: a fully covered need must not inflate inventory again.
  - **Progress:** `mark_project_item_purchased` runs atomically, checks project-owner/admin authorization and compatible units, creates and links missing inventory, and increments partial inventory by only the locked current shortfall.
  - **Verification:** migrations `20261010142000`, `20261010143500`, and `20261010150000` are applied to the linked project. The RPC is security definer and executable by authenticated users only; an anonymous RPC attempt returns HTTP 401. Authenticated browser checks cover missing and partial purchases, exact shortfalls, repeat-purchase safety, unit-mismatch rejection, and refreshed inventory/progress.
  - **Done when:** purchased needs become owned and the shopping list/progress update without split database writes.
- **Stage 5 — Integration checks and documentation** 🟡
  - Test missing, fully owned, partial, unit mismatch, add/edit/delete, purchase, repeated purchase, and cross-user access.
  - Run the production build and update README, architecture/database documentation, and manual test guidance.
  - **Progress:** README, architecture, database, and this implementation plan describe the feature and migration behavior. Authenticated browser checks passed for item add/edit/remove, missing/partial/owned calculations, shopping-list output, purchases, repeated purchases, and unit-mismatch rejection. On 2026-10-10, a second ordinary account's direct item query returned no rows; loading the project, updating/deleting the item, and marking it purchased were denied, with database verification that the item and linked supply remained unchanged. All temporary test rows were removed. Additional project-item edge cases and cross-user supply-link attempts remain to verify.
- **Acceptance checks:** missing needs show the full quantity to buy, partial needs show only the shortfall, fully owned needs show zero to buy, and a purchase updates the linked inventory and project progress atomically.
- **Commit:** `feat(projects): track needed vs owned supplies`

## Phase 3 — Account, administration, and delivery

### 10. Add profile and dashboard

- **Stage 1 — Dashboard data and overview** ✅
  - Load the signed-in user's supply count, project count, incomplete project-need count, and recently updated projects through a service.
  - Replace the static home welcome with a protected, responsive dashboard with loading, empty, and error states plus links into supplies and projects.
  - **Progress:** implemented the authenticated dashboard service and responsive home view. Project needs reuse the shared unit-aware ownership calculation; local browser load shows the empty-inventory state. Production build and editor diagnostics pass.
  - **Commit:** `feat(dashboard): show personal inventory and project overview`
- **Stage 2 — Profile details** ✅
  - Add an RLS-backed profile service for loading and updating the current user's display name.
  - Build a protected profile page with validation, save feedback, and account email.
  - **Progress:** the page is registered as a Vite entry and uses the existing owner-only profile policies; browser checks confirmed account details load and a profile update succeeds. The dashboard greeting now reads the saved profile display name.
  - **Commit:** `feat(profile): view and update account details`
- **Stage 3 — Profile avatar storage** ✅
  - Add a migration for a private avatar bucket and user-folder storage policies.
  - Support validated JPG/PNG/WebP avatar upload, signed display URLs, and safe replacement/removal cleanup; store only the object path in `profiles.avatar_path`.
  - **Progress:** migration `20261010153000_add_private_avatars_storage.sql` and client upload/display/replacement/removal flows are implemented. Files are limited to 5 MB and cleanup failures are shown to the user. The migration is applied to the linked project; catalog checks confirmed a private 5 MB JPG/PNG/WebP bucket and authenticated read/upload/update/delete policies. An authenticated browser upload, signed preview, and removal succeeded; cross-user avatar storage isolation remains unverified.
  - **Commit:** `feat(profile): add private avatar uploads`
- **Stage 4 — Navigation, verification, and documentation** ✅
  - Link the profile from signed-in navigation and ensure dashboard/profile links and signed-out routes behave consistently.
  - Verify profile/dashboard states, responsive build, RLS/storage policy behavior, and document setup/manual checks.
  - **Progress:** signed-in navigation now links to the profile, and README, architecture, database, and manual verification guidance describe Step 10. Dashboard and profile page loads, display-name save, avatar upload/preview/removal, production build, editor diagnostics, and whitespace checks pass. Two-account profile-row and avatar storage isolation remain unverified.
  - **Commit:** `docs(profile): document dashboard and profile workflows`

### 11. Build the admin panel

- **Stage 1 — Secure admin data operations** ✅
  - Add an admin service for aggregate statistics, user listings, and category CRUD.
  - Add a privileged, authenticated-only RPC to list users with account email and safely change roles, including protection against removing the last administrator.
  - **Progress:** admin statistics/user/category services and migrations `20261010160000_secure_admin_operations.sql` and `20261010162000_fix_last_admin_guard.sql` are implemented and applied. Direct role-table writes are removed in favor of authenticated, administrator-checked RPCs; browser verification confirmed the last administrator cannot be demoted. Migration dry run, production build, and editor diagnostics pass.
  - **Commit:** `feat(admin): add secure admin data operations`
- **Stage 2 — Admin overview and category management** ✅
  - Register a protected admin page with loading, empty, and error states.
  - Show account, supply, and project totals; add category create/edit/delete with visible outcomes.
  - **Progress:** admin-guarded page, platform totals, and category create/edit/delete UI are implemented. Under an approved temporary admin role, browser checks confirmed the panel loaded, category create/edit/delete worked, and totals refreshed.
  - **Commit:** `feat(admin): manage categories and view platform totals`
- **Stage 3 — User roles and content moderation** 🟡
  - List users and allow safe role changes with confirmation and explicit failure handling.
  - Provide admin access to all supplies and projects with edit links and confirmed delete/cleanup feedback.
  - **Progress:** user listing/role controls and supply/project confirmed-delete tables are implemented. Under an approved temporary admin role, user listing and deletion of a separate ordinary user's supply and project succeeded; moderation displayed the other account as owner and refreshed totals. Cross-user editing and storage-cleanup failure handling remain unverified.
  - **Commit:** `feat(admin): manage users and moderate content`
- **Stage 4 — Navigation, verification, and documentation** 🟡
  - Ensure admin navigation and guards behave consistently, and document setup/manual checks and migration behavior.
  - Verify admin operations, role boundaries, and normal-user denial via UI and server-side policies/RPC checks.
  - **Progress:** the admin page is registered and guarded; normal-user browser access redirects to the dashboard. Live checks confirmed category create/edit/delete, admin user listing, and confirmed deletion of a separate ordinary user's supply and project. Both temporary records were removed and refreshed totals reached zero. The last-admin demotion attempt was rejected with the expected error and the selector reverted to the persisted role. Role RPCs remain admin-checked and authenticated-only; ordinary-user attempts to list users or promote themselves returned SQLSTATE `42501`. Both test accounts now have the `user` role. README, architecture, and database documentation include the first-admin bootstrap and manual checks. Admin edits to another user's content and storage-cleanup failure behavior remain untested; ordinary-user row isolation for supplies/projects/project items has now been verified.
  - **Commit:** `docs(admin): document panel and access verification`

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
