import { ref } from 'vue'

const isPlaying = ref(false)
const audio = ref<HTMLAudioElement | null>(null)

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

  const toggle = () => {
    if (isPlaying.value) pause()
    else play()
  }

  return {
    isPlaying,
    setAudio,
    play,
    pause,
    toggle,
  }
}
