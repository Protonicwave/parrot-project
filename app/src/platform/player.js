// Owns the audio elements. Playback has to survive a screen lock: the farmer
// starts a track and puts the phone in a pocket.

// Two elements rather than one. Setting a new source on a single element leaves
// a gap while it loads, and a gap is where a locked phone suspends the audio
// session. The next track is loaded into the idle element while the current one
// plays, and they swap at the join.
export function createPlayer(elements, { onEnded }) {
  let active = 0;
  let queued = '';

  for (const element of elements) {
    element.addEventListener('ended', (event) => {
      if (event.target === elements[active]) onEnded();
    });
  }

  function idle() {
    return elements[1 - active];
  }

  // The lock screen controls are wired to the same two actions as the screen,
  // so a phone in a pocket cannot end up in a state the app does not know about.
  function announce(title, playbackState) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({ title });
    navigator.mediaSession.playbackState = playbackState;
  }

  return {
    load(url) {
      const element = elements[active];
      if (element.getAttribute('src') !== url) element.src = url;
      queued = '';
    },

    // Fetches the next track a quarter of an hour before it is wanted, which is
    // what makes the join inaudible and what caches it for the next run.
    preload(url) {
      if (queued === url) return;
      queued = url;
      const element = idle();
      element.src = url;
      element.load();
    },

    async play(title) {
      elements[active].currentTime = 0;
      await elements[active].play();
      announce(title, 'playing');
    },

    // Swaps to the preloaded element at the join. Returns false when nothing was
    // queued, which is the caller's signal that the run cannot continue.
    async advance() {
      if (!queued) return false;
      const next = idle();
      active = 1 - active;
      queued = '';
      next.currentTime = 0;
      await next.play();
      return true;
    },

    stop() {
      for (const element of elements) {
        element.pause();
        element.currentTime = 0;
      }
      queued = '';
      announce('', 'none');
    },

    elapsed() {
      return elements[active].currentTime;
    },

    onRemote(handler) {
      if (!('mediaSession' in navigator)) return;
      for (const action of ['play', 'pause', 'stop']) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch {
          // Not every browser offers every action.
        }
      }
    },
  };
}
