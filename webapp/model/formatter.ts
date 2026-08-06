import DateFormat from "sap/ui/core/format/DateFormat";

/** Iniciais a partir do nome (ex.: "Ana Ferreira" -> "AF"), para o Avatar quando não há foto. */
export function initials(name: string | undefined): string {
    if (!name) {
        return "";
    }
    return name
        .trim()
        .split(/\s+/)
        .filter((part) => part.length > 0)
        .map((part) => part.charAt(0).toUpperCase())
        .filter((_char, index, all) => index === 0 || index === all.length - 1)
        .join("");
}

/** Classificação em formato "4.2/5", sensível ao locale ativo. */
export function ratingWithMax(rating: number | undefined): string {
    if (rating === undefined || rating === null) {
        return "";
    }
    return `${rating.toFixed(1)}/5`;
}

/** Percentagem normalizada a partir da classificação 1-5 (ver docs/analise-funcional.md secção 6). */
export function ratingToPercent(rating: number | undefined): string {
    if (rating === undefined || rating === null) {
        return "0%";
    }
    return `${Math.round((rating / 5) * 1000) / 10}%`;
}

let dateFormatter: DateFormat | undefined;

/** Data sensível ao locale ativo (formatter partilhado, criado uma vez). */
export function shortDate(isoDate: string | undefined): string {
    if (!isoDate) {
        return "";
    }
    if (!dateFormatter) {
        dateFormatter = DateFormat.getDateInstance({ style: "medium" });
    }
    return dateFormatter.format(new Date(isoDate));
}

/** Trunca uma mensagem para apresentação em lista, preservando palavras inteiras quando possível. */
export function truncate(text: string | undefined, maxLength = 80): string {
    if (!text) {
        return "";
    }
    if (text.length <= maxLength) {
        return text;
    }
    const cut = text.slice(0, maxLength).replace(/\s+\S*$/, "");
    return `${cut || text.slice(0, maxLength)}…`;
}

export function authorDisplayName(authorName: string | null | undefined, anonymousLabel: string): string {
    return authorName ?? anonymousLabel;
}

/** Iniciais para o Avatar — vazio quando anónimo, para cair no ícone neutro (ver avatarIcon). */
export function avatarInitials(name: string | null | undefined, isAnonymous: boolean | undefined): string {
    return isAnonymous ? "" : initials(name ?? undefined);
}

/** Ícone neutro do Avatar quando o autor é anónimo ou desconhecido. */
export function avatarIcon(name: string | null | undefined, isAnonymous: boolean | undefined): string | undefined {
    return isAnonymous || !name ? "sap-icon://person-placeholder" : undefined;
}
