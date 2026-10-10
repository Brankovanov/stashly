REVOKE ALL
ON FUNCTION public.mark_project_item_purchased(uuid)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.mark_project_item_purchased(uuid)
TO authenticated;
