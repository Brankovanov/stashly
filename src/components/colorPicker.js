const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * Keeps the native color picker and the hex text field in step. Picking a color
 * fires an `input` event on the text field so the catalogue lookup reacts as if
 * the hex had been typed. Code that sets the hex programmatically should
 * dispatch a `change` event on it so the picker follows.
 */
export function setupColorPicker(form) {
  const hexInput = form.elements.color_hex;
  const picker = form.querySelector('#color-picker');

  const syncPicker = () => {
    const hex = hexInput.value.trim();
    if (HEX_PATTERN.test(hex)) picker.value = hex.toLowerCase();
  };

  picker.addEventListener('input', () => {
    hexInput.value = picker.value.toUpperCase();
    hexInput.classList.remove('is-invalid');
    hexInput.dispatchEvent(new Event('input', { bubbles: true }));
  });
  hexInput.addEventListener('input', syncPicker);
  hexInput.addEventListener('change', syncPicker);
  syncPicker();
}
