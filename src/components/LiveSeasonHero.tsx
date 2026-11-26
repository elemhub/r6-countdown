"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Countdown } from "@/components/Countdown";
import { SeasonProgress } from "@/components/SeasonProgress";
import { getSeasonState, type SeasonSlot, type SeasonState } from "@/data/seasons";

/**
 * Hero block: season name, live countdown, progress bar and next-season cards.
 * The state is computed in the browser (and re-checked every 30 s), so the page
 * keeps working across season changes even if the site has not been rebuilt.
 */
export function LiveSeasonHero({ initialNow }: { initialNow: number }) {
    const t = useTranslations("Hero");
    const tCountdown = useTranslations("Countdown");
    const tProgress = useTranslations("Progress");
    const tNext = useTranslations("NextSeason");
    const tSeasons = useTranslations("Seasons");
    const locale = useLocale();

    const [state, setState] = useState<SeasonState>(() => getSeasonState(initialNow));
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const update = () => setState(getSeasonState(Date.now()));
        update();
        const id = setInterval(update, 30_000);
        return () => clearInterval(id);
    }, []);

    const { current, next, end, endEstimated } = state;
    // If the next season is already announced, it is the headline (people search for it).
    const headline: SeasonSlot = next.name ? next : current;

    const highlight = (s: SeasonSlot) =>
        s.id && tSeasons.has(`${s.id}.highlight`) ? tSeasons(`${s.id}.highlight`) : tNext("tba_details");

    const formatDate = (iso: string, withTime: boolean) =>
        new Intl.DateTimeFormat(locale, withTime
            ? { dateStyle: "long", timeStyle: "short" }
            : { dateStyle: "long" }
        ).format(new Date(iso));

    const nextDateLabel = () => {
        if (next.estimated) return `${formatDate(next.start, false)} (${tNext("estimated")})`;
        if (next.startApprox) return `${formatDate(next.start, false)}`;
        return formatDate(next.start, true);
    };

    const subheader = next.name
        ? t("launches_in", { name: next.name })
        : endEstimated
            ? t("ends_in_estimated")
            : t("ends_in");

    return (
        <>
            <div className="space-y-6 mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-r6-orange/30 bg-r6-orange/10 text-r6-orange text-sm font-semibold tracking-wide uppercase shadow-[0_0_20px_rgba(255,85,0,0.15)]">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-r6-orange opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-r6-orange"></span>
                    </span>
                    {t("status_badge")} · {headline.code}
                </div>

                <div>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl mb-2 uppercase">
                        <span className="block text-base md:text-xl font-semibold tracking-[0.3em] text-gray-400 mb-3">
                            Rainbow Six Siege
                        </span>
                        {t("header_prefix")}{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-r6-orange to-red-500">
                            {headline.name ?? headline.code}
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 font-light tracking-wide uppercase">
                        {subheader}
                    </p>
                </div>
            </div>

            <Countdown
                targetDate={end}
                className="scale-100 md:scale-110 mb-8"
                labels={{
                    days: tCountdown("days"),
                    hours: tCountdown("hours"),
                    minutes: tCountdown("minutes"),
                    seconds: tCountdown("seconds"),
                    expired_title: tCountdown("expired_title"),
                    expired_msg: tCountdown("expired_msg"),
                }}
            />

            <SeasonProgress
                startDate={current.start}
                endDate={end}
                labels={{
                    start: `${current.code} · ${tProgress("start")}`,
                    complete: tProgress("complete"),
                    end: tProgress("end"),
                }}
            />

            {(endEstimated || next.startApprox) && (
                <p className="mt-4 text-xs text-gray-500 max-w-xl">
                    {endEstimated ? tNext("estimate_note") : tNext("time_note")}
                </p>
            )}

            <div className="w-full max-w-3xl mt-12">
                <h2 className="text-left text-sm uppercase tracking-widest text-gray-400 font-bold mb-3">
                    {tNext("title")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm text-left">
                        <div className="text-r6-orange text-xs uppercase font-bold mb-1">{tNext("season_label")}</div>
                        <div className="text-white font-mono text-sm">
                            {next.code}{next.name ? ` · ${next.name}` : ` · ${tNext("tba")}`}
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm text-left">
                        <div className="text-r6-orange text-xs uppercase font-bold mb-1">{tNext("highlight_label")}</div>
                        <div className="text-white font-mono text-sm">{highlight(next)}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm text-left">
                        <div className="text-r6-orange text-xs uppercase font-bold mb-1">{tNext("date_label")}</div>
                        {/* Dates are rendered after mount so they use the visitor's own time zone. */}
                        <div className="text-white font-mono text-sm" suppressHydrationWarning>
                            {mounted ? nextDateLabel() : "—"}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
