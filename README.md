# Embroidery Supplies Manager

Embroidery Supplies Manager is a multi-page app for hobbyists to track their inventory, plan projects, and check which materials they still need to buy. Users manage their own supplies and projects, while admins can manage categories and user roles and moderate supplies and projects across accounts.

## Project status

The project foundation, database schema and RLS migrations, email/password authentication, supply browsing and CRUD, project CRUD, project supply tracking, and the personal dashboard/profile experience are implemented:

- Vite multi-page app scaffold complete
- Bootstrap and shared styling configured
- Initial schema created in `supabase/migrations/`
- Row-level security policies added for profiles, user roles, categories, supplies, projects, and project items
- Security helper `public.is_admin()` added for admin-only writes
- Supabase auth client, login/register screens, session-aware navigation, sign-out, and route guards
- Protected supplies browsing with category filtering, search, sorting, and loading/empty/error states
- Supply create/edit forms and confirmed deletion from the inventory list
- Protected project listing with status filtering, create/edit/delete, and private cover/pattern file handling
- Project supply lists with owned/partial/missing states, progress, and shopping lists
- A signed-in dashboard with personal inventory/project counts, shopping needs, and recent projects
- A protected profile page for display-name updates and private profile-photo management
- An administrator-only panel for platform totals, categories, role management, and content moderation

Live checks still needed include profile-row isolation, additional project-file types, admin supply-photo cleanup warnings, storage input-validation UI, and responsive/accessibility checks. On 2026-10-10, two ordinary accounts verified row isolation for supplies/projects and project items, including denied direct mutation and purchase attempts. They also verified private supply-photo, project-cover, and avatar read denial. A cross-owner supply-link attempt was rejected by RLS. Temporary-admin checks verified editing another user's supply and project and a visible cleanup warning when project-file deletion was deliberately blocked. Both test accounts are back to the `user` role, all temporary data/files were removed, and the linked project has no admins.

## Documentation

- [Implementation plan](docs/implementation-plan.md)
- [Build guide](docs/copilot-guide.md)
- [Project instructions](docs/copilot-instructions.md)
- [Architecture overview](docs/architecture.md)
- [Database schema](docs/database.md)

## Planned technology

Vanilla JavaScript ES modules, HTML, CSS, Bootstrap 5, Vite, and Supabase (Postgres, Auth, and Storage).

## Local development

```sh
npm install
cp .env.example .env
npm run dev
```

To build the production bundle, run:

```sh
npm run build
```

The app reads Supabase credentials from `.env`. Configure the project URL and browser-safe anon/publishable key before testing auth.

### Supabase integration smoke tests

The supply-photo, project-files, avatar, and admin-operation migrations are recorded as applied on the linked Supabase project. Read-only checks confirmed these buckets are private and have owner-folder storage policies; the project-files bucket has its expected 10 MB limit and JPEG/PNG/WebP/PDF allowlist, and the avatars bucket allows JPG/PNG/WebP up to 5 MB. Admin RPC catalog checks confirmed security-definer functions are executable by authenticated users but not `anon`, category writes use the admin policy, and direct client writes to `user_roles` are disabled. Ordinary-user browser requests to list users or promote the caller were rejected. On 2026-10-10, two ordinary accounts verified supply/project row isolation, project-item read/update/delete/purchase denial, cross-owner supply-link rejection, and private supply-photo/project-cover/avatar read denial. Temporary-admin browser checks verified category create/edit/delete, user listing, edits to another user's supply and project, cross-account content deletion, refreshed totals, last-admin demotion rejection, and a visible project moderation warning when storage-file deletion was deliberately blocked. Storage deletion helpers now verify that the object was removed and retry the check briefly to account for eventual consistency; an owner upload/delete smoke check passed. The temporary roles and all test data/files were removed; both test accounts are `user`, and the linked project has no administrators. Use the trusted SQL Editor bootstrap procedure in [database docs](docs/database.md) before testing admin workflows. Profile-row isolation, additional private file cases, storage validation UI, and supply-photo cleanup warning UI remain to verify.

On 2026-10-10, authenticated project smoke tests passed in the local browser: create/edit in all three statuses, status filtering, cover PNG preview and replacement, PDF pattern upload and signed access (HTTP 200), pattern removal, cancel/confirm deletion, and cleanup of the project's cover/pattern objects. A second ordinary account could not read or update/delete another user's project or create a signed URL for its cover. Admin editing and deletion of another user's project and supply were verified; deliberately blocking project-file deletion showed a visible warning with the orphaned path. All temporary data and files were subsequently removed.

