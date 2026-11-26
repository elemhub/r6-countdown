import { getTranslations } from 'next-intl/server';
import { getSchedule, getSeasonState } from '@/data/seasons';
import { formatSeasonDate } from '@/lib/seo';

/** Builds the one-paragraph "quick answer" (also reused in the FAQ and structured data). */
export async function getQuickAnswer(locale: string, now: number) {
    const t = await getTranslations({ locale, namespace: 'QuickAnswer' });
    const state = getSeasonState(now);
    const schedule = getSchedule(now, 2);
    const end = formatSeasonDate(locale, state.end);
    const nextRow = schedule.find((s) => s.code === state.next.code);
    const nextEnd = nextRow ? formatSeasonDate(locale, nextRow.end).date : '';
    const start = formatSeasonDate(locale, state.current.start).date;

    if (state.next.name) {
        return t('launch', {
            current: state.current.name ?? state.current.code,
            currentCode: state.current.code,
            next: state.next.name,
            nextCode: state.next.code,
            date: end.date,
            time: end.time,
            nextEnd,
        });
    }
    return t('current', {
        current: state.current.name ?? state.current.code,
        currentCode: state.current.code,
        start,
        date: end.date,
        nextCode: state.next.code,
        estimated: state.endEstimated ? 'yes' : 'no',
    });
}

/** Quick answer + season schedule table, rendered on the server so crawlers and AI engines can read them. */
export async function SeasonFacts({ locale, now }: { locale: string; now: number }) {
    const tQA = await getTranslations({ locale, namespace: 'QuickAnswer' });
    const t = await getTranslations({ locale, namespace: 'Schedule' });
    const answer = await getQuickAnswer(locale, now);
    const schedule = getSchedule(now, 1);
    const updated = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(now));

    return (
        <section className="w-full max-w-4xl mt-12 text-left" aria-labelledby="quick-answer">
            <div className="bg-r6-orange/10 border border-r6-orange/30 rounded-2xl p-6 md:p-8">
                <h2 id="quick-answer" className="text-r6-orange text-sm font-bold uppercase tracking-widest mb-3">
                    {tQA('title')}
                </h2>
                <p className="text-white text-lg leading-relaxed">{answer}</p>
                <p className="text-gray-500 text-xs mt-4">
                    {tQA('updated', { date: updated })}
                </p>
            </div>

            <div className="mt-8 bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8 overflow-x-auto">
                <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-r6-orange pl-4">{t('title')}</h2>
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-gray-400 border-b border-white/10">
                        <tr>
                            <th scope="col" className="py-2 pr-4">{t('season')}</th>
                            <th scope="col" className="py-2 pr-4">{t('operation')}</th>
                            <th scope="col" className="py-2 pr-4">{t('start')}</th>
                            <th scope="col" className="py-2 pr-4">{t('end')}</th>
                            <th scope="col" className="py-2">{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map((s) => (
                            <tr key={s.code} className={`border-b border-white/5 ${s.status === 'live' ? 'text-white font-semibold' : 'text-gray-300'}`}>
                                <td className="py-2 pr-4 font-mono">{s.code}</td>
                                <td className="py-2 pr-4">{s.name ? `Operation ${s.name}` : t('tba')}</td>
                                <td className="py-2 pr-4">
                                    {formatSeasonDate(locale, s.start).date}{s.estimated ? ` (${t('estimated')})` : ''}
                                </td>
                                <td className="py-2 pr-4">
                                    {formatSeasonDate(locale, s.end).date}{s.endEstimated ? ` (${t('estimated')})` : ''}
                                </td>
                                <td className="py-2">
                                    <span className={s.status === 'live' ? 'text-r6-orange' : ''}>{t(s.status)}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="text-gray-500 text-xs mt-4">{t('note')}</p>
            </div>
        </section>
    );
}
