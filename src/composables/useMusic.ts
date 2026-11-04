import { ref } from 'vue'

const isPlaying = ref(false)
const audio = ref<HTMLAudioElement | null>(null)

// what the player chose with the music button, kept on the phone: paused stays paused the next time, enabled stays enabled.
// (pause() and play() alone do not change it: the Ride game uses them to silence the music for a while.)
const KEY = 'brunoplay.music'
/** true unless the player paused the music on purpose */
export function musicWanted(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}
function remember(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // private mode: the choice lasts until the app is closed
  }
}

export function useMusic() {
  const setAudio = (el: HTMLAudioElement) => {
    audio.value = el
  }

  const play = async () => {
    if (!audio.value) return
    try {
      await audio.value.play()
      isPlaying.value = true
    } catch (err) {
      console.warn('Autoplay blocked:', err)
      isPlaying.value = false
    }
  }

  const pause = () => {
    if (!audio.value) return
    audio.value.pause()
    isPlaying.value = false
  }

  /** the music button: plays or pauses, and remembers the choice for the next visit */
  const toggle = () => {
    if (isPlaying.value) {
      remember(false)
      pause()
    } else {
      remember(true)
      void play()
    }
  }

  return {
    isPlaying,
    setAudio,
    play,
    pause,
    toggle,
  }
}
