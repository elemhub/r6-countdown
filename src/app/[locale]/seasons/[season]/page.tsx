import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getSeasonPages, seasonSlug, type ScheduledSeason } from '@/data/seasons';
import { SITE_URL, formatSeasonDate, pageMetadata, plainText } from '@/lib/seo';
import { SeasonCountdown } from '@/components/SeasonCountdown';
import { AdPlaceholder } from '@/components/AdPlaceholder';

export const dynamicParams = false;

export function generateStaticParams() {
    return getSeasonPages(Date.now()).map((s) => ({ season: seasonSlug(s.code) }));
}

function findSeason(slug: string) {
    const all = getSeasonPages(Date.now());
    const idx = all.findIndex((s) => seasonSlug(s.code) === slug);
    return idx === -1 ? null : { season: all[idx], prev: all[idx - 1], next: all[idx + 1] };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const durationDays = (s: ScheduledSeason) =>
    Math.round((new Date(s.end).getTime() - new Date(s.start).getTime()) / DAY_MS);

/** Builds every localized text of a season page (shared by metadata and page). */
async function seasonTexts(locale: string, s: ScheduledSeason) {
    const t = await getTranslations({ locale, namespace: 'SeasonPage' });
    const tHistory = await getTranslations({ locale, namespace: 'History' });
    const start = formatSeasonDate(locale, s.start);
    const end = formatSeasonDate(locale, s.end);
    const named = !!s.name;
    const title = named ? `Operation ${s.name} (${s.code})` : s.code;
    const params = {
        title,
        code: s.code,
        name: s.name ?? '',
        start: start.date,
        startTime: start.time,
        end: end.date,
        days: durationDays(s),
    };

    let summary: string;
    if (s.status === 'past') summary = t('summary_past', params);
    else if (s.status === 'live') summary = t(s.endEstimated ? 'summary_live_est' : 'summary_live', params);
    else if (named) summary = t(s.startApprox ? 'summary_upcoming_day' : 'summary_upcoming', params);
    else summary = t('summary_projected', params);

    const descKey = s.id ? `${s.id}_desc` : null;
    const highlights = descKey && tHistory.has(descKey)
        ? (tHistory(descKey) as string).split(/\.\s+|\.$/).map((x) => x.trim()).filter(Boolean)
        : [];

    const past = s.status === 'past';
    const started = s.status !== 'upcoming';
    const startA = started ? 'faq_start_a_past' : s.estimated ? 'faq_start_a_est' : s.startApprox ? 'faq_start_a_day' : 'faq_start_a';
    const endA = past ? 'faq_end_a_past' : s.endEstimated ? 'faq_end_a_est' : 'faq_end_a';
    const faqs = [
        { q: t(started ? 'faq_start_q_past' : 'faq_start_q', params), a: t(startA, params) },
        { q: t(past ? 'faq_end_q_past' : 'faq_end_q', params), a: t(endA, params) },
        named
            ? { q: t('faq_new_q', params), a: highlights.length ? `${highlights.join('. ')}.` : t('faq_new_a_pending', params) }
            : { q: t('faq_announced_q', params), a: t(s.code.endsWith('S1') ? 'faq_announced_a_s1' : 'faq_announced_a', params) },
    ];

    return {
        t,
        title,
        h1: named ? t('h1_named', params) : t('h1_projected', params),
        metaTitle: named ? t('meta_title_named', params) : t('meta_title_projected', params),
        metaDescription: `${summary} ${named ? '' : t('projected_note')}`.trim(),
        summary,
        highlights,
        faqs,
        start,
        end,
    };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; season: string }> }) {
    const { locale, season } = await params;
    const found = findSeason(season);
    if (!found) return {};
    const x = await seasonTexts(locale, found.season);
    return pageMetadata(locale, `/seasons/${season}`, x.metaTitle, x.metaDescription);
}

