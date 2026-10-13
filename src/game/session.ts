export class SessionUnavailableError extends Error {}

/** Keep one writer per origin. The waiting tab loads its save only after ownership transfers. */
export function acquireVillage(): Promise<() => void> {
  if (!navigator.locks) {
    return Promise.reject(
      new SessionUnavailableError(
        'Open this game over HTTPS in a current browser to load your village safely.',
      ),
    );
  }
  const label = document.querySelector('#load-label');
  if (label) label.textContent = 'Opening your village…';
  return new Promise((resolve, reject) => {
    const waiting = window.setTimeout(() => {
      if (label)
        label.textContent = 'Your village is open in another tab. Close that tab to continue here.';
      document.querySelector('#loading')?.setAttribute('data-session', 'waiting');
    }, 250);
    void navigator.locks
      .request('crown-clan-village-writer', { mode: 'exclusive' }, async () => {
        clearTimeout(waiting);
        document.querySelector('#loading')?.removeAttribute('data-session');
        if (label) label.textContent = 'Preparing your village…';
        await new Promise<void>((release) => resolve(release));
      })
      .catch((error) => {
        clearTimeout(waiting);
        reject(error);
      });
  });
}
