import type { Metadata, Viewport } from 'next';
import { Public_Sans, Syne } from 'next/font/google';
import { DEFAULT_SITE_SETTINGS } from '@/data/default-content';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-syne',
  display: 'swap',
});

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-public-sans',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const viewport: Viewport = {
  themeColor: '#3B2816',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: DEFAULT_SITE_SETTINGS.seoTitle,
    template: '%s | Corporación Tejer Paz',
  },
  description: DEFAULT_SITE_SETTINGS.seoDescription,
  icons: {
    icon: '/images/logo-corporacion-tejer-paz.png',
    apple: '/images/logo-corporacion-tejer-paz.png',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: DEFAULT_SITE_SETTINGS.organizationName,
    title: DEFAULT_SITE_SETTINGS.seoTitle,
    description: DEFAULT_SITE_SETTINGS.seoDescription,
    images: [
      {
        url: '/images/hero-banner-manos-tejiendo-paz.png',
        width: 1200,
        height: 630,
        alt: 'Corporación Tejer Paz',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_SITE_SETTINGS.seoTitle,
    description: DEFAULT_SITE_SETTINGS.seoDescription,
    images: ['/images/hero-banner-manos-tejiendo-paz.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${syne.variable} ${publicSans.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-cream font-sans text-espresso antialiased"
        suppressHydrationWarning
      >
        <a
          href="#contenido-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-espresso focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream"
        >
          Ir al contenido principal
        </a>
        {children}
      </body>
    </html>
  );
}
