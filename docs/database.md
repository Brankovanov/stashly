# Database schema

The application stores user data, inventory records, project information, and admin metadata in PostgreSQL through Supabase.

## Core tables

- `profiles`: one row per authenticated user
- `user_roles`: stores the default `user` or `admin` role
- `categories`: admin-managed item categories
- `supplies`: each user's owned inventory items
- `projects`: project records keyed to a user
- `project_items`: the materials listed for each project

## Important rules

- All tables in `public` use Row-Level Security.
- `supplies` and `projects` are owner-scoped by `user_id`.
- `project_items` can only be read or modified when the parent project belongs to the current user.
- `categories` are readable by authenticated users and writable only by admins.
- `user_roles` is admin-controlled; normal users can access only their own row.

## Supply photo storage

The private `supply-photos` bucket stores JPG, PNG, and WebP images up to 5 MB. Object names follow `{user_id}/{uuid}.{ext}` and the `supplies.photo_path` column stores the object path, not a URL. Authenticated users can access objects in their own folder; admins can access objects for authorized moderation. The client creates expiring signed URLs when rendering private photos. Bucket configuration and object policies are managed by `supabase/migrations/20261010101407_add_supply_photos_storage.sql`.

The private `project-files` bucket stores project cover images (JPG/PNG/WebP, up to 5 MB) and pattern images or PDFs (JPG/PNG/WebP/PDF, up to 10 MB). Project object paths follow `{user_id}/{project_id}/{kind}/{uuid}.{ext}`; `projects.cover_path` and `projects.pattern_path` store paths, never URLs. Authenticated users can access files in their own user folder, and admins can access files for authorized moderation. The client creates expiring signed URLs for display. Bucket configuration and object policies are managed by `supabase/migrations/20261010104047_add_project_files_storage.sql`.

## Entity relationships

```mermaid
erDiagram
  profiles ||--o{ supplies : owns
  profiles ||--o{ projects : owns
  profiles ||--|| user_roles : has
  categories ||--o{ supplies : categorizes
  categories ||--o{ project_items : categorizes
  projects ||--o{ project_items : contains
  supplies ||--o{ project_items : may_be_used_by

  profiles {
    uuid id PK
    text display_name
    text avatar_path
    timestamptz created_at
    timestamptz updated_at
  }

  user_roles {
    uuid user_id PK
    text role
    timestamptz created_at
  }

  categories {
    uuid id PK
    text name
    text icon
    timestamptz created_at
  }

  supplies {
    uuid id PK
    uuid user_id FK
    uuid category_id FK
    text name
    text brand
    text color_code
    text color_hex
    numeric quantity
    text unit
    text notes
    text photo_path
    timestamptz created_at
    timestamptz updated_at
  }

  projects {
    uuid id PK
    uuid user_id FK
    text title
    text description
    text status
    text cover_path
    text pattern_path
    timestamptz created_at
    timestamptz updated_at
  }

  project_items {
    uuid id PK
    uuid project_id FK
    uuid supply_id FK
    uuid category_id FK
    text name
    text brand
    text color_code
    numeric quantity_needed
    text unit
    timestamptz created_at
    timestamptz updated_at
  }
```

## Security helper

The database includes a `public.is_admin()` helper that checks whether the current user has the `admin` role. This helper is used inside Row-Level Security policies to keep administrative actions server-side and predictable.
