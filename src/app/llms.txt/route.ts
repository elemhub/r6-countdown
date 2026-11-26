import { getSchedule, getSeasonState, seasonSlug } from '@/data/seasons';
import { SITE_URL } from '@/lib/seo';

// Generated at build time; the scheduled rebuild keeps it current.
export const dynamic = 'force-static';

const fmt = (iso: string) =>
    new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));
const fmtTime = (iso: string) =>
    new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(new Date(iso));

export function GET() {
    const now = Date.now();
    const s = getSeasonState(now);
    const schedule = getSchedule(now, 2);
    const cur = `${s.current.code}${s.current.name ? ` (Operation ${s.current.name})` : ''}`;
    const nxt = `${s.next.code}${s.next.name ? ` (Operation ${s.next.name})` : ''}`;

    const rows = schedule
        .map((r) => `- [${r.code}${r.name ? ` – Operation ${r.name}` : ' – name not announced'}](${SITE_URL}/en/seasons/${seasonSlug(r.code)}): ${fmt(r.start)}${r.estimated ? ' (estimated)' : ''} to ${fmt(r.end)}${r.endEstimated ? ' (estimated)' : ''} [${r.status}]`)
        .join('\n');

    const body = `# R6 Countdown

> Live countdown and season tracker for Tom Clancy's Rainbow Six Siege: when the current season ends, when the next one starts, and what each season adds. Fan-made, not affiliated with Ubisoft.

## Current status (updated ${fmt(new Date(now).toISOString())})

- Current season: ${cur}, started ${fmt(s.current.start)}.
- Current season ends: ${fmt(s.end)}${s.endEstimated ? ' (estimate based on the ~91-day season cycle)' : `, around ${fmtTime(s.end)} UTC after server maintenance`}.
- Next season: ${nxt}, starting ${fmt(s.next.start)}${s.next.estimated ? ' (estimated)' : ''}.
- Rainbow Six Siege seasons last about 91 days (four per year). New seasons usually go live after a maintenance window that starts around 14:00 UTC (09:00 ET); Ubisoft confirms the exact time shortly before launch.

## Season schedule

${rows}

## Pages

- [Live countdown (English)](${SITE_URL}/en): countdown, quick answer, season schedule and FAQ.
- [Season updates](${SITE_URL}/en/updates): changes in the latest season.
- [Season history](${SITE_URL}/en/history): every Rainbow Six Siege season from Year 1 to today.
- Also available in Spanish (${SITE_URL}/es), French (${SITE_URL}/fr), German (${SITE_URL}/de) and Portuguese (${SITE_URL}/pt).

## Sources

Dates come from official Ubisoft announcements; dates marked "estimated" are projections from the 91-day season cycle and are updated when Ubisoft confirms them.
`;
    return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
