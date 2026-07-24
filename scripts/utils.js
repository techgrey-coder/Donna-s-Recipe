const THEME_KEY = 'donnasTheme';

function applySavedTheme() {
  const theme = localStorage.getItem(THEME_KEY) || 'light-mode';
  document.body.classList.toggle('dark-mode', theme === 'dark-mode');
  document.body.classList.toggle('light-mode', theme !== 'dark-mode');
  return theme;
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('dark-mode') ? 'light-mode' : 'dark-mode';
  localStorage.setItem(THEME_KEY, nextTheme);
  applySavedTheme();
  return nextTheme;
}

applySavedTheme();

function getInitials(name) {
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 50%)`;
}
