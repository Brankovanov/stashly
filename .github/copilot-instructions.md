# Copilot Instructions — Embroidery Supplies Manager

## 1. Project Context

**Embroidery Supplies Manager** is a multi-page web app for embroidery hobbyists. Users keep an inventory of the supplies they own (floss, fabric, needles, hoops, beads, etc.) and create **projects** (e.g. a cross-stitch pattern) that list the supplies they need. For each project the app shows which needed supplies are **owned**, **partially owned**, or **missing** (a shopping list).

This is a **SoftUni "Software Technologies with AI" capstone project**. It is assessed on: GitHub commit history, architecture (Vite + multi-page), at least 5 responsive screens, at least 4 DB tables, users/roles/admin panel, file storage, live deployment, server-side security (RLS), and documentation.

### Roles
- **User** (default): full CRUD on their **own** supplies and projects; upload photos; edit own profile.
- **Admin**: everything a user can do, plus access to the **admin panel** — manage supply categories, view/manage all users, change roles, and moderate any supply/project data.

### Core features
1. Register / login / logout (Supabase Auth).
2. Supplies: add, edit, delete, browse with search, category filter and sort; optional photo.
3. Projects: create/edit/delete; status (`planned`, `in_progress`, `completed`); cover photo or pattern file.
4. Project supply list: add needed items (link to an owned supply or describe a new one); show owned vs. missing quantities.
5. Admin panel: categories CRUD, users list, role management.

## 2. Tech Stack (strict)

| Layer | Use | Do NOT use |
|---|---|---|
| Language | Plain **JavaScript (ES modules)** | TypeScript |
| UI | **HTML + CSS + Bootstrap 5** + Bootstrap Icons (installed via npm) | React, Vue, Angular, Svelte, jQuery |
| Build | **Node.js, npm, Vite** (multi-page mode) | Webpack, CRA, Next.js |
| Backend | **Supabase** (Postgres DB, Auth, Storage) via `@supabase/supabase-js` | Custom Express server, Firebase |
| Hosting | Netlify or Vercel | — |

Keep it simple. Prefer small, readable code over clever abstractions. Do not add new dependencies without a clear need.

## 3. Architecture

**Client–server:** static multi-page frontend → Supabase REST API (through `supabase-js`). No custom backend; use Edge Functions only if something truly must run server-side.

### Folder structure

```
/
├─ .github/copilot-instructions.md   # this file
├─ docs/                             # project documentation (see section 9)
├─ supabase/
│  ├─ migrations/                    # ALL schema changes live here (committed)
│  └─ seed.sql                       # optional demo data
├─ index.html                        # home / dashboard
├─ pages/                            # one HTML file per screen
│  ├─ login.html  register.html
│  ├─ supplies.html  supply-form.html
│  ├─ projects.html  project-form.html  project-detail.html
│  ├─ profile.html
│  └─ admin.html
├─ src/
│  ├─ lib/supabaseClient.js          # the ONLY place createClient() is called
│  ├─ services/                      # all Supabase calls (no DOM code here)
│  │  ├─ authService.js  suppliesService.js  projectsService.js
│  │  ├─ storageService.js  adminService.js
│  ├─ pages/                         # one JS entry per HTML page (DOM + events)
│  ├─ components/                    # reusable UI builders: navbar, toast, supplyCard, confirmModal...
│  ├─ utils/                         # guards.js, dom.js, format.js, validators.js
│  └─ styles/main.css               # custom CSS on top of Bootstrap
├─ vite.config.js                    # lists every HTML file under build.rollupOptions.input
├─ .env.example                      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
└─ package.json
```

### Layering rules
- **Pages** (`src/pages/*.js`) handle DOM, events and rendering. They call **services**, never `supabase` directly.
- **Services** (`src/services/*.js`) contain all data access. They return data or throw an `Error` with a user-friendly message. No DOM access.
- **Components** return DOM elements or HTML strings and receive data via parameters.
- **Utils** are pure helpers.
- Each HTML page loads exactly one entry script: `<script type="module" src="/src/pages/<name>.js"></script>`.
- Navigation uses real links between pages (`<a href="/pages/supplies.html">`) — **no single-page app, no popups-as-pages**. Modals are fine only for small confirmations (e.g. delete).
- When adding a page: create the HTML file, its `src/pages/` script, and **register it in `vite.config.js`**.

## 4. Database Schema

Use `snake_case`, `uuid` primary keys (`gen_random_uuid()`), `created_at timestamptz default now()`, and `updated_at` where rows are editable.

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | `id` (PK, FK → `auth.users`), `display_name`, `avatar_path`, `created_at` | Created automatically by a trigger on signup |
| `user_roles` | `user_id` (FK → `auth.users`), `role` (`user` \| `admin`) | Default `user` assigned by the signup trigger |
| `categories` | `id`, `name` (unique), `icon` | Admin-managed (Floss, Fabric, Needles, Hoops, Beads, Stabilizer, Tools, Other) |
| `supplies` | `id`, `user_id`, `category_id`, `name`, `brand`, `color_code`, `color_hex`, `quantity` (numeric ≥ 0), `unit`, `notes`, `photo_path`, timestamps | A user's owned inventory |
| `projects` | `id`, `user_id`, `title`, `description`, `status`, `cover_path`, `pattern_path`, timestamps | `status` ∈ `planned`, `in_progress`, `completed` |
| `project_items` | `id`, `project_id`, `supply_id` (nullable FK → `supplies`, `on delete set null`), `category_id`, `name`, `brand`, `color_code`, `quantity_needed`, `unit` | A supply a project needs |

