import { LiveSeasonHero } from "@/components/LiveSeasonHero";
import { SeasonFacts, getQuickAnswer } from "@/components/SeasonFacts";
import { getSeasonState } from "@/data/seasons";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { setRequestLocale, getTranslations } from 'next-intl/server';
import NextImage from 'next/image';
import { Link } from '@/i18n/routing';
import { SITE_URL, SITE_NAME, pageMetadata, plainText, formatSeasonDate } from '@/lib/seo';

// Season dates live in src/data/seasons.ts (the only place to edit each season).
// Regenerate the server HTML every hour so titles, structured data and the
// schedule table stay current without a redeploy.
export const revalidate = 3600;

// FAQ order on the page. q1 is answered with the live "quick answer".
const FAQ_KEYS = ['q1', 'q5', 'q2', 'q6', 'q3', 'q4'] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const season = getSeasonState(Date.now());
  const headline = season.next.name ? season.next : season.current;
  return pageMetadata(
    locale,
    '',
    t('title_live', { name: headline.name ?? headline.code, code: headline.code }),
    t('description'),
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tArticle = await getTranslations({ locale, namespace: 'Article' });
  const tFAQ = await getTranslations({ locale, namespace: 'FAQ' });
  const tLatestIntel = await getTranslations({ locale, namespace: 'LatestIntel' });

  // Server snapshot (refreshed hourly); the hero recomputes it live in the browser.
  const now = Date.now();
  const season = getSeasonState(now);
  const headline = season.next.name ? season.next : season.current;
  const quickAnswer = await getQuickAnswer(locale, now);
  const nextStart = formatSeasonDate(locale, season.next.start).date;

  const faqAnswer = (key: typeof FAQ_KEYS[number]): string => {
    if (key === 'q1') return quickAnswer;
    if (key === 'q5') {
      return tFAQ('a5', {
        code: season.next.code,
        name: season.next.name ?? 'none',
        date: nextStart,
        estimated: season.next.estimated ? 'yes' : 'no',
      });
    }
    return tFAQ.raw(key.replace('q', 'a')) as string;
  };
  const faqs = FAQ_KEYS.map((key) => ({ key, q: tFAQ(key), a: faqAnswer(key) }));

  const pageUrl = `${SITE_URL}/${locale}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        "url": SITE_URL,
        "name": SITE_NAME,
        "inLanguage": ["en", "es", "fr", "de", "pt"],
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        "url": pageUrl,
        "name": tArticle('title'),
        "description": quickAnswer,
        "inLanguage": locale,
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "dateModified": new Date(now).toISOString(),
        "about": { "@type": "VideoGame", "name": "Tom Clancy's Rainbow Six Siege", "publisher": { "@type": "Organization", "name": "Ubisoft" } },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        "mainEntity": faqs.map(({ q, a }) => ({
          "@type": "Question",
          "name": q,
          "acceptedAnswer": { "@type": "Answer", "text": plainText(a) },
        })),
      },
      {
        "@type": "Event",
        "name": season.next.name
          ? `Rainbow Six Siege ${season.next.code}: Operation ${season.next.name} launch`
          : `Rainbow Six Siege ${season.next.code} season start`,
        "startDate": season.end,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
        "location": { "@type": "VirtualLocation", "url": pageUrl },
        "organizer": { "@type": "Organization", "name": "Ubisoft", "url": "https://www.ubisoft.com" },
        "description": quickAnswer,
      },
    ]
  };

  return (
    <main className="flex-grow relative flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-r6-darker z-0" />
        <NextImage
          src="/bg.jpg"
          alt="Rainbow Six Background"
          fill
          priority
          className="object-cover object-center opacity-20"
          style={{ filter: 'grayscale(30%) contrast(1.2)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-r6-darker/60 via-transparent to-r6-darker/90 z-10" />
      </div>

      {/* Language Switcher */}
      <LanguageSwitcher />

      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto pt-6 px-4 gap-6 flex-grow">

        {/* Left Sidebar Ad (Desktop Only) */}
        <aside className="hidden lg:flex w-[160px] flex-col gap-4 sticky top-6 h-fit">
          <AdPlaceholder slot="sidebar-left" className="h-[600px] w-full" format="vertical" />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center">

          {/* Hero / Countdown Section */}
          <section className="w-full flex flex-col items-center justify-center p-6 pb-0 lg:pt-20 lg:pb-0 text-center">

            <LiveSeasonHero initialNow={now} />

            <div className="w-full max-w-3xl mt-8">
              <AdPlaceholder slot="top-banner" className="w-full" />
            </div>

            {/* Latest Intelligence Grid */}
            <div className="w-full max-w-5xl mt-10">
              <h2 className="text-2xl font-bold text-white mb-6 text-left border-l-4 border-r6-orange pl-4">
                {tLatestIntel('title')}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Card 1: Updates */}
                <Link href="/updates" className="group block bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-white/5 hover:border-r6-orange/50 transition-all text-left">
                  <div className="text-r6-orange/80 text-xs font-bold uppercase tracking-widest mb-2">{headline.code}</div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-r6-orange transition-colors">{tLatestIntel('card_1_title')}</h3>
                  <p className="text-gray-400 text-sm mb-4">{tLatestIntel('card_1_desc')}</p>
                  <div className="flex items-center text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                    {tLatestIntel('read_more')} &rarr;
                  </div>
                </Link>

                {/* Card 2: Leaks */}
                <Link href="/updates#year-12" className="group block bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-white/5 hover:border-r6-orange/50 transition-all text-left">
                  <div className="text-r6-orange/80 text-xs font-bold uppercase tracking-widest mb-2">YEAR 12</div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-r6-orange transition-colors">{tLatestIntel('card_2_title')}</h3>
                  <p className="text-gray-400 text-sm mb-4">{tLatestIntel('card_2_desc')}</p>
                  <div className="flex items-center text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                    {tLatestIntel('read_more')} &rarr;
                  </div>
                </Link>

                {/* Card 3: History */}
                <Link href="/history" className="group block bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-white/5 hover:border-r6-orange/50 transition-all text-left">
                  <div className="text-r6-orange/80 text-xs font-bold uppercase tracking-widest mb-2">ARCHIVE</div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-r6-orange transition-colors">{tLatestIntel('card_3_title')}</h3>
                  <p className="text-gray-400 text-sm mb-4">{tLatestIntel('card_3_desc')}</p>
                  <div className="flex items-center text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                    {tLatestIntel('read_more')} &rarr;
                  </div>
                </Link>
              </div>
            </div>

            {/* Quick answer + season schedule (server-rendered for search and AI engines) */}
            <SeasonFacts locale={locale} now={now} />

          </section>

          {/* SEO Article Section */}
          <section className="w-full max-w-4xl bg-black/40 backdrop-blur-sm border border-white/5 rounded-2xl p-8 md:p-12 mt-8 mb-8">
            <article className="prose prose-invert prose-lg max-w-none">
              <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-r6-orange pl-4">{tArticle('title')}</h2>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div>
                  <h3 className="text-r6-orange text-lg font-bold uppercase mb-2">{tArticle('completion_title')}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: tArticle.raw('completion_desc') }} />
                </div>
                <div>
                  <h3 className="text-r6-orange text-lg font-bold uppercase mb-2">{tArticle('next_title')}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: tArticle.raw('next_desc') }} />
                </div>
              </div>

              {/* FAQ Section for Rich Snippets */}
              <div className="space-y-4 mb-12">
                <h3 className="text-2xl font-bold text-white mb-4">{tFAQ('title')}</h3>

                {faqs.map(({ key, q, a }) => (
                  <details key={key} className="group bg-white/5 rounded-lg border border-white/5 open:bg-white/10 transition-all">
                    <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-white hover:text-r6-orange">
                      <h4 className="text-base font-medium">{q}</h4>
                      <span className="text-r6-orange transition group-open:rotate-180">▼</span>
                    </summary>
                    <div className="p-4 pt-0 text-gray-400 border-t border-white/5 mt-2">
                      <p dangerouslySetInnerHTML={{ __html: a }} />
                    </div>
                  </details>
                ))}
              </div>

              <div className="bg-r6-darker/50 p-6 rounded-lg border border-white/5">
                <h3 className="text-white text-lg font-bold mb-4">{tArticle('checklist_title')}</h3>
                <ul className="grid md:grid-cols-3 gap-4">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-2 h-2 bg-r6-orange rounded-full" />
                    {tArticle('checklist_1')}
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-2 h-2 bg-r6-orange rounded-full" />
                    {tArticle('checklist_2')}
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-2 h-2 bg-r6-orange rounded-full" />
                    {tArticle('checklist_3')}
                  </li>
                </ul>
              </div>
            </article>
          </section>

        </div>

        {/* Right Sidebar Ad (Desktop Only) */}
        <aside className="hidden lg:flex w-[160px] flex-col gap-4 sticky top-6 h-fit">
          <AdPlaceholder slot="sidebar-right" className="h-[600px] w-full" format="vertical" />
        </aside>

      </div>
    </main>
  );
}
