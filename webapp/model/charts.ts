/**
 * Gráficos em SVG puro, sem biblioteca externa. sap.viz e
 * sap.suite.ui.microchart não existem como pacotes @openui5/* no npm —
 * são bibliotecas exclusivas do SAPUI5 (CDN licenciado), indisponíveis
 * na fase Vercel/OpenUI5 deste projeto. Em vez de adicionar uma
 * biblioteca de gráficos externa (dívida documentada em
 * docs/migracao-btp.md de qualquer forma, já que seria substituída por
 * completo por VizFrame em BTP), estes dois gráficos são construídos à
 * mão, usando as variáveis CSS de tema `--sapChart_OrderedColor_N`
 * (definidas pela própria themelib_sap_horizon, não pelo sap.viz), para
 * manter zero dependências novas.
 */

function escapeXml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export interface DonutSegment {
    label: string;
    value: number;
    colorVar: string;
}

/** Gráfico de anel (donut) — usado para as categorias mais bem avaliadas, com legenda à parte. */
export function buildDonutChart(segments: DonutSegment[], size = 180): string {
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    if (total <= 0 || segments.length === 0) {
        return "";
    }

    const strokeWidth = size * 0.22;
    const radius = (size - strokeWidth) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * radius;
    const gap = Math.min(4, circumference / (segments.length * 8));

    let offset = 0;
    const circles = segments
        .map((segment) => {
            const fraction = segment.value / total;
            const rawLength = fraction * circumference;
            const length = Math.max(rawLength - gap, 0);
            const dashoffset = -offset;
            offset += rawLength;
            return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="var(${segment.colorVar})" stroke-width="${strokeWidth}" stroke-dasharray="${length.toFixed(2)} ${(circumference - length).toFixed(2)}" stroke-dashoffset="${dashoffset.toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"><title>${escapeXml(segment.label)}: ${segment.value.toFixed(1)}</title></circle>`;
        })
        .join("");

    return `<svg viewBox="0 0 ${size} ${size}" width="100%" height="${size}" role="img" focusable="false">${circles}</svg>`;
}

export interface BarDatum {
    label: string;
    value: number;
}

/** Gráfico de barras — usado para reconhecimentos por mês. Série única: sem legenda (o título já a identifica). */
export function buildBarChart(data: BarDatum[], width = 560, height = 220): string {
    const maxValue = Math.max(1, ...data.map((datum) => datum.value));
    const padding = { top: 16, right: 12, bottom: 28, left: 12 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const barGap = 6;
    const barWidth = data.length > 0 ? (plotWidth - barGap * (data.length - 1)) / data.length : 0;

    const gridLines = [0, 0.5, 1]
        .map((fraction) => {
            const y = padding.top + plotHeight * (1 - fraction);
            return `<line x1="${padding.left}" y1="${y.toFixed(1)}" x2="${width - padding.right}" y2="${y.toFixed(1)}" stroke="var(--sapList_BorderColor)" stroke-width="1" />`;
        })
        .join("");

    const bars = data
        .map((datum, index) => {
            const barHeight = (datum.value / maxValue) * plotHeight;
            const x = padding.left + index * (barWidth + barGap);
            const y = padding.top + plotHeight - barHeight;
            return (
                `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(barHeight, 1).toFixed(1)}" rx="3" fill="var(--sapChart_OrderedColor_1)">` +
                `<title>${escapeXml(datum.label)}: ${datum.value}</title></rect>` +
                `<text x="${(x + barWidth / 2).toFixed(1)}" y="${(height - 10).toFixed(1)}" font-size="10" text-anchor="middle" fill="var(--sapContent_LabelColor)">${escapeXml(datum.label)}</text>`
            );
        })
        .join("");

    return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" focusable="false">${gridLines}${bars}</svg>`;
}
