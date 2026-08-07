export const SUPPORTED_LANGUAGES = ["pt", "en", "fr_FR"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = "thankyou.language";
const DEFAULT_LANGUAGE: SupportedLanguage = "pt";

/**
 * Preferência de idioma persistida (localStorage — sobrevive entre
 * sessões, ao contrário do utilizador de demonstração em
 * DemoUserStore.ts, que só interessa durante a sessão). Lida também por
 * um script inline em index.html antes do bootstrap UI5 arrancar — a
 * troca de idioma exige sempre reload completo, nunca é aplicada em
 * runtime (ver o comentário em index.html).
 */
export function getStoredLanguage(): SupportedLanguage {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(stored ?? "")
        ? (stored as SupportedLanguage)
        : DEFAULT_LANGUAGE;
}

export function setStoredLanguage(language: SupportedLanguage): void {
    window.localStorage.setItem(STORAGE_KEY, language);
}
