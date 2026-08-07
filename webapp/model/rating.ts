/**
 * Conversão de classificação 1–5 para percentagem normalizada (ver
 * docs/analise-funcional.md secção 6: `percentagem = (média / 5) × 100`).
 * Ponto único para esta fórmula do lado do webapp — antes duplicada de
 * forma independente em MockRecognitionService.ts, Home.controller.ts e
 * webapp/model/formatter.ts.
 */
export function ratingToPercentValue(rating: number): number {
    return Math.round((rating / 5) * 1000) / 10;
}
