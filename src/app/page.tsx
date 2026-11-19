import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { getPublicSiteContent } from '@/lib/content/queries';

function formatTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('57')) return `tel:+${digits}`;
  return `tel:+57${digits}`;
}

export default async function HomePage() {
  const { settings, sections, actionAreas } = await getPublicSiteContent();
  const hero = sections.hero;
  const mission = sections.mission;
  const communityImpact = sections.community_impact;
  const contactIntro = sections.contact_intro;

  return (
    <div className="flex min-h-screen flex-col bg-cream text-espresso">
      <SiteHeader
        organizationName={settings.organizationName}
        logoUrl={settings.logoUrl}
        logoAlt={settings.logoAlt}
      />

      <main id="contenido-principal" className="flex-1">
        {/* Hero */}
        {hero?.isVisible && (
          <section className="bg-espresso text-cream">
            {hero.imageUrl && (
              <div className="relative h-56 w-full overflow-hidden bg-espresso sm:h-72 md:h-96 lg:h-[460px]">
                <Image
                  src={hero.imageUrl}
                  alt={hero.imageAlt || settings.organizationName}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-espresso/20 via-transparent to-espresso/80" />
              </div>
            )}

            <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 md:py-20 lg:px-8">
              <h1 className="font-display text-4xl leading-[1.08] font-bold tracking-wide text-cream sm:text-5xl md:text-6xl lg:text-7xl">
                {hero.title}
              </h1>
              {hero.subtitle && (
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream/90 sm:text-xl">
                  {hero.subtitle}
                </p>
              )}

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                {hero.ctaPrimaryLabel && hero.ctaPrimaryHref && (
                  <Link
                    href={hero.ctaPrimaryHref}
                    className="inline-flex min-w-[210px] items-center justify-center rounded-lg bg-umber px-7 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-ochre hover:text-ink"
                  >
                    {hero.ctaPrimaryLabel}
                  </Link>
                )}
                {hero.ctaSecondaryLabel && hero.ctaSecondaryHref && (
                  <Link
                    href={hero.ctaSecondaryHref}
                    className="inline-flex min-w-[210px] items-center justify-center rounded-lg border border-cream/80 bg-cream px-7 py-3.5 text-sm font-semibold text-espresso transition-colors hover:bg-butter"
                  >
                    {hero.ctaSecondaryLabel}
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Nuestra Misión (ancla fija #nuestra-mision) */}
        {mission?.isVisible && (
          <section
            id="nuestra-mision"
            className="scroll-mt-24 px-4 py-16 sm:px-6 md:py-24 lg:px-8"
          >
            <div className="mx-auto max-w-5xl">
              <h2 className="text-center font-display text-3xl leading-tight font-bold text-espresso sm:text-5xl">
                {mission.title}
              </h2>
              <div className="mt-10 rounded-[36px] bg-gold px-6 py-10 text-center shadow-sm sm:px-12 sm:py-14">
                <p className="mx-auto max-w-4xl text-base leading-relaxed text-ink sm:text-lg md:text-xl">
                  {mission.body}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Nuestras Áreas de Acción */}
        <section
          aria-labelledby="areas-de-accion-heading"
          className="px-4 py-16 sm:px-6 md:py-24 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <h2
              id="areas-de-accion-heading"
              className="mx-auto max-w-2xl text-center font-display text-3xl leading-tight font-bold text-espresso sm:text-5xl"
            >
              Nuestras Áreas de Acción
            </h2>

            <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-3">
              {actionAreas.map(area => (
                <article
                  key={area.slug}
                  className="flex flex-col items-center text-center"
                >
                  <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-sand shadow-md">
                    <Image
                      src={area.imageUrl}
                      alt={area.imageAlt}
                      fill
                      sizes="256px"
                      className="object-cover"
                    />
                  </div>
                  <h3 className="mt-7 font-display text-xl leading-snug font-bold text-espresso sm:text-2xl">
                    {area.title}
                  </h3>
                  <p className="mt-3 flex-1 text-base leading-relaxed text-espresso/85">
                    {area.description}
                  </p>
                  <Link
                    href={area.href}
                    className="mt-6 inline-flex items-center justify-center rounded-lg border border-umber bg-cream px-7 py-2.5 text-sm font-semibold text-espresso transition-colors hover:bg-umber hover:text-cream"
                  >
                    Saber más
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Impacto Comunitario */}
        {communityImpact?.isVisible && (
          <section className="relative isolate overflow-hidden bg-espresso py-24 text-cream sm:py-32">
            {communityImpact.imageUrl && (
              <Image
                src={communityImpact.imageUrl}
                alt={communityImpact.imageAlt || communityImpact.title}
                fill
                sizes="100vw"
                className="-z-10 object-cover opacity-55"
              />
            )}
            <div className="absolute inset-0 -z-10 bg-espresso/45" />
            <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
              <h2 className="font-display text-3xl leading-tight font-bold text-cream sm:text-5xl">
                {communityImpact.title}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-cream/95 sm:text-xl">
                {communityImpact.body}
              </p>
            </div>
          </section>
        )}

        {/* Contacto Híbrido (Formulario + Correo/Teléfonos clicables) */}
        {contactIntro?.isVisible && (
          <section
            id="contacto"
            className="scroll-mt-24 px-4 py-16 sm:px-6 md:py-24 lg:px-8"
          >
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5">
                <h2 className="font-display text-3xl leading-tight font-bold text-espresso sm:text-5xl">
                  {contactIntro.title}
                </h2>
                <p className="mt-5 text-base leading-relaxed text-espresso/85 sm:text-lg">
                  {contactIntro.subtitle}
                </p>

                <div className="mt-8 space-y-4 rounded-2xl border border-taupe/70 bg-sand/60 p-6">
                  <div className="flex items-start gap-3">
                    <Mail
                      className="mt-0.5 h-5 w-5 shrink-0 text-umber"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-espresso/90 uppercase">
                        Correo electrónico directo
                      </p>
                      <a
                        href={`mailto:${settings.contactEmail}`}
                        className="mt-0.5 inline-block text-base font-medium text-espresso underline decoration-umber/60 underline-offset-4 hover:text-umber"
                      >
                        {settings.contactEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone
                      className="mt-0.5 h-5 w-5 shrink-0 text-umber"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-espresso/90 uppercase">
                        Teléfonos de contacto
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1">
                        {settings.phones.map(phone => (
                          <a
                            key={phone}
                            href={formatTelHref(phone)}
                            className="text-base font-medium text-espresso underline decoration-umber/60 underline-offset-4 hover:text-umber"
                          >
                            {phone}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-taupe/70 bg-sand/35 p-6 sm:p-8 lg:col-span-7">
                <ContactForm />
              </div>
            </div>
          </section>
        )}

        {/* Franja de cita institucional */}
        <section className="bg-butter px-4 py-12 sm:px-6 lg:px-8">
          <blockquote className="mx-auto max-w-4xl text-center text-base leading-relaxed text-ink italic sm:text-lg">
            {settings.quoteText}
          </blockquote>
        </section>
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
