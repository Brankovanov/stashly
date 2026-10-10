# Embroidery Supplies Manager

Embroidery Supplies Manager is a multi-page app for hobbyists to track their inventory, plan projects, and check which materials they still need to buy. Users manage their own supplies and projects, while admins can manage categories and user roles.

## Project status

The project foundation, database schema and RLS migrations, email/password authentication, supply browsing and CRUD, and project CRUD are implemented:

- Vite multi-page app scaffold complete
- Bootstrap and shared styling configured
- Initial schema created in `supabase/migrations/`
- Row-level security policies added for profiles, user roles, categories, supplies, projects, and project items
- Security helper `public.is_admin()` added for admin-only writes
- Supabase auth client, login/register screens, session-aware navigation, sign-out, and route guards
- Protected supplies browsing with category filtering, search, sorting, and loading/empty/error states
- Supply create/edit forms and confirmed deletion from the inventory list
- Protected project listing with status filtering, create/edit/delete, and private cover/pattern file handling

Live integration checks still need to be completed against the configured Supabase project, including writes, cross-user ownership, and signed-in project file workflows. The next feature milestone is project supply tracking.

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

The supply-photo and project-files migrations are recorded as applied on the linked Supabase project. Read-only checks confirmed both buckets are private and have owner/admin storage policies; the project-files bucket has its expected 10 MB limit and JPEG/PNG/WebP/PDF allowlist. Anonymous project-files listing returned no objects. Signed-in supply and project workflows and cross-user isolation still require manual testing with two accounts.

1. Start the app with `npm run dev` after configuring `.env`.
2. Open `/pages/register.html`, create an account, and follow the email confirmation link if confirmation is enabled in Supabase Auth.
3. Log in at `/pages/login.html`; verify the navbar shows the signed-in email and a sign-out button.
4. Sign out and verify guest navigation returns.
5. While signed out, visit `/pages/supplies.html`; verify it redirects to login and returns to the requested page after sign-in.
6. As a signed-in user, verify categories and only that user's supplies appear. Repeat with a second account to confirm data isolation.
7. Add a supply, edit it, cancel a delete confirmation, then confirm deletion. Verify quantity/color validation and visible errors.
8. Upload JPG/PNG/WebP photos up to 5 MB on create and edit; verify preview and inventory display, replace or remove a photo, and delete the supply.
9. Verify unsupported/oversized files are rejected and a second user cannot access another user's photo object.
10. Create projects in all three statuses and verify status filtering, edits, and delete confirmation behavior.
11. Upload an image cover and an image or PDF pattern; verify previews, signed links, replacement/removal, and visible cleanup warnings. Reject unsupported and oversized files.
12. With two users, verify projects and project files remain isolated; if testing as an admin, verify authorized moderation actions on another user's project.

Verify migration status against the intended Supabase project before relying on categories or file storage. The linked project checked on 2026-10-10 has both storage migrations applied. The `supply-photos` and `project-files` buckets are private; object paths are stored in the database and displayed through expiring signed URLs. Never share or commit `.env` values.

## Next implementation milestone

Implement project supply tracking, including owned/partial/missing quantities and shopping lists. See [the implementation plan](docs/implementation-plan.md).

## Roles

- User: manages their own supplies and projects
- Admin: full access plus category and role management
