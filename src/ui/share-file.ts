export type Delivery = 'shared' | 'downloaded' | 'cancelled';

/** Saves the file through the browser's download. */
export function downloadFile(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Hands a JSON file (a replay, a village backup) to the player. On a touch screen that can
 * share files, the system share sheet opens: send it to a friend, keep it in cloud storage or
 * AirDrop it, where a download would only land in a Files folder. Everywhere else, and where
 * the browser will not share this type (Chrome on Android shares no JSON), it downloads as
 * before. Call it from the click itself: sharing needs the tap's user activation.
 */
export async function deliverFile(text: string, name: string, title: string): Promise<Delivery> {
  const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  if (touch && typeof navigator.share === 'function' && typeof File === 'function') {
    const file = new File([text], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title });
        return 'shared';
      } catch (error) {
        // The player closed the sheet: nothing was exported, and no download follows.
        if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
        // Any other refusal (a lost activation, a policy) falls back to the download.
      }
    }
  }
  downloadFile(text, name);
  return 'downloaded';
}
