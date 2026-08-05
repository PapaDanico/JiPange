/**
 * Handing a rendered card to the phone's own share sheet.
 *
 * WHY THIS EXISTS
 * ---------------
 * ExportCardButton could already build the image; it could only ever DOWNLOAD
 * it. Its own header says why the image matters — "a Kenyan reader who has just
 * worked out their take-home pay wants to send it to somebody on WhatsApp" —
 * and then the only route to WhatsApp was: tap Save, leave the site, open
 * WhatsApp, pick a chat, find the attach button, hunt through Downloads for a
 * file named `salary-hub.png`. Six steps and a file manager, on a phone. The
 * feature the button was built for was the one thing it could not do.
 *
 * `navigator.share({ files })` collapses that to one tap into the app the
 * reader chooses. Nothing is uploaded: the file is passed to the operating
 * system in memory, which is the same privacy posture as the download.
 *
 * WHY THE CAPABILITY TEST IS ITS OWN FUNCTION
 * -------------------------------------------
 * `navigator.share` existing does NOT mean it accepts files — Web Share Level 1
 * shipped text-and-URL-only and is still what several desktop browsers
 * implement. Sharing a file on those throws at the call, after the reader has
 * pressed a button that promised to work. `canShareFile` asks the only question
 * that actually settles it, `navigator.canShare({ files: [file] })`, with a
 * real File rather than a guess, so the button can be absent instead of broken.
 */

/** True when this browser can put THIS file into the system share sheet. */
export function canShareFile(file: File): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (typeof nav.share !== 'function' || typeof nav.canShare !== 'function') return false;
  try {
    return nav.canShare({ files: [file] });
  } catch {
    // Some implementations throw rather than returning false for an unsupported
    // payload. A thrown capability check is a "no", not a crash.
    return false;
  }
}

export type ShareOutcome = 'shared' | 'cancelled' | 'unsupported' | 'failed';

/**
 * Share a file, reporting what actually happened.
 *
 * The three-way result is the point. A share sheet that the reader dismisses
 * rejects with `AbortError`, and treating that as a failure would put "Could
 * not share" on screen every time somebody changed their mind — a false alarm
 * that trains people to distrust real errors. `cancelled` is a normal ending
 * and the caller is expected to say nothing at all.
 */
export async function shareFile(file: File, data: Omit<ShareData, 'files'> = {}): Promise<ShareOutcome> {
  if (!canShareFile(file)) return 'unsupported';
  try {
    await (navigator as Navigator).share({ ...data, files: [file] });
    return 'shared';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    // Chrome on some Android builds reports a dismissed sheet this way instead
    // of as an AbortError. Same meaning, same silence.
    if (err instanceof Error && /abort|cancel/i.test(err.message)) return 'cancelled';
    return 'failed';
  }
}

/** A canvas as a PNG File, ready for the share sheet. */
export function canvasToPngFile(canvas: HTMLCanvasElement, filename: string): Promise<File | null> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== 'function') {
      resolve(null);
      return;
    }
    canvas.toBlob((blob) => {
      resolve(blob ? new File([blob], `${filename}.png`, { type: 'image/png' }) : null);
    }, 'image/png');
  });
}
