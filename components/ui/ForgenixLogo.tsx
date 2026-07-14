// components/Forgenix.tsx
import React from 'react';

interface Props {
    size?: number;
    className?: string;
    /** Liste des lettres à cacher (ex: ['F', 'O']). L'espace sera comblé. */
    hideLetters?: string[];
    /** 
     * Objet pour colorer des lettres spécifiques. 
     * ex: {{ 'X': '#FF0000', 'N': 'text-blue-500' }} 
     */
    coloredLetters?: Record<string, string>;
}

export function ForgenixLogo({
    size = 48,
    className,
}: Props) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            className={className}
            role="img"
            aria-label="Forgenix Logo"
        >
            <g
                fill="currentColor" // Rend la couleur dynamique (hérite de la classe text-blue-500 par exemple)
                transform="translate(-325.632 -264.192) scale(1.024)"
            >
                <rect x="415" y="258" width="300" height="100" />
                <rect x="318" y="358" width="100" height="100" />
                <polygon points="415,358 515,458 415,458" />
                <rect x="515" y="458" width="100" height="100" />
                <rect x="415" y="558" width="100" height="200" />
            </g>
        </svg>
    );
}

export function ForgenixText({
    size = 48,
    className,
    hideLetters = [],
    coloredLetters = {},
}: Props) {
    // Largeur de base du viewBox
    const originalWidth = 265.10;

    // Pour calculer le décalage, nous avons mesuré précisément la position 
    // et l'espace occupé par chaque lettre dans le SVG original.
    // L'"advance" correspond à la largeur de la lettre + la marge jusqu'à la suivante.
    const letterMetrics = [
        { char: 'F', advance: 29.55 }, // Largeur F + espace jusqu'au O
        { char: 'O', advance: 41.20 }, // Espace O -> R
        { char: 'R', advance: 35.05 }, // Espace R -> G
        { char: 'G', advance: 41.35 }, // Espace G -> E
        { char: 'E', advance: 34.15 }, // Espace E -> N
        { char: 'N', advance: 37.70 }, // Espace N -> I
        { char: 'I', advance: 11.70 }, // Espace I -> X
        { char: 'X', advance: 34.40 }, // Largeur finale du X
    ];

    // Les chemins SVG originaux (toujours dessinés à leur place de base)
    const paths = {
        'F': "M0 43.90L0 9.60L25.30 9.60L25.30 15.70L7.45 15.70L7.45 24.20L23.40 24.20L23.40 30.25L7.45 30.25L7.45 43.90L0 43.90Z",
        'O': "M47.10 44.50Q41.65 44.50 37.70 42.55Q33.75 40.60 31.65 36.65Q29.55 32.70 29.55 26.75Q29.55 20.70 31.65 16.77Q33.75 12.85 37.70 10.92Q41.65 9 47.10 9Q52.65 9 56.58 10.92Q60.50 12.85 62.60 16.77Q64.70 20.70 64.70 26.75Q64.70 32.70 62.60 36.65Q60.50 40.60 56.58 42.55Q52.65 44.50 47.10 44.50M47.10 38.40Q49.55 38.40 51.40 37.70Q53.25 37 54.50 35.60Q55.75 34.20 56.40 32.17Q57.05 30.15 57.05 27.55L57.05 26.00Q57.05 23.35 56.40 21.30Q55.75 19.25 54.50 17.87Q53.25 16.50 51.40 15.80Q49.55 15.10 47.10 15.10Q44.70 15.10 42.85 15.80Q41 16.50 39.75 17.87Q38.50 19.25 37.88 21.30Q37.25 23.35 37.25 26.00L37.25 27.55Q37.25 30.15 37.88 32.17Q38.50 34.20 39.75 35.60Q41 37 42.85 37.70Q44.70 38.40 47.10 38.40Z",
        'R': "M70.75 43.90L70.75 9.60L89.55 9.60Q93.35 9.60 95.88 10.95Q98.40 12.30 99.65 14.72Q100.90 17.15 100.90 20.30Q100.90 23.65 99.40 26.22Q97.90 28.80 95.05 30.15L102.05 43.90L93.80 43.90L87.75 31.40L78.20 31.40L78.20 43.90L70.75 43.90M78.20 25.50L88.55 25.50Q90.80 25.50 92.05 24.12Q93.30 22.75 93.30 20.40Q93.30 18.90 92.75 17.82Q92.20 16.75 91.15 16.20Q90.10 15.65 88.55 15.65L78.20 15.65L78.20 25.50Z",
        'G': "M122.65 44.50Q114.55 44.50 110.17 40.17Q105.80 35.85 105.80 26.75Q105.80 20.70 107.90 16.77Q110 12.85 114 10.92Q118 9 123.60 9Q126.95 9 129.90 9.75Q132.85 10.50 135.13 12.05Q137.40 13.60 138.68 15.92Q139.95 18.25 139.95 21.45L132.40 21.45Q132.40 19.90 131.72 18.70Q131.05 17.50 129.85 16.70Q128.65 15.90 127.10 15.50Q125.55 15.10 123.85 15.10Q121.25 15.10 119.30 15.77Q117.35 16.45 116.08 17.82Q114.80 19.20 114.15 21.25Q113.50 23.30 113.50 26.00L113.50 27.50Q113.50 31.25 114.60 33.65Q115.70 36.05 117.90 37.22Q120.10 38.40 123.35 38.40Q126.05 38.40 128.13 37.57Q130.20 36.75 131.38 35.20Q132.55 33.65 132.55 31.40L132.55 31.05L122.30 31.05L122.30 25.35L139.95 25.35L139.95 43.90L135.05 43.90L134.40 40.20Q132.90 41.65 131.18 42.60Q129.45 43.55 127.35 44.02Q125.25 44.50 122.65 44.50Z",
        'E': "M147.15 43.90L147.15 9.60L174.55 9.60L174.55 15.70L154.65 15.70L154.65 23.35L172.25 23.35L172.25 29.40L154.65 29.40L154.65 37.75L174.85 37.75L174.85 43.90L147.15 43.90Z",
        'N': "M181.30 43.90L181.30 9.60L188.15 9.60L201.95 28.10Q202.25 28.45 202.70 29.07Q203.15 29.70 203.55 30.30Q203.95 30.90 204.10 31.25L204.35 31.25Q204.35 30.40 204.35 29.57Q204.35 28.75 204.35 28.10L204.35 9.60L211.40 9.60L211.40 43.90L204.55 43.90L190.45 24.95Q189.95 24.25 189.40 23.40Q188.85 22.55 188.60 22.10L188.35 22.10Q188.35 22.85 188.35 23.57Q188.35 24.30 188.35 24.95L188.35 43.90L181.30 43.90Z",
        'I': "M219 43.90L219 9.60L226.45 9.60L226.45 43.90L219 43.90Z",
        'X': "M230.70 43.90L243.05 25.85L231.90 9.60L241 9.60L248.10 20.45L248.35 20.45L255.40 9.60L263.95 9.60L252.75 25.85L265.10 43.90L256 43.90L247.75 31.20L247.50 31.20L239.30 43.90L230.70 43.90Z"
    };

    const isHidden = (char: string) => hideLetters.includes(char);

    // 1. Calculer le décalage dynamique pour chaque lettre
    // Si une lettre précédente est cachée, on accumule son "advance" (sa largeur + espace)
    let accumulatedShift = 0;

    // 2. Calculer la nouvelle largeur totale du viewBox 
    // (pour que l'image globale se rétrécisse et qu'il n'y ait pas de vide à la fin)
    let totalRemovedWidth = 0;

    const renderLetters = letterMetrics.map((metric, index) => {
        if (isHidden(metric.char)) {
            // Si la lettre est cachée, on augmente le décalage pour les lettres suivantes
            accumulatedShift += metric.advance;
            totalRemovedWidth += metric.advance;
            return null;
        }

        // Si une couleur personnalisée est passée, on l'utilise. Sinon, currentColor (hérite du parent).
        const fillValue = coloredLetters[metric.char]
            ? coloredLetters[metric.char]
            // Si c'est une classe Tailwind (comme 'text-red-500'), on laisse CSS gérer.
            : "currentColor";

        const isTailwindClass = coloredLetters[metric.char] && coloredLetters[metric.char].includes('text-');

        return (
            <path
                key={metric.char}
                // On translate vers la gauche (-X) d'autant de pixels que l'espace vide créé
                transform={`translate(-${accumulatedShift}, 0)`}
                d={paths[metric.char as keyof typeof paths]}
                fill={isTailwindClass ? "currentColor" : fillValue}
                className={isTailwindClass ? coloredLetters[metric.char] : ""}
            />
        );
    });

    // La nouvelle largeur du SVG correspond à la largeur d'origine MOINS l'espace des lettres supprimées.
    const newViewBoxWidth = originalWidth - totalRemovedWidth;
    const ratio = newViewBoxWidth / 35.5;
    const calculatedWidth = size * ratio;

    return (
        <svg
            width={calculatedWidth}
            height={size}
            // Le viewBox s'ajuste dynamiquement pour couper l'espace vide à droite
            viewBox={`0 9 ${newViewBoxWidth} 35.5`}
            data-asc="0.878"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <g>
                {renderLetters}
            </g>
        </svg>
    );
}

export default function Forgenix({
    size = 48,
    className,
}: Props) {
    return (
        <div
            className={`text-[#1177EE] ${className || ""}`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: size * 0.2,
            }}
        >
            <ForgenixLogo size={size} />
            <ForgenixText size={size} />
        </div>
    );
}