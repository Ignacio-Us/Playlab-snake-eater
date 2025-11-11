import * as speechCommands from '@tensorflow-models/speech-commands'
import * as tf from '@tensorflow/tfjs'
import IController from './IController'

export default class VoiceControllerTM extends IController {
  constructor() {
    super()
    this.recognizer = null
    this.currentDirection = null
    this.isListening = false

    // Buffer de comandos recientes
    this.buffer = []
    this.bufferSize = 3 // Tamaño de ventana de votación
  }

  async init(scene) {
    this.scene = scene
    try {
      await tf.setBackend('cpu')
      await tf.ready()

      // Carga del modelo exportado desde Teachable Machine
      this.recognizer = speechCommands.create(
        'BROWSER_FFT',
        null,
        `${window.location.origin}/models/voice-snakeater/model.json`,
        `${window.location.origin}/models/voice-snakeater/metadata.json`
      )

      await this.recognizer.ensureModelLoaded()

      // Activar micrófono
      this.isListening = true
      window.dispatchEvent(new CustomEvent('voice-listening', { detail: true }))

      this.listen()
    } catch (err) {
      console.error('Error al iniciar reconocimiento de voz:', err)
    }
  }

  listen() {
    this.recognizer.listen(
      (result) => {
        const labels = this.recognizer.wordLabels()
        const scores = result.scores
        const maxIndex = scores.indexOf(Math.max(...scores))
        const command = labels[maxIndex].toLowerCase()

        console.log('Ejecutando listen')
        console.log('Comando detectado:', command)

        // Añadir comando al buffer (rotativo)
        this.buffer.push(command)
        if (this.buffer.length > this.bufferSize) this.buffer.shift()

        // Determinar mayoría (modo votación simple)
        const majority = this.buffer
          .sort(
            (a, b) =>
              this.buffer.filter((v) => v === a).length -
              this.buffer.filter((v) => v === b).length
          )
          .pop()

        if (['arriba', 'abajo', 'izquierda', 'derecha'].includes(majority)) {
          const map = {
            arriba: 'up',
            abajo: 'down',
            izquierda: 'left',
            derecha: 'right'
          }

          // Evitar repeticiones innecesarias
          if (this.currentDirection !== map[majority]) {
            this.currentDirection = map[majority]

            // Emitir evento global
            window.dispatchEvent(
              new CustomEvent('voice-direction', {
                detail: this.currentDirection
              })
            )

            console.log(`Dirección por voz detectada: ${majority} (${this.currentDirection})`)
          }
        }
      },
      {
        includeSpectrogram: false,
        probabilityThreshold: 0.65, // Más sensible, responde antes
        overlapFactor: 0.75 // Mayor frecuencia de análisis → menor latencia
      }
    )
  }

  getDirection() {
    return this.currentDirection
  }

  update() {}

  destroy() {
    if (this.recognizer && this.isListening) {
      this.recognizer.stopListening()
      this.isListening = false
      window.dispatchEvent(new CustomEvent('voice-listening', { detail: false }))
    }
  }
}
