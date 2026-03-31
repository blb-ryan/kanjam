// User preferences stored in localStorage

const PREFS_KEY = 'kanjam_prefs'

const DEFAULTS = {
  soundEnabled: true,
  hapticEnabled: true,
  theme: 'dark', // 'dark' | 'sun'
}

export function getPrefs() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

export function setPrefs(update) {
  const current = getPrefs()
  const next = { ...current, ...update }
  localStorage.setItem(PREFS_KEY, JSON.stringify(next))
  return next
}

export function togglePref(key) {
  const current = getPrefs()
  const next = { ...current, [key]: !current[key] }
  localStorage.setItem(PREFS_KEY, JSON.stringify(next))
  return next
}
