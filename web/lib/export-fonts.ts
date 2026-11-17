/**
 * Load the web fonts inside html2canvas's copy of the page before it measures.
 *
 * html2canvas lays a copy out, reads each word's position and then draws. On a
 * slower browser the copy's own font files have not arrived at layout time, so
 * positions come from the fallback face (narrower) and the words are drawn in
 * the real face (wider): words collide ("Combinebondswhosecoupon", "1 0 years"
 * in the sister product's reports, 17 Nov 2026). html2canvas waits for the
 * onclone callback, so this runs there.
 */
export async function loadFontsInClone(clonedDoc: Document): Promise<void> {
  try {
    const fonts = clonedDoc.fonts;
    if (!fonts) return;
    await Promise.all(
      Array.from(document.fonts)
        .filter((f) => f.status === "loaded")
        .map((f) => fonts.load(`${f.style} ${f.weight} 16px "${f.family}"`).catch(() => null)),
    );
    await fonts.ready;
  } catch {
    // No Font Loading API: keep the old behaviour.
  }
}
