export function validateSupplyInput(values) {
  const errors = {};
  const name = values.name.trim();
  const categoryId = values.category_id.trim();
  const quantity = Number(values.quantity);
  const colorHex = values.color_hex.trim();

  if (!name) errors.name = 'Enter a supply name.';
  if (!categoryId) errors.category_id = 'Choose a category.';
  if (values.quantity === '' || !Number.isFinite(quantity) || quantity < 0) {
    errors.quantity = 'Enter a quantity of zero or more.';
  }
  if (colorHex && !/^#[0-9A-Fa-f]{6}$/.test(colorHex)) {
    errors.color_hex = 'Enter a six-digit hex color, for example #4A6B52.';
  }

  return {
    errors,
    value: {
      name,
      category_id: categoryId,
      brand: toNullableText(values.brand),
      color_code: toNullableText(values.color_code),
      color_hex: colorHex || null,
      quantity,
      unit: toNullableText(values.unit),
      notes: toNullableText(values.notes),
    },
  };
}

function toNullableText(value) {
  return value.trim() || null;
}
