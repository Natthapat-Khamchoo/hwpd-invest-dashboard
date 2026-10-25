import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unitPoints, unitInfo, addPoints, emptyPoints } from './points.js';
import { aggregateStationRaw, emptyStationRaw } from './stationRaw.js';
import { rawData } from './testFixture.js';
import { periodRange, previousPeriodRange, buildQualityModel } from './buildQualityModel.js';

const fixtureStation = (key) => aggregateStationRaw(rawData, new Date(2026, 9, 1), new Date(2026, 9, 24))[key];

const splitOf = (points) => Object.fromEntries(
    Object.entries(points.categories).map(([id, c]) => [id, [c.quantity, c.quality]])
);

test('unitPoints splits fixture station 1-1 into quantity and quality per category', () => {
    const points = unitPoints(fixtureStation('1-1'));

    assert.deepEqual(splitOf(points), {
        warrant: [4, 0],
        flagrant: [2, 4],
        drugs: [1, 4],
        tickets: [0, 0],
        service: [1, 0],
    });
    assert.equal(points.quantity, 8);
    assert.equal(points.quality, 8);
    assert.equal(points.total, 16);
});

test('unitPoints has exactly the five scoring categories and no seized category', () => {
    assert.deepEqual(
        Object.keys(unitPoints(fixtureStation('1-1')).categories),
        ['warrant', 'flagrant', 'drugs', 'tickets', 'service']
    );
});

test('unitPoints makes every category total and the unit totals equal quantity plus quality', () => {
    const points = unitPoints(fixtureStation('1-1'));

    for (const c of Object.values(points.categories)) assert.equal(c.total, c.quantity + c.quality);
    const sumOf = (field) => Object.values(points.categories).reduce((total, c) => total + c[field], 0);
    assert.equal(points.quantity, sumOf('quantity'));
    assert.equal(points.quality, sumOf('quality'));
    assert.equal(points.total, points.quantity + points.quality);
});

test('unitPoints scores every warrant at 2 quantity with no quality, Big Data included', () => {
    const raw = emptyStationRaw();
    raw.warrants = 3;

    assert.deepEqual(unitPoints(raw).categories.warrant, { quantity: 6, quality: 0, total: 6 });
});

test('unitPoints scores each flagrant arrest at 1 and adds 4 quality for a gun or forged document', () => {
    const raw = emptyStationRaw();
    raw.flagrant = { ...raw.flagrant, gun: 2, doc: 1, weight: 1, drugs: 3 };

    // Drug arrests are scored under drugs, not flagrant: 2 + 1 + 1 = 4 arrests, quality 2 * 4 + 1 * 4 = 12
    assert.deepEqual(unitPoints(raw).categories.flagrant, { quantity: 4, quality: 12, total: 16 });
});

test('unitPoints takes drug points from the case base and tier excess alone', () => {
    const raw = emptyStationRaw();
    raw.drugCaseBase = 5;
    raw.drugCaseExtra = 10;

    assert.deepEqual(unitPoints(raw).categories.drugs, { quantity: 5, quality: 10, total: 15 });
});

test('unitPoints scores tickets per full 100 and service per convoy plus per full 10 of each other service', () => {
    const raw = emptyStationRaw();
    raw.tickets = { transport: 150, vehicle: 99, traffic: 1 };
    raw.convoy = 3;
    raw.serviceHelp = 25;
    raw.serviceTraffic = 9;
    raw.volunteer = 10;
    const points = unitPoints(raw);

    // 250 tickets -> 2; convoy 3 + help 2 + traffic 0 + volunteer 1 = 6
    assert.deepEqual(points.categories.tickets, { quantity: 2, quality: 0, total: 2 });
    assert.deepEqual(points.categories.service, { quantity: 6, quality: 0, total: 6 });
});

test('unitInfo derives major share, report ratio and active days from the fixture station', () => {
    // arrests = 2 warrants + 3 flagrant (drugs, gun, weight) = 5; major = drug case (5 pts) + gun = 2
    assert.deepEqual(unitInfo(fixtureStation('1-1'), 4), {
        majorShare: 0.4,
        reportDays: 2,
        reportRatio: 0.5,
        activeDays: 2,
    });
});

test('unitInfo returns zeros with no arrests and no period days', () => {
    assert.deepEqual(unitInfo(emptyStationRaw(), 0), {
        majorShare: 0,
        reportDays: 0,
        reportRatio: 0,
        activeDays: 0,
    });
});

test('addPoints sums categories and totals, and emptyPoints is the identity', () => {
    const station = unitPoints(fixtureStation('1-1'));

    assert.deepEqual(addPoints(emptyPoints(), station), station);
    const doubled = addPoints(station, station);
    assert.equal(doubled.total, 32);
    assert.deepEqual(doubled.categories.warrant, { quantity: 8, quality: 0, total: 8 });
});

