/**
 * Rainbow Six Siege season calendar.
 *
 * This is the ONLY file that needs editing when Ubisoft announces a new season:
 * add an entry at the end with its id, code, name and launch date (UTC).
 *
 * Everything else is computed from this list:
 *  - the current season is the last one whose `start` has passed,
 *  - a season ends when the next one starts,
 *  - if the next season is not in the list yet, its start is estimated with
 *    Ubisoft's ~91-day cadence and flagged as `estimated`.
 *
 * So even if nobody touches this file for months, the countdown never sits at zero.
 */

export const SEASON_LENGTH_DAYS = 91;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface Season {
    /** Stable id, used for translation keys (Seasons.<id>.highlight). */
    id: string;
    /** Display code, e.g. "Y11S4". */
    code: string;
    /** Operation name without the "Operation" prefix. */
    name: string;
    /** Launch date/time in UTC (ISO 8601). */
    start: string;
    /** True when the launch time (not just the day) is still unconfirmed. */
    startApprox?: boolean;
}

export const SEASONS: Season[] = [
    { id: "y10s1", code: "Y10S1", name: "Prep Phase", start: "2025-03-04T14:00:00Z" },
    { id: "y10s2", code: "Y10S2", name: "Daybreak", start: "2025-06-10T13:00:00Z" },
    { id: "y10s3", code: "Y10S3", name: "High Stakes", start: "2025-09-02T13:00:00Z" },
    { id: "y10s4", code: "Y10S4", name: "Tenfold Pursuit", start: "2025-12-02T14:00:00Z" },
    { id: "y11s1", code: "Y11S1", name: "Silent Hunt", start: "2026-03-03T14:00:00Z" },
    { id: "y11s2", code: "Y11S2", name: "System Override", start: "2026-06-09T13:00:00Z", startApprox: true },
    { id: "y11s3", code: "Y11S3", name: "Split Fire", start: "2026-09-01T14:00:00Z" },
    // Launch day confirmed by Ubisoft (Dec 1); exact time usually 14:00 UTC, confirmed shortly before.
    { id: "y11s4", code: "Y11S4", name: "Vital Signal", start: "2026-12-01T14:00:00Z", startApprox: true },
];

/** A season as used by the UI: known (from SEASONS) or projected (estimated). */
export interface SeasonSlot {
    id?: string;
    code: string;
    name?: string;
    start: string;
    /** The start date is an estimate (season not announced yet). */
    estimated: boolean;
    /** The day is known but the exact hour is not. */
    startApprox: boolean;
}

export interface SeasonState {
    current: SeasonSlot;
    next: SeasonSlot;
    /** When the current season ends (= when `next` starts). */
    end: string;
    endEstimated: boolean;
}

function nextCode(code: string): string {
    const m = /^Y(\d+)S(\d)$/.exec(code);
    if (!m) return code;
    const year = Number(m[1]);
    const season = Number(m[2]);
    return season >= 4 ? `Y${year + 1}S1` : `Y${year}S${season + 1}`;
}

function toSlot(s: Season): SeasonSlot {
    return { id: s.id, code: s.code, name: s.name, start: s.start, estimated: false, startApprox: !!s.startApprox };
}

function projectAfter(prev: SeasonSlot): SeasonSlot {
    return {
        code: nextCode(prev.code),
        start: new Date(new Date(prev.start).getTime() + SEASON_LENGTH_DAYS * DAY_MS).toISOString(),
        estimated: true,
        startApprox: true,
    };
}

/** Known seasons followed by as many projected ones as needed to cover `now`. */
function timeline(now: number): SeasonSlot[] {
    const slots = SEASONS.map(toSlot);
    // Always keep at least one season after `now`.
    while (new Date(slots[slots.length - 1].start).getTime() <= now) {
        slots.push(projectAfter(slots[slots.length - 1]));
    }
    return slots;
}

export function getSeasonState(now: number = Date.now()): SeasonState {
    const slots = timeline(now);
    let i = slots.length - 2;
    while (i > 0 && new Date(slots[i].start).getTime() > now) i--;
    const current = slots[i];
    const next = slots[i + 1];
    return { current, next, end: next.start, endEstimated: next.estimated };
}
