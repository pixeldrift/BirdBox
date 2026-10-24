// Phone numbers are saved as xxx-xxx-xxxx. Ten digits (or eleven with a leading 1) are normalised whatever way they were typed
// — "(805) 555 1234", "805.555.1234", "+1 805-555-1234". Anything else (an international number, an extension) is kept as typed.
function normalizePhone(input) {
  const raw = String(input == null ? '' : input).trim();
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
  if (digits.length === 10 && !/[a-z]/i.test(raw) && !/^\+(?!1)/.test(raw)) return digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
  return raw;
}

module.exports = { normalizePhone };
