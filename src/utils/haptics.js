// Haptic feedback patterns via navigator.vibrate

export function haptic(type, enabled = true) {
  if (!enabled || !navigator.vibrate) return

  switch (type) {
    case 'miss':
      navigator.vibrate(15)
      break
    case 'dinger':
      navigator.vibrate([30, 15, 30])
      break
    case 'deuce':
      navigator.vibrate([40, 15, 40, 15, 40])
      break
    case 'bucket':
      navigator.vibrate([60, 20, 60, 20, 120])
      break
    case 'instant_win':
      navigator.vibrate([80, 40, 80, 40, 80, 40, 200])
      break
    case 'bust':
      navigator.vibrate([200])
      break
    case 'tap':
      navigator.vibrate(10)
      break
    default:
      navigator.vibrate(20)
  }
}
