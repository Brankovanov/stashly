DROP POLICY "user_roles_insert_admin_only" ON public.user_roles;
DROP POLICY "user_roles_update_admin_only" ON public.user_roles;
DROP POLICY "user_roles_delete_admin_only" ON public.user_roles;

CREATE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::text,
    p.display_name,
    au.created_at,
    COALESCE(ur.role, 'user')::text
  FROM auth.users AS au
  LEFT JOIN public.profiles AS p ON p.id = au.id
  LEFT JOIN public.user_roles AS ur ON ur.user_id = au.id
  ORDER BY au.created_at DESC;
END;
$$;

CREATE FUNCTION public.admin_set_user_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_role text;
  administrator_count bigint;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required'
      USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL OR p_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'A valid user and role are required'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(7411, 11);
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required'
      USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users AS au WHERE au.id = p_user_id) THEN
    RAISE EXCEPTION 'User not found'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT ur.role
  INTO current_role
  FROM public.user_roles AS ur
  WHERE ur.user_id = p_user_id
  FOR UPDATE;

  IF current_role = 'admin' AND p_role <> 'admin' THEN
    SELECT count(*)
    INTO administrator_count
    FROM public.user_roles AS ur
    WHERE ur.role = 'admin';

    IF administrator_count <= 1 THEN
      RAISE EXCEPTION 'The last administrator cannot be demoted'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  INSERT INTO public.user_roles AS existing_role (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id)
  DO UPDATE SET role = EXCLUDED.role;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;