export default async function SeasonPage({ params }: { params: Promise<{ locale: string; season: string }> }) {
    const { locale, season: slug } = await params;
    setRequestLocale(locale);
    const found = findSeason(slug);
    if (!found) notFound();
    const { season: s, prev, next } = found;
    const x = await seasonTexts(locale, s);
    const { t } = x;
    const tCountdown = await getTranslations({ locale, namespace: 'Countdown' });
    const tSchedule = await getTranslations({ locale, namespace: 'Schedule' });
    const tHeader = await getTranslations({ locale, namespace: 'Header' });
    const pageUrl = `${SITE_URL}/${locale}/seasons/${slug}`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": tHeader('home'), "item": `${SITE_URL}/${locale}` },
                    { "@type": "ListItem", "position": 2, "name": tHeader('history'), "item": `${SITE_URL}/${locale}/history` },
                    { "@type": "ListItem", "position": 3, "name": x.title, "item": pageUrl },
                ],
            },
            {
                "@type": "Event",
                "name": `Rainbow Six Siege ${x.title}`,
                "startDate": s.start,
                "endDate": s.end,
                "eventStatus": "https://schema.org/EventScheduled",
                "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
                "location": { "@type": "VirtualLocation", "url": pageUrl },
                "organizer": { "@type": "Organization", "name": "Ubisoft", "url": "https://www.ubisoft.com" },
                "description": x.summary,
            },
            {
                "@type": "FAQPage",
                "mainEntity": x.faqs.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": plainText(f.a) } })),
            },
        ],
    };

    const target = s.status === 'live' ? s.end : s.status === 'upcoming' ? s.start : null;

    return (
        <main className="flex-grow flex flex-col items-center p-6 md:p-12 max-w-4xl mx-auto w-full">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <nav aria-label="Breadcrumb" className="w-full text-xs text-gray-500 mb-6">
                <Link href="/" className="hover:text-r6-orange">{tHeader('home')}</Link>
                {' / '}
                <Link href="/history" className="hover:text-r6-orange">{tHeader('history')}</Link>
                {' / '}
                <span className="text-gray-300">{s.code}</span>
            </nav>

            <header className="w-full text-center mb-10">
                <div className="inline-flex px-3 py-1 rounded-full border border-r6-orange/30 bg-r6-orange/10 text-r6-orange text-xs font-bold uppercase tracking-widest mb-4">
                    {tSchedule(s.status)}
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">{x.h1}</h1>
            </header>

            {target && (
                <SeasonCountdown
                    targetDate={target}
                    label={s.status === 'live' ? t('countdown_end') : t('countdown_start')}
                    labels={{
                        days: tCountdown('days'),
                        hours: tCountdown('hours'),
                        minutes: tCountdown('minutes'),
                        seconds: tCountdown('seconds'),
                        expired_title: tCountdown('expired_title'),
                        expired_msg: tCountdown('expired_msg'),
                    }}
                />
            )}

            <section className="w-full bg-r6-orange/10 border border-r6-orange/30 rounded-2xl p-6 md:p-8 mt-10">
                <h2 className="text-r6-orange text-sm font-bold uppercase tracking-widest mb-3">{t('summary_title')}</h2>
                <p className="text-white text-lg leading-relaxed">{x.summary}</p>
                {!s.name && <p className="text-gray-400 text-sm mt-3">{t('projected_note')}</p>}
            </section>

            <section className="w-full mt-8 bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-r6-orange pl-4">{t('facts_title')}</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><dt className="text-gray-500 uppercase text-xs">{tSchedule('season')}</dt><dd className="text-white font-mono">{s.code}</dd></div>
                    <div><dt className="text-gray-500 uppercase text-xs">{tSchedule('operation')}</dt><dd className="text-white">{s.name ? `Operation ${s.name}` : tSchedule('tba')}</dd></div>
                    <div><dt className="text-gray-500 uppercase text-xs">{tSchedule('start')}</dt><dd className="text-white">{x.start.date}{s.estimated ? ` (${tSchedule('estimated')})` : ''}</dd></div>
                    <div><dt className="text-gray-500 uppercase text-xs">{tSchedule('end')}</dt><dd className="text-white">{x.end.date}{s.endEstimated ? ` (${tSchedule('estimated')})` : ''}</dd></div>
                    <div><dt className="text-gray-500 uppercase text-xs">{t('duration')}</dt><dd className="text-white">{t('days', { days: durationDays(s) })}</dd></div>
                    <div><dt className="text-gray-500 uppercase text-xs">{tSchedule('status')}</dt><dd className="text-white">{tSchedule(s.status)}</dd></div>
                </dl>
            </section>

            {x.highlights.length > 0 && (
                <section className="w-full mt-8 bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-r6-orange pl-4">{t('new_title', { title: x.title })}</h2>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                        {x.highlights.map((h) => <li key={h}>{h}</li>)}
                    </ul>
                    {s.id === 'y11s4' && (
                        <Link href="/updates" className="inline-block mt-4 text-r6-orange font-bold text-sm hover:underline">{t('all_changes')} →</Link>
                    )}
                </section>
            )}

            <div className="w-full flex justify-center py-6">
                <AdPlaceholder slot="season-page" className="w-full" format="auto" />
            </div>

            <section className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-r6-orange pl-4">{t('faq_title')}</h2>
                <div className="space-y-4">
                    {x.faqs.map((f) => (
                        <div key={f.q}>
                            <h3 className="text-white font-semibold">{f.q}</h3>
                            <p className="text-gray-400 mt-1">{f.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            <nav className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-sm" aria-label={t('nav_label')}>
                <div>
                    {prev && (
                        <Link href={`/seasons/${seasonSlug(prev.code)}`} className="block bg-white/5 border border-white/10 rounded-lg p-4 hover:border-r6-orange/50">
                            <span className="text-gray-500 text-xs uppercase">← {t('prev')}</span>
                            <span className="block text-white">{prev.code}{prev.name ? ` · ${prev.name}` : ''}</span>
                        </Link>
                    )}
                </div>
                <Link href="/" className="block text-center bg-r6-orange/10 border border-r6-orange/30 rounded-lg p-4 hover:bg-r6-orange/20">
                    <span className="text-r6-orange font-bold">{t('back_countdown')}</span>
                </Link>
                <div>
                    {next && (
                        <Link href={`/seasons/${seasonSlug(next.code)}`} className="block text-right bg-white/5 border border-white/10 rounded-lg p-4 hover:border-r6-orange/50">
                            <span className="text-gray-500 text-xs uppercase">{t('next')} →</span>
                            <span className="block text-white">{next.code}{next.name ? ` · ${next.name}` : ''}</span>
                        </Link>
                    )}
                </div>
            </nav>
        </main>
    );
}
