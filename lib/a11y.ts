"use client";

export type A11yState = {
  fontScale: 0 | 1 | 2 | 3;
  contrast: boolean;
  grayscale: boolean;
  highlightLinks: boolean;
  readableFont: boolean;
  stopAnimations: boolean;
  bigCursor: boolean;
};

export const A11Y_STORAGE_KEY = "mishanya-a11y";

export const A11Y_DEFAULT: A11yState = {
  fontScale: 0,
  contrast: false,
  grayscale: false,
  highlightLinks: false,
  readableFont: false,
  stopAnimations: false,
  bigCursor: false,
};

const FLAG_CLASSES: Record<keyof Omit<A11yState, "fontScale">, string> = {
  contrast: "a11y-contrast",
  grayscale: "a11y-grayscale",
  highlightLinks: "a11y-links",
  readableFont: "a11y-readable",
  stopAnimations: "a11y-no-motion",
  bigCursor: "a11y-cursor",
};

let state: A11yState = A11Y_DEFAULT;
let hydrated = false;
const listeners = new Set<() => void>();

function sanitize(raw: unknown): A11yState {
  if (!raw || typeof raw !== "object") return A11Y_DEFAULT;
  const source = raw as Record<string, unknown>;
  const fontScale = Number(source.fontScale);
  return {
    fontScale: (fontScale >= 0 && fontScale <= 3 ? Math.round(fontScale) : 0) as A11yState["fontScale"],
    contrast: source.contrast === true,
    grayscale: source.grayscale === true,
    highlightLinks: source.highlightLinks === true,
    readableFont: source.readableFont === true,
    stopAnimations: source.stopAnimations === true,
    bigCursor: source.bigCursor === true,
  };
}

function applyToDocument(next: A11yState) {
  const root = document.documentElement;
  for (const level of [1, 2, 3]) {
    root.classList.toggle(`a11y-font-${level}`, next.fontScale === level);
  }
  for (const [key, className] of Object.entries(FLAG_CLASSES)) {
    root.classList.toggle(className, next[key as keyof typeof FLAG_CLASSES]);
  }
}

function persist(next: A11yState) {
  try {
    const isDefault = JSON.stringify(next) === JSON.stringify(A11Y_DEFAULT);
    if (isDefault) {
      window.localStorage.removeItem(A11Y_STORAGE_KEY);
    } else {
      window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // localStorage может быть недоступен (private mode) - режимы работают в рамках сессии
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (raw) state = sanitize(JSON.parse(raw));
  } catch {
    state = A11Y_DEFAULT;
  }
  applyToDocument(state);
}

export function getA11yState(): A11yState {
  return state;
}

/** Вызывать один раз из useEffect: подхватывает сохранённые настройки и будит подписчиков. */
export function hydrateA11y() {
  hydrate();
  listeners.forEach((listener) => listener());
}

export function getA11yServerState(): A11yState {
  return A11Y_DEFAULT;
}

export function setA11yState(patch: Partial<A11yState>) {
  hydrate();
  state = sanitize({ ...state, ...patch });
  applyToDocument(state);
  persist(state);
  listeners.forEach((listener) => listener());
}

export function resetA11yState() {
  setA11yState(A11Y_DEFAULT);
}

export function subscribeA11y(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Инлайн-скрипт для <head>: восстанавливает классы режимов до первой отрисовки,
 * чтобы страница не мигала обычным видом у пользователя с включёнными настройками.
 * Дублирует логику sanitize/applyToDocument в максимально коротком виде.
 */
export const A11Y_BOOT_SCRIPT = `(function(){try{var r=JSON.parse(localStorage.getItem("${A11Y_STORAGE_KEY}")||"null");if(!r)return;var c=document.documentElement.classList;var f=Math.round(Number(r.fontScale));if(f>=1&&f<=3)c.add("a11y-font-"+f);var m={contrast:"a11y-contrast",grayscale:"a11y-grayscale",highlightLinks:"a11y-links",readableFont:"a11y-readable",stopAnimations:"a11y-no-motion",bigCursor:"a11y-cursor"};for(var k in m){if(r[k]===true)c.add(m[k])}}catch(e){}})();`;