**Relationships:** `profiles` 1—N `supplies`; `profiles` 1—N `projects`; `projects` 1—N `project_items`; `supplies` 1—N `project_items` (optional); `categories` 1—N `supplies` / `project_items`.

**Owned vs. missing logic** (compute in the service layer or a SQL view, not by hand in the UI):
- `supply_id` is null → **missing** (needs to be bought)
- `supply_id` set and `supplies.quantity >= quantity_needed` → **owned**
- `supply_id` set and `supplies.quantity < quantity_needed` → **partial** (show the shortfall)

Add indexes on every foreign key and on `supplies(user_id, category_id)`.

## 5. Supabase Rules (very important)

### Migrations
- **Every** schema change (tables, columns, indexes, RLS policies, functions, triggers, storage policies) goes through a migration: `supabase migration new <name>` → write SQL → `supabase db push`.
- Never change the schema only in the Supabase dashboard. If it happens, run `supabase db pull` to sync it back.
- Migration files in `supabase/migrations/` must be committed.

### Row-Level Security
- **Enable RLS on every table** in `public`. A table without policies is a bug.
- Owner policies: `using (auth.uid() = user_id)` / `with check (auth.uid() = user_id)` for `supplies` and `projects`.
- `project_items`: allow access only if the parent project belongs to `auth.uid()` (use `exists (select 1 from projects ...)`).
- `categories`: readable by all authenticated users; writable only by admins.
- `user_roles`: users can read their own row; only admins can change roles. Users must **never** be able to promote themselves.
- Create a `security definer` helper `public.is_admin()` that checks `user_roles`, and use it in admin policies.
- **Security is enforced on the server (RLS).** Hiding a button or redirecting in JS is only UX, never protection.

### Auth
- Use `supabase.auth.signUp / signInWithPassword / signOut / getSession / onAuthStateChange`.
- Route guards live in `src/utils/guards.js` (`requireAuth()`, `requireAdmin()`); call them at the start of protected page scripts.
- Fetch the current user's role from `user_roles` (RLS-protected) to show/hide admin UI.

### Storage
- Buckets: `supply-photos`, `project-files` (and optionally `avatars`).
- Object path convention: `{user_id}/{uuid}.{ext}` — storage policies allow a user to write/delete only inside their own `{user_id}/` folder.
- Validate on the client: allowed types (jpg/png/webp, plus PDF for patterns) and max size (e.g. 5 MB).
- Store the **path** in the DB, not a URL; build URLs (public or signed) at render time via `storageService`.
- Delete the old file when a photo is replaced or the row is deleted.

### Secrets
- Only the **anon key** goes in the frontend via `import.meta.env.VITE_SUPABASE_*`.
- **Never** use or commit the `service_role` key. Never commit `.env` (commit `.env.example`).

## 6. UI / UX Guidelines

- **Responsive, mobile-first** with the Bootstrap grid (`container`, `row`, `col-*`); test at phone and desktop widths.
- Shared navbar component on every page; highlight the active link; show admin link only for admins.
- Use **Bootstrap Icons** and visual cues: color swatches (`color_hex`) for floss, status badges for projects, progress bar for "supplies owned", toasts for success/error, hover/transition effects.
- Every screen needs **loading**, **empty** (friendly message + call-to-action) and **error** states.
- Forms: Bootstrap validation classes, labels, `required`, disabled submit button while saving.
- Confirm destructive actions (delete) with a modal.
- Accessibility basics: semantic HTML, `alt` text on images, labels on inputs, sufficient contrast.
- Theme: a calm, craft-inspired palette defined with CSS variables in `main.css`.

## 7. Code Conventions

- ES modules only (`import`/`export`), `const`/`let`, `async/await` with `try/catch`.
- Naming: files `camelCase.js` for modules (`suppliesService.js`), HTML files `kebab-case.html`, DB columns `snake_case`, JS variables `camelCase`.
- Small functions, one responsibility each; keep files focused (aim for < 200 lines). Split when they grow.
- Escape user-provided text before inserting into HTML (use `textContent` or an `escapeHtml` util) — prevent XSS.
- Comments explain *why*, not *what*. Add JSDoc to service functions.
- No `console.log` left in committed code; surface errors to the user through the toast component.
- No hard-coded Supabase URLs/keys; no duplicated query logic — reuse services.

## 8. Workflow Rules for the AI Agent

- Work in **small, focused steps** — one feature or fix per request. Do not generate the whole app at once.
- Before changing code, read the relevant existing files and follow the established patterns.
- After a change: make sure `npm run dev` still works and tell me how to test it manually.
- For schema changes: create a migration file, explain the SQL, and **do not** touch the schema any other way.
- Suggest a short **conventional commit message** after each completed step (e.g. `feat(supplies): add supply form with photo upload`).
- If a request conflicts with this file (e.g. "use React"), say so and ask before proceeding.
- Prefer the simplest solution that satisfies the requirement; ask when requirements are ambiguous.

## 9. Documentation (kept up to date)

Keep these in the repo and update them as features land:
- `README.md` — project description (what it does, who can do what), live URL, demo credentials, setup guide, key folders/files.
- `docs/architecture.md` — frontend, backend, technologies, request flow.
- `docs/database.md` — schema description plus an ER diagram (Mermaid `erDiagram`).

## 10. Local Development & Deployment

```bash
npm install
cp .env.example .env        # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev                 # local dev server
npm run build && npm run preview   # verify the production build
supabase link --project-ref <ref>
supabase db pull            # sync remote schema -> supabase/migrations
supabase db push            # apply local migrations
```

- Deploy on Netlify/Vercel: build command `npm run build`, output `dist`, set the two `VITE_SUPABASE_*` env vars in the host settings.
- Provide demo accounts (a normal user and an admin) in the README for testing.
