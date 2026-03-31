// Web Audio API sound effects — no audio files needed

let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function playTone(ctx, freq, gain, duration, type = 'sine', startDelay = 0) {
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.connect(gainNode)
  gainNode.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay)
  gainNode.gain.setValueAtTime(0, ctx.currentTime + startDelay)
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + startDelay + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration)
  osc.start(ctx.currentTime + startDelay)
  osc.stop(ctx.currentTime + startDelay + duration + 0.05)
}

export function playSound(type, enabled = true) {
  if (!enabled) return
  const ctx = getCtx()
  if (!ctx) return

  switch (type) {
    case 'miss':
      playTone(ctx, 220, 0.06, 0.08, 'triangle')
      break

    case 'dinger':
      playTone(ctx, 880, 0.12, 0.12)
      playTone(ctx, 1100, 0.08, 0.1, 'sine', 0.06)
      break

    case 'deuce':
      playTone(ctx, 660, 0.12, 0.1)
      playTone(ctx, 880, 0.12, 0.12, 'sine', 0.1)
      break

    case 'bucket':
      playTone(ctx, 440, 0.1, 0.08)
      playTone(ctx, 660, 0.12, 0.1, 'sine', 0.08)
      playTone(ctx, 880, 0.15, 0.18, 'sine', 0.18)
      break

    case 'instant_win':
      ;[440, 550, 660, 770, 880, 1100].forEach((freq, i) => {
        playTone(ctx, freq, 0.14, 0.18, 'sine', i * 0.08)
      })
      break

    case 'bust':
      playTone(ctx, 280, 0.18, 0.08, 'sawtooth')
      playTone(ctx, 220, 0.14, 0.1, 'sawtooth', 0.08)
      playTone(ctx, 160, 0.1, 0.15, 'sawtooth', 0.16)
      break

    default:
      playTone(ctx, 440, 0.1, 0.1)
  }
}
