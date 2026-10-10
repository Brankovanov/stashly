# Architecture overview

## High-level structure

The app uses a static multi-page frontend built with Vite and vanilla JavaScript. Pages handle DOM rendering and user interactions, while Supabase service modules contain all data access logic.

## Layers

### Frontend

- `index.html` and the pages under `pages/` are the user-facing screens.
- `src/pages/` contains page entry scripts with events, validation, and rendering.
- `src/components/` provides reusable UI pieces such as navigation, confirm modals, and toast messages.
- `src/utils/` keeps guards, formatting helpers, and shared validation logic.

### Data access

- `src/lib/supabaseClient.js` is the single place where `createClient()` is created.
- `src/services/` contains all Supabase calls, such as auth, supplies, projects, admin, and storage access.
- Services return data or throw user-friendly errors rather than touching the DOM.

### Database and auth

- Supabase Postgres stores app data.
- Auth uses Supabase Auth for sign up, sign in, and session tracking.
- Row-level security ensures each user can only reach their own data unless they are an admin.
- `src/lib/supabaseClient.js` creates the single Supabase client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `src/services/authService.js` wraps auth operations and role lookup; `src/utils/guards.js` exposes authenticated-user and admin guards.
- `src/services/suppliesService.js` loads the current RLS-visible inventory and categories for the supplies listing page.
- `src/services/projectsService.js` provides RLS-backed project CRUD and resolves private cover/pattern paths to short-lived signed URLs.
- `src/services/projectItemsService.js` loads project needs and owner inventory, calculates owned/partial/missing quantities, and calls the transactional purchase operation.
- `src/services/dashboardService.js` loads the signed-in user's inventory/project counts, incomplete project needs, and recent projects; `src/services/profileService.js` reads and updates the current user's profile under RLS.
- `src/services/adminService.js` reads administrator totals/users and manages categories through RLS-protected operations and narrowly granted role-management RPCs.
- `src/services/storageService.js` validates supply images, project files, and profile avatars; it uploads to private user-scoped buckets and creates short-lived signed URLs for display.

## Request flow

1. The user opens a page.
2. The page script calls a service function.
3. The service reads or writes data through the Supabase client.
4. RLS policies enforce ownership and admin rules in the database.
5. The page renders the result and shows loading, empty, or error states.

## Security model

- Client-side guards and UI hiding are only UX conveniences.
- Database RLS remains the source of truth for access control.
- Storage object policies restrict supply photos and project files to the owning user's folder, with admin access following the server-side admin helper.
- Profile avatars use a private bucket and user-scoped object paths; uploads replace the profile's stored path before removing the old object.
- Project-item policies require linked inventory to belong to the project owner; `mark_project_item_purchased` performs the inventory update and item link atomically after checking authorization and unit compatibility.
- Profile updates are restricted to the signed-in user's `profiles` row by the existing owner-only policy.
- Admin actions are restricted server-side via `public.is_admin()`.
- The admin page is guarded in the frontend for navigation, while database RLS and the authenticated-only role RPCs enforce administrator access.
