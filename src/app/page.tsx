import type { Metadata } from 'next';

// "/" sends visitors to their language (static export has no middleware).
export const metadata: Metadata = {
    title: 'R6 Countdown – Rainbow Six Siege Season Countdown',
    alternates: { canonical: 'https://r6countdown.com/en' },
    robots: { index: false, follow: true },
};

const LOCALES = ['en', 'es', 'fr', 'de', 'pt'];

const redirectScript = `(function(){var s=${JSON.stringify(LOCALES)};var l=((navigator.languages&&navigator.languages[0])||navigator.language||'en').slice(0,2).toLowerCase();location.replace('/'+(s.indexOf(l)>-1?l:'en'));})();`;

export default function RootPage() {
    return (
        <html lang="en">
            <head>
                <meta httpEquiv="refresh" content="1;url=/en" />
                <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
            </head>
            <body style={{ background: '#020617', color: '#fff', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '4rem' }}>
                <p>
                    <a href="/en">English</a> · <a href="/es">Español</a> · <a href="/fr">Français</a> · <a href="/de">Deutsch</a> · <a href="/pt">Português</a>
                </p>
            </body>
        </html>
    );
}
