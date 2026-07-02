/**
 * Normalizes common Kenyan mobile number formats (07XX XXX XXX, 01XX XXX XXX,
 * +254XXXXXXXXX, 254XXXXXXXXX) into the digits-only 254XXXXXXXXX form wa.me
 * links require. Returns null for anything that doesn't match a valid
 * Kenyan mobile number (Safaricom/Airtel/Telkom all start with 7 or 1).
 */
export function normalizeKenyanPhoneNumber(input: string): string | null {
  const stripped = input.trim().replace(/[^\d+]/g, "");

  let normalized: string;
  if (stripped.startsWith("+254")) {
    normalized = stripped.slice(1);
  } else if (stripped.startsWith("254")) {
    normalized = stripped;
  } else if (stripped.startsWith("0")) {
    normalized = `254${stripped.slice(1)}`;
  } else {
    return null;
  }

  return /^254[17]\d{8}$/.test(normalized) ? normalized : null;
}
