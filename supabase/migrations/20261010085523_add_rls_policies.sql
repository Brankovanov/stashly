-- Enable Row-Level Security on every public table and define ownership and role policies.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "user_roles_select_own_or_admin"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "user_roles_insert_admin_only"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "user_roles_update_admin_only"
ON public.user_roles
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "user_roles_delete_admin_only"
ON public.user_roles
FOR DELETE
USING (public.is_admin());

CREATE POLICY "categories_select_authenticated"
ON public.categories
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "categories_manage_admin_only"
ON public.categories
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "supplies_select_own_or_admin"
ON public.supplies
FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "supplies_modify_own_or_admin"
ON public.supplies
FOR ALL
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "projects_select_own_or_admin"
ON public.projects
FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "projects_modify_own_or_admin"
ON public.projects
FOR ALL
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "project_items_select_by_project_owner"
ON public.project_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_items.project_id
      AND (p.user_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "project_items_modify_by_project_owner"
ON public.project_items
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_items.project_id
      AND (p.user_id = auth.uid() OR public.is_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_items.project_id
      AND (p.user_id = auth.uid() OR public.is_admin())
  )
);
