DROP POLICY "project_items_modify_by_project_owner"
ON public.project_items;

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
      AND (
        project_items.supply_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.supplies s
          WHERE s.id = project_items.supply_id
            AND s.user_id = p.user_id
        )
      )
  )
);

CREATE UNIQUE INDEX project_items_project_supply_unique_idx
ON public.project_items (project_id, supply_id)
WHERE supply_id IS NOT NULL;