test('periodRange month starts on the 1st and counts days inclusively', () => {
    assert.equal(periodRange('month', new Date(2026, 9, 24)).days, 24);
    assert.equal(periodRange('month', new Date(2026, 9, 1)).days, 1);
});

test('periodRange fy starts on 1 October of the fiscal year containing today', () => {
    assert.deepEqual(periodRange('fy', new Date(2026, 9, 24)).start, new Date(2026, 9, 1));
    assert.deepEqual(periodRange('fy', new Date(2027, 2, 15)).start, new Date(2026, 9, 1));
});

test('previousPeriodRange covers the same days of the previous month', () => {
    const sep = previousPeriodRange(new Date(2026, 9, 24));

    assert.deepEqual(sep.start, new Date(2026, 8, 1));
    assert.deepEqual(sep.end, new Date(2026, 8, 24));
    assert.equal(sep.days, 24);
});

test('previousPeriodRange clamps to the last day of a shorter previous month', () => {
    const feb = previousPeriodRange(new Date(2026, 2, 31));

    assert.deepEqual(feb.start, new Date(2026, 1, 1));
    assert.deepEqual(feb.end, new Date(2026, 1, 28));
    assert.equal(feb.days, 28);
});

test('buildQualityModel exposes period, hq, divisions and stations with the brief shape', () => {
    const model = buildQualityModel(rawData, 'month', new Date(2026, 9, 24));

    assert.deepEqual(Object.keys(model).sort(), ['divisions', 'hq', 'period', 'stations']);
    assert.deepEqual(Object.keys(model.hq).sort(), ['average', 'delta', 'points', 'total']);
    assert.deepEqual(Object.keys(model.divisions[0]).sort(), ['average', 'delta', 'info', 'kk', 'name', 'points', 'stationCount', 'total']);
    assert.deepEqual(Object.keys(model.stations[0]).sort(), ['consistency', 'delta', 'info', 'key', 'kk', 'name', 'points', 'raw', 'stl', 'total']);
    assert.equal(model.stations.length, 43);
    assert.deepEqual(model.divisions.map((d) => d.kk), ['1', '2', '3', '4', '5', '6', '7', '8']);
});

test('buildQualityModel sums stations into divisions and HQ, with averages per station', () => {
    const model = buildQualityModel(rawData, 'month', new Date(2026, 9, 24));
    const division1 = model.divisions.find((d) => d.kk === '1');

    assert.equal(division1.stationCount, 6);
    assert.equal(division1.total, 16);
    assert.equal(division1.average, 2.7);
    assert.equal(model.hq.total, model.divisions.reduce((sum, d) => sum + d.total, 0));
    assert.equal(model.hq.total, 16);
    assert.equal(model.hq.average, 0.4);
});

test('buildQualityModel keeps quantity + quality = total on every unit', () => {
    const model = buildQualityModel(rawData, 'month', new Date(2026, 9, 24));
    const units = [model.hq, ...model.divisions, ...model.stations];

    for (const unit of units) {
        assert.equal(unit.points.total, unit.points.quantity + unit.points.quality);
        assert.equal(unit.total, unit.points.total);
    }
});

test('buildQualityModel compares month deltas against the same days of the previous month', () => {
    const model = buildQualityModel(rawData, 'month', new Date(2026, 9, 24));
    const station = model.stations.find((s) => s.key === '1-1');

    // The 30/09 warrant row falls outside 1-24 Sep, so the previous period is empty
    assert.equal(station.delta, 16);
    assert.equal(model.divisions.find((d) => d.kk === '1').delta, 16);
    assert.equal(model.hq.delta, 16);
});

test('buildQualityModel scores every unit 0 with zero deltas when rawData is empty', () => {
    const model = buildQualityModel({}, 'month', new Date(2026, 9, 24));

    for (const station of model.stations) {
        assert.equal(station.total, 0);
        assert.equal(station.delta, 0);
    }
    for (const division of model.divisions) assert.equal(division.average, 0);
    assert.equal(model.hq.total, 0);
    assert.equal(model.hq.average, 0);
});

test('buildQualityModel keeps every number finite and deltas null outside the month period', () => {
    const model = buildQualityModel(rawData, 'fy', new Date(2026, 9, 1));

    for (const station of model.stations) {
        assert.ok(Number.isFinite(station.total));
        assert.equal(station.delta, null);
    }
    assert.equal(model.hq.delta, null);
    assert.equal(model.divisions[0].delta, null);
});
