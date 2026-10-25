import { CATEGORIES, QUANTITY, QUALITY } from './scoringConfig.js';

const CATEGORY_IDS = CATEGORIES.map((category) => category.id);

const sum = (values) => values.reduce((total, value) => total + value, 0);
const safeDiv = (numerator, denominator) => (denominator > 0 ? numerator / denominator : 0);

const withTotal = (quantity, quality) => ({ quantity, quality, total: quantity + quality });

// Every warrant plus every flagrant offense, drugs included
export const arrestsOf = (raw) => raw.warrants + sum(Object.values(raw.flagrant));

const categoriesOf = (raw) => {
    const { flagrant, tickets } = raw;
    const flagrantCount = sum(Object.values(flagrant)) - flagrant.drugs;
    const ticketCount = sum(Object.values(tickets));

    // Floors apply to each station's period total, so a partial block at one station never counts toward another
    return {
        warrant: withTotal(raw.warrants * QUANTITY.warrant, 0),
        flagrant: withTotal(
            flagrantCount * QUANTITY.flagrant,
            flagrant.gun * QUALITY.flagrantExtra.gun + flagrant.doc * QUALITY.flagrantExtra.doc
        ),
        drugs: withTotal(raw.drugCaseBase, raw.drugCaseExtra),
        tickets: withTotal(Math.floor(ticketCount / QUANTITY.ticketsPer), 0),
        service: withTotal(
            raw.convoy * QUANTITY.convoy
                + Math.floor(raw.serviceHelp / QUANTITY.servicePer)
                + Math.floor(raw.serviceTraffic / QUANTITY.servicePer)
                + Math.floor(raw.volunteer / QUANTITY.servicePer),
            0
        ),
    };
};

const pointsOf = (categories) => {
    const values = Object.values(categories);
    return { categories, ...withTotal(sum(values.map((c) => c.quantity)), sum(values.map((c) => c.quality))) };
};

export const unitPoints = (raw) => pointsOf(categoriesOf(raw));

export const emptyPoints = () => pointsOf(Object.fromEntries(CATEGORY_IDS.map((id) => [id, withTotal(0, 0)])));

export const addPoints = (a, b) => pointsOf(Object.fromEntries(CATEGORY_IDS.map((id) => [id, withTotal(
    a.categories[id].quantity + b.categories[id].quantity,
    a.categories[id].quality + b.categories[id].quality,
)])));

export const unitInfo = (raw, periodDays) => ({
    majorShare: safeDiv(raw.majorCases, arrestsOf(raw)),
    reportDays: raw.reportDays,
    reportRatio: periodDays > 0 ? Math.min(1, raw.reportDays / periodDays) : 0,
    activeDays: raw.activeDays,
});
