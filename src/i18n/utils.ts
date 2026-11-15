import { ui, defaultLang, type Lang, type UiKey } from "./ui"
import { pages } from "@/lib/pages"

export function getLangFromUrl(url: URL): Lang {
  const first = url.pathname.split("/").filter(Boolean)[0]
  return first === "en" ? "en" : defaultLang
}

export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return ui[lang]?.[key] ?? ui[defaultLang][key]
  }
}

// A page's path in a language, from its Spanish path (with an optional
// #anchor). Spanish-only pages fall back to the English home page
export function localizePath(lang: Lang, path = "/"): string {
  if (lang === defaultLang) return path
  const [base, hash] = path.split("#")
  const en = pages[base]?.en ?? "/en/"
  return hash ? `${en}#${hash}` : en
}

// Spanish path of the current page, whatever its language
export function stripLang(pathname: string): string {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`
  if (!path.startsWith("/en/")) return path
  return Object.entries(pages).find(([, page]) => page.en === path)?.[0] ?? "/"
}

// Equivalent of `pathname` in `lang`, or null when that version doesn't exist
export function getAlternatePath(pathname: string, lang: Lang): string | null {
  const es = stripLang(pathname)
  if (lang === defaultLang) return pages[es] ? es : null
  return pages[es]?.en ?? null
}
