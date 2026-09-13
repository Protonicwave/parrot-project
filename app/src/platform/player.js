// Owns the audio element. Playback has to survive a screen lock: the farmer
// starts a track and puts the phone in a pocket.

export function createPlayer(element, { onEnded }) {
  let source = '';

  element.addEventListener('ended', onEnded);

  // The lock screen controls are wired to the same two actions as the screen,
  // so a phone in a pocket cannot end up in a state the app does not know about.
  function announce(title, playbackState) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({ title });
    navigator.mediaSession.playbackState = playbackState;
  }

  return {
    load(url) {
      if (source === url) return;
      source = url;
      element.src = url;
    },

    async play(title) {
      element.currentTime = 0;
      await element.play();
      announce(title, 'playing');
    },

    stop() {
      element.pause();
      element.currentTime = 0;
      announce('', 'none');
    },

    elapsed() {
      return element.currentTime;
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
