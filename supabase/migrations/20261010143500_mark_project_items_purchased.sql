CREATE OR REPLACE FUNCTION public.mark_project_item_purchased(p_project_item_id uuid)
RETURNS public.project_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item public.project_items%ROWTYPE;
  v_project_owner uuid;
  v_supply_quantity numeric;
  v_supply_unit text;
  v_shortfall numeric;
  v_supply_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to mark a project supply as purchased.';
  END IF;

  SELECT p.user_id
  INTO v_project_owner
  FROM public.project_items pi
  JOIN public.projects p ON p.id = pi.project_id
  WHERE pi.id = p_project_item_id
    AND (p.user_id = auth.uid() OR public.is_admin())
  FOR UPDATE OF pi, p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project supply not found or you do not have permission to update it.';
  END IF;

  SELECT *
  INTO v_item
  FROM public.project_items
  WHERE id = p_project_item_id;

  IF v_item.unit IS NULL OR btrim(v_item.unit) = '' THEN
    RAISE EXCEPTION 'Set a unit for this project supply before marking it as purchased.';
  END IF;

  IF v_item.supply_id IS NULL THEN
    IF v_item.category_id IS NULL THEN
      RAISE EXCEPTION 'Choose a category before adding this supply to your inventory.';
    END IF;

    INSERT INTO public.supplies (
      user_id,
      category_id,
      name,
      brand,
      color_code,
      quantity,
      unit
    )
    VALUES (
      v_project_owner,
      v_item.category_id,
      v_item.name,
      v_item.brand,
      v_item.color_code,
      v_item.quantity_needed,
      v_item.unit
    )
    RETURNING id INTO v_supply_id;

    UPDATE public.project_items
    SET supply_id = v_supply_id
    WHERE id = v_item.id
    RETURNING * INTO v_item;
  ELSE
    SELECT s.quantity, s.unit
    INTO v_supply_quantity, v_supply_unit
    FROM public.supplies s
    WHERE s.id = v_item.supply_id
      AND s.user_id = v_project_owner
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'The linked inventory supply is unavailable for this project owner.';
    END IF;

    IF v_supply_unit IS NULL
      OR btrim(v_supply_unit) = ''
      OR lower(btrim(v_supply_unit)) <> lower(btrim(v_item.unit))
    THEN
      RAISE EXCEPTION 'The project supply unit does not match the linked inventory unit.';
    END IF;

    v_shortfall := greatest(v_item.quantity_needed - v_supply_quantity, 0);
    IF v_shortfall > 0 THEN
      UPDATE public.supplies
      SET quantity = quantity + v_shortfall
      WHERE id = v_item.supply_id;
    END IF;
  END IF;

  RETURN v_item;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_project_item_purchased(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_project_item_purchased(uuid) TO authenticated;
