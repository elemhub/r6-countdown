"use client";

import { Countdown } from "@/components/Countdown";

/** Small wrapper so server pages can show a live countdown with a caption. */
export function SeasonCountdown({ targetDate, label, labels }: {
    targetDate: string;
    label: string;
    labels: { days: string; hours: string; minutes: string; seconds: string; expired_title: string; expired_msg: string };
}) {
    return (
        <div className="flex flex-col items-center gap-4">
            <p className="text-gray-400 uppercase tracking-widest text-sm">{label}</p>
            <Countdown targetDate={targetDate} labels={labels} />
        </div>
    );
}
