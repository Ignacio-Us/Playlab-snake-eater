import IController from './IController'

export default class VoiceController extends IController {
  constructor() {
    super()
    this.recognition = null
    this.currentDirection = null
    this.isListening = false
    this.retryTimeout = null
  }

  init(scene) {
    this.scene = scene
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta control por voz.')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.lang = 'es-ES'
    this.recognition.continuous = true
    this.recognition.interimResults = true // ✅ resultados parciales habilitados
    this.isListening = true

    const map = { arriba: 'up', abajo: 'down', izquierda: 'left', derecha: 'right' }

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript.trim().toLowerCase()

      // 🔍 Buscar palabra clave directamente
      const match = transcript.match(/arriba|abajo|izquierda|derecha/)
      if (match) {
        const dir = map[match[0]]
        if (dir && dir !== this.currentDirection) {
          this.currentDirection = dir
          window.dispatchEvent(new CustomEvent('voice-direction', { detail: dir }))
        }
      }
    }

    this.recognition.onerror = (e) => {
      console.warn('Error en reconocimiento de voz:', e)
      if (['network', 'no-speech', 'aborted'].includes(e.error)) {
        this.restartRecognitionWithDelay(300)
      }
    }

    this.recognition.onend = () => {
      if (this.isListening) this.restartRecognitionWithDelay(300)
    }

    this.startRecognition()
  }

  startRecognition() {
    try {
      this.recognition.start()
      window.dispatchEvent(new CustomEvent('voice-listening', { detail: true }))
    } catch (e) {
      this.restartRecognitionWithDelay(300)
    }
  }

  restartRecognitionWithDelay(ms = 300) {
    clearTimeout(this.retryTimeout)
    this.retryTimeout = setTimeout(() => {
      if (this.isListening) this.startRecognition()
    }, ms)
  }

  getDirection() {
    return this.currentDirection
  }

  update() {}

  destroy() {
    if (this.recognition) {
      this.isListening = false
      clearTimeout(this.retryTimeout)
      this.recognition.stop()
      this.recognition = null
      window.dispatchEvent(new CustomEvent('voice-listening', { detail: false }))
    }
  }
}
