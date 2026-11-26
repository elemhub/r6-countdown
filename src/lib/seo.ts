import { routing } from '@/i18n/routing';

export const SITE_URL = 'https://r6countdown.com';
export const SITE_NAME = 'R6 Countdown';

const OG_LOCALES: Record<string, string> = { en: 'en_US', es: 'es_ES', fr: 'fr_FR', de: 'de_DE', pt: 'pt_BR' };

/** Canonical + hreflang alternates for one page in every locale. */
export function pageAlternates(locale: string, path = '') {
    const languages: Record<string, string> = {};
    for (const l of routing.locales) languages[l] = `/${l}${path}`;
    languages['x-default'] = `/${routing.defaultLocale}${path}`;
    return { canonical: `/${locale}${path}`, languages };
}

/** Standard metadata block (title, description, canonical, hreflang, Open Graph, Twitter). */
export function pageMetadata(locale: string, path: string, title: string, description: string) {
    return {
        title,
        description,
        alternates: pageAlternates(locale, path),
        openGraph: {
            title,
            description,
            url: `/${locale}${path}`,
            siteName: SITE_NAME,
            locale: OG_LOCALES[locale] ?? 'en_US',
            type: 'website' as const,
        },
        twitter: { card: 'summary_large_image' as const, title, description },
    };
}

/** Strip HTML tags for structured data. */
export function plainText(html: string) {
    return html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** Date and UTC time strings for a season boundary in a given locale. */
export function formatSeasonDate(locale: string, iso: string) {
    const d = new Date(iso);
    return {
        date: new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(d),
        time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false }).format(d),
    };
}
