export function validateProjectItemInput(values) {
  const errors = {};
  const name = values.name.trim();
  const categoryId = values.category_id.trim();
  const quantityText = String(values.quantity_needed).trim();
  const quantityNeeded = Number(quantityText);

  if (!name) errors.name = 'Enter a supply name.';
  if (!categoryId) errors.category_id = 'Choose a category.';
  if (!quantityText || !Number.isFinite(quantityNeeded) || quantityNeeded <= 0) {
    errors.quantity_needed = 'Enter a quantity greater than zero.';
  }

  return {
    errors,
    value: {
      name,
      category_id: categoryId || null,
      supply_id: values.supply_id || null,
      brand: toNullableText(values.brand),
      color_code: toNullableText(values.color_code),
      quantity_needed: quantityNeeded,
      unit: toNullableText(values.unit),
    },
  };
}

export function calculateProjectItemStatus(item) {
  const needed = Number(item.quantity_needed);
  const supply = item.supplies;
  const compatibleUnits =
    supply?.unit &&
    item.unit &&
    supply.unit.trim().toLocaleLowerCase() === item.unit.trim().toLocaleLowerCase();
  const available = compatibleUnits ? Number(supply.quantity) : 0;
  const quantityOwned = Math.min(needed, available);
  const quantityMissing = Math.max(needed - quantityOwned, 0);

  return {
    ...item,
    quantity_owned: quantityOwned,
    quantity_missing: quantityMissing,
    ownership_status:
      quantityMissing === 0 ? 'owned' : quantityOwned > 0 ? 'partial' : 'missing',
    unit_mismatch: Boolean(supply && !compatibleUnits),
  };
}

function toNullableText(value = '') {
  return value.trim() || null;
}
