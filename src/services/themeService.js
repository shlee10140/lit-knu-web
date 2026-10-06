const THEME_KEY = 'lit_theme_mode'

export function getTheme() {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return 'light'
}

export function setTheme(theme) {
  const target = theme === 'dark' ? 'dark' : 'light'
  localStorage.setItem(THEME_KEY, target)
  document.documentElement.setAttribute('data-theme', target)
  window.dispatchEvent(new CustomEvent('lit-theme-change', { detail: { theme: target } }))
  return target
}

export function toggleTheme() {
  const current = getTheme()
  const next = current === 'light' ? 'dark' : 'light'
  return setTheme(next)
}
