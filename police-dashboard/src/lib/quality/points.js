import { CATEGORIES, QUANTITY, QUALITY } from './scoringConfig.js';

const CATEGORY_IDS = CATEGORIES.map((category) => category.id);

const sum = (values) => values.reduce((total, value) => total + value, 0);

const withTotal = (quantity, quality) => ({ quantity, quality, total: quantity + quality });

// Points per category from self-arrest counts: { warrant, drugs, immig, theft, gun, other, truck }
const categoriesOf = (counts) => {
    const flagrantCount = counts.immig + counts.theft + counts.gun + counts.other + counts.truck;

    return {
        warrant: withTotal(counts.warrant * QUANTITY.warrant, 0),
        flagrant: withTotal(flagrantCount * QUANTITY.flagrant, counts.gun * QUALITY.flagrantExtra.gun),
        drugs: withTotal(counts.drugs * QUANTITY.drugCaseBase, 0),
        award: withTotal(0, 0),
    };
};

const pointsOf = (categories) => {
    const values = Object.values(categories);
    return { categories, ...withTotal(sum(values.map((c) => c.quantity)), sum(values.map((c) => c.quality))) };
};

// Points in one category only, for awards (quality only)
export const pointsIn = (id, quantity, quality) => pointsOf(Object.fromEntries(CATEGORY_IDS.map((c) => [c, withTotal(
    c === id ? quantity : 0,
    c === id ? quality : 0,
)])));

export const unitPoints = (counts) => pointsOf(categoriesOf(counts));

export const emptyPoints = () => pointsOf(Object.fromEntries(CATEGORY_IDS.map((id) => [id, withTotal(0, 0)])));

export const addPoints = (a, b) => pointsOf(Object.fromEntries(CATEGORY_IDS.map((id) => [id, withTotal(
    a.categories[id].quantity + b.categories[id].quantity,
    a.categories[id].quality + b.categories[id].quality,
)])));
