import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 86400;

export default function sitemap(): MetadataRoute.Sitemap {
    const routes: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
        { path: '', priority: 1, changeFrequency: 'daily' },
        { path: '/updates', priority: 0.8, changeFrequency: 'weekly' },
        { path: '/history', priority: 0.7, changeFrequency: 'monthly' },
        { path: '/about', priority: 0.3, changeFrequency: 'yearly' },
        { path: '/contact', priority: 0.3, changeFrequency: 'yearly' },
        { path: '/legal/privacy', priority: 0.1, changeFrequency: 'yearly' },
        { path: '/legal/terms', priority: 0.1, changeFrequency: 'yearly' },
    ];

    return routes.flatMap(({ path, priority, changeFrequency }) =>
        routing.locales.map((locale) => ({
            url: `${SITE_URL}/${locale}${path}`,
            lastModified: new Date(),
            changeFrequency,
            priority,
            alternates: {
                languages: Object.fromEntries(routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`])),
            },
        }))
    );
}