1. Start the app with `npm run dev` after configuring `.env`.
2. Open `/pages/register.html`, create an account, and follow the email confirmation link if confirmation is enabled in Supabase Auth.
3. Log in at `/pages/login.html`; verify the navbar shows the signed-in email and a sign-out button.
4. Sign out and verify guest navigation returns.
5. While signed out, visit `/pages/supplies.html`; verify it redirects to login and returns to the requested page after sign-in.
6. As a signed-in user, verify categories and only that user's supplies appear. Repeat with a second account to confirm data isolation. Two-account supply/project row and project-item denial checks passed on 2026-10-10; repeat equivalent checks for profile rows.
7. Add a supply, edit it, cancel a delete confirmation, then confirm deletion. Verify quantity/color validation and visible errors.
8. Upload JPG/PNG/WebP photos up to 5 MB on create and edit; verify preview and inventory display, replace or remove a photo, and delete the supply.
9. Verify unsupported/oversized files are rejected and a second user cannot access another user's photo object. Cross-user signed URL denial passed for supply photos, project covers, and avatars on 2026-10-10; invalid/oversized input UI checks remain.
10. Create projects in all three statuses and verify status filtering, edits, and delete confirmation behavior.
11. Upload an image cover and an image or PDF pattern; verify previews, signed links, replacement/removal, and visible cleanup warnings. Reject unsupported and oversized files.
12. With two users, verify projects and project files remain isolated; if testing as an admin, verify authorized moderation actions on another user's project. Project-row and cover-file isolation passed on 2026-10-10; pattern-file isolation remains to test.
13. Open a project's supplies page, add an unlinked need and a compatible owned supply, and verify missing/owned states, progress, and shopping-list output.
14. Lower/raise quantities and edit/remove items; verify partial shortfalls, unit mismatch handling, and progress update immediately.
15. Mark an unlinked need as purchased and verify a new supply is created and linked. Mark a partially owned item as purchased and verify only the shortfall is added. Repeat the purchase request and verify inventory does not increase again.
16. Verify an item with missing or incompatible units cannot be marked purchased until corrected, and verify a user cannot link another user's supply to their project through the API. Cross-user project-item read/update/delete/purchase denial and unauthorized cross-owner supply-link rejection passed on 2026-10-10.
17. Sign in and review the dashboard counts, recent projects, empty-project call to action, and links to your supplies and projects. Verify the items-to-buy count includes missing and partially owned needs but excludes fully owned items.
18. Open My profile, verify the account email and display name, then save a valid display name and confirm the dashboard greeting reflects it.
19. Upload JPG/PNG/WebP avatars up to 5 MB, replace and remove the photo, and verify the UI reports any storage-cleanup failure. Reject unsupported or oversized files and verify another user cannot access the avatar object.
20. Bootstrap the first administrator through the trusted Supabase SQL Editor as described in [database docs](docs/database.md), then verify the Admin link and page are available only to administrators.
21. As an administrator, verify platform totals, category create/edit/delete, user listing, role promotion/demotion, and that attempting to demote the last administrator is rejected. Confirm users cannot call admin RPCs or write roles directly. The linked-project smoke test verified these checks; its temporary test role was restored afterward.
22. As an administrator, edit and delete another user's supply and project; verify confirmation, refreshed totals, and visible storage cleanup failures. Cross-user edits/deletes and refreshed totals were verified on 2026-10-10; a blocked project-file deletion showed a visible moderation warning. Supply-photo cleanup-warning behavior remains to test. Sign in as a normal user and confirm the admin route redirects and server-side writes remain denied.

Verify migration status against the intended Supabase project before relying on database and storage features. The linked project checked on 2026-10-10 has the project-item security, atomic-purchase, anonymous-grant correction, avatar storage, and admin-operation migrations applied. The purchase RPC is executable by authenticated users only. Admin RPC catalog checks confirm authenticated-only execution and no direct client role-write policies; the current project has no administrator account, so bootstrap one through the trusted SQL Editor before using admin functions. The `supply-photos`, `project-files`, and `avatars` buckets are private; object paths are stored in the database and displayed through expiring signed URLs. Never share or commit `.env` values.

## Next implementation milestone

Polish, document, and deploy. See [the implementation plan](docs/implementation-plan.md).

## Roles

- User: manages their own supplies and projects
- Admin: full access plus category and role management and cross-account supply/project moderation
