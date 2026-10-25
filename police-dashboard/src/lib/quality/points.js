import { CATEGORIES, QUANTITY, QUALITY } from './scoringConfig.js';

const CATEGORY_IDS = CATEGORIES.map((category) => category.id);

const sum = (values) => values.reduce((total, value) => total + value, 0);
const safeDiv = (numerator, denominator) => (denominator > 0 ? numerator / denominator : 0);

const withTotal = (quantity, quality) => ({ quantity, quality, total: quantity + quality });

// Every warrant plus every flagrant offense, drugs included
export const arrestsOf = (raw) => raw.warrants + sum(Object.values(raw.flagrant));

const categoriesOf = (raw) => {
    const { flagrant, drugSeized, seized, tickets } = raw;
    const flagrantCount = sum(Object.values(flagrant)) - flagrant.drugs;

    return {
        warrant: withTotal(
            raw.warrants * QUANTITY.warrant,
            raw.bigDataWarrants * QUALITY.bigDataWarrant
        ),
        flagrant: withTotal(
            flagrantCount * QUANTITY.flagrant,
            flagrant.gun * QUALITY.flagrantExtra.gun + flagrant.doc * QUALITY.flagrantExtra.doc
        ),
        drugs: withTotal(
            raw.drugCaseBase,
            raw.drugCaseExtra
                + Math.floor(drugSeized.yaba / QUALITY.drugPer.yaba)
                + Math.floor(drugSeized.ice / QUALITY.drugPer.ice)
                + Math.floor(drugSeized.other / QUALITY.drugPer.other)
        ),
        tickets: withTotal(sum(Object.values(tickets)) * QUANTITY.ticket, 0),
        service: withTotal(
            raw.convoy * QUANTITY.convoy
                + raw.serviceHelp * QUANTITY.help
                + raw.serviceTraffic * QUANTITY.trafficService
                + raw.volunteer * QUANTITY.volunteer,
            0
        ),
        seized: withTotal(
            0,
            seized.gun * QUALITY.seizedEach.gun
                + seized.explosive * QUALITY.seizedEach.explosive
                + seized.car * QUALITY.seizedEach.car
                + seized.motorcycle * QUALITY.seizedEach.motorcycle
                + Math.floor(seized.bullets / QUALITY.seizedPer.bullets)
                + Math.floor(seized.cash / QUALITY.seizedPer.cash)
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
