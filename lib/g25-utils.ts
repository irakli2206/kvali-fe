/**
 * Logic extracted from Vahaduo legacy for G25 coordinate processing
 */

export const parseG25 = (input: string) => {
    return input.split('\n')
        .filter(line => line.trim() && line.includes(','))
        .map(line => {
            const [label, ...coords] = line.split(',');
            return {
                label: label.trim(),
                coords: coords.map(Number)
            };
        });
};

/**
 * Pure Euclidean Distance Engine
 * Takes raw strings, returns structured result object
 */
export const calculateDistances = (sourceRaw: string, targetRaw: string, limit = 20) => {
    const sources = parseG25(sourceRaw);
    const targets = parseG25(targetRaw);

    return targets.map(t => {
        const distances = sources.map(s => {
            // Euclidean distance formula: sqrt(sum((p - q)^2))
            const dist = Math.sqrt(
                t.coords.reduce((sum, val, i) => sum + Math.pow(val - (s.coords[i] || 0), 2), 0)
            );

            return {
                label: s.label,
                distance: dist.toFixed(5)
            };
        }).sort((a, b) => Number(a.distance) - Number(b.distance));

        return {
            target: t.label,
            matches: distances.slice(0, limit)
        };
    });
};

export interface PlottablePoint {
    label: string;
    x: number; // PC1
    y: number; // PC2
    distance: number;
    color: string;
}

export const getDistanceColor = (dist: number, maxDist: number) => {
    // Simple HSL gradient: 120 (Green) to 0 (Red)
    const ratio = Math.min(dist / maxDist, 1);
    const hue = (1 - ratio) * 120;
    return `hsl(${hue}, 80%, 50%)`;
};

export const prepareMapData = (sourceRaw: string, targetRaw: string): PlottablePoint[] => {
    const sources = parseG25(sourceRaw);
    const targets = parseG25(targetRaw);
    if (targets.length === 0) return [];

    const target = targets[0]; // Logic for the first target

    // First, calculate all distances to find the range for the color scale
    const pointsWithDist = sources.map(s => {
        const dist = Math.sqrt(
            target.coords.reduce((sum, val, i) => sum + Math.pow(val - (s.coords[i] || 0), 2), 0)
        );
        return { ...s, dist };
    });

    const maxDist = Math.max(...pointsWithDist.map(p => p.dist)) * 0.2; // Threshold for color sensitivity

    return pointsWithDist.map(p => ({
        label: p.label,
        x: p.coords[0], // PC1
        y: p.coords[1], // PC2
        distance: p.dist,
        color: getDistanceColor(p.dist, maxDist)
    }));
};