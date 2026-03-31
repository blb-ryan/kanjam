export const VERSION = '1.2.0'
export const BUILD_TIMESTAMP = '2026-03-31T20:00:00Z'

const _d = new Date(BUILD_TIMESTAMP)
const _month = _d.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/New_York' })
const _day = _d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/New_York' })
const _time = _d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'America/New_York' })
export const VERSION_LABEL = `Build: ${_month} ${_day} ${_time} · v${VERSION}`
