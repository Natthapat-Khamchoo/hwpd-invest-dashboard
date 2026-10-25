import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unitPoints, pointsIn, addPoints, emptyPoints } from './points.js';

// Self-arrest counts of one station-month, every field 0 unless given
const counts = (overrides = {}) => ({ warrant: 0, drugs: 0, immig: 0, theft: 0, gun: 0, other: 0, truck: 0, ...overrides });

test('each warrant case scores 2 quantity', () => {
    const points = unitPoints(counts({ warrant: 15 }));

    assert.deepEqual(points.categories.warrant, { quantity: 30, quality: 0, total: 30 });
    assert.equal(points.total, 30);
});

test('each flagrant case scores 1 quantity across immig, theft, gun, drugs and other, but not trucks', () => {
    const points = unitPoints(counts({ immig: 4, theft: 1, other: 2, drugs: 3, truck: 5 }));

    assert.deepEqual(points.categories.flagrant, { quantity: 10, quality: 0, total: 10 });
});

test('a gun case scores 1 quantity and 4 quality', () => {
    const points = unitPoints(counts({ gun: 1 }));

    assert.deepEqual(points.categories.flagrant, { quantity: 1, quality: 4, total: 5 });
});

test('each drug case scores 1 quantity in the flagrant category', () => {
    const points = unitPoints(counts({ drugs: 7 }));

    assert.deepEqual(points.categories.flagrant, { quantity: 7, quality: 0, total: 7 });
});

test('each heavy-truck case scores 1 quantity in its own category', () => {
    const points = unitPoints(counts({ truck: 3 }));

    assert.deepEqual(points.categories.truck, { quantity: 3, quality: 0, total: 3 });
    assert.equal(points.categories.flagrant.total, 0);
});

test('a row with no arrests scores zero in every category', () => {
    const points = unitPoints(counts());

    assert.equal(points.total, 0);
    assert.ok(['warrant', 'flagrant', 'truck', 'award'].every((id) => points.categories[id].total === 0));
});

test('the total is quantity plus quality over all categories', () => {
    // warrant 2 x 2 = 4 quantity; flagrant 2 gun + 1 immig + 1 drug = 4 quantity and 2 x 4 = 8 quality
    const points = unitPoints(counts({ warrant: 2, drugs: 1, gun: 2, immig: 1 }));

    assert.equal(points.quantity, 8);
    assert.equal(points.quality, 8);
    assert.equal(points.total, 16);
});

test('pointsIn puts its points into one category only', () => {
    const points = pointsIn('award', 0, 10);

    assert.deepEqual(points.categories.award, { quantity: 0, quality: 10, total: 10 });
    assert.equal(points.categories.warrant.total, 0);
    assert.equal(points.total, 10);
});

test('addPoints sums category by category, and emptyPoints adds nothing', () => {
    const sum = addPoints(unitPoints(counts({ warrant: 1 })), unitPoints(counts({ gun: 1 })));

    assert.equal(sum.total, 2 + 5);
    assert.deepEqual(addPoints(emptyPoints(), sum), sum);
});
