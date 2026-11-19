import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Mail, Phone } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { DocumentDownloadList } from '@/components/media/DocumentDownloadList';
import { MixedMediaShowcase } from '@/components/media/MixedMediaShowcase';
import { getPublicSiteContent } from '@/lib/content/queries';
import { formatTelHref } from '@/lib/format';
import { isNextOptimizableImage } from '@/lib/media/embeds';

export default async function HomePage() {
  const { settings, sections, actionAreas } = await getPublicSiteContent();
  const hero = sections.hero;
  const mission = sections.mission;
  const communityImpact = sections.community_impact;
  const contactIntro = sections.contact_intro;

  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader
        organizationName={settings.organizationName}
        logoUrl={settings.logoUrl}
        logoAlt={settings.logoAlt}
        initialTone="dark"
      />

      <main id="contenido-principal" className="flex-1">
        {/* Hero */}
        {hero?.isVisible && (
          <section
            data-nav-theme="dark"
            className="bg-espresso pt-16 text-cream sm:pt-20"
          >
            {hero.imageUrl && (
              <div
                data-testid="hero-banner"
                className="relative mx-auto aspect-[45/17] w-full max-w-[1440px] overflow-hidden bg-espresso"
              >
                <Image
                  src={hero.imageUrl}
                  alt={hero.imageAlt || settings.organizationName}
                  fill
                  loading="eager"
                  unoptimized={!isNextOptimizableImage(hero.imageUrl)}
                  sizes="(max-width: 1440px) 100vw, 1440px"
                  className="object-contain object-center"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-espresso/60 to-transparent sm:h-12" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-espresso via-espresso/35 to-transparent sm:h-20" />
                <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-20 bg-gradient-to-r from-espresso to-transparent 2xl:block" />
                <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-20 bg-gradient-to-l from-espresso to-transparent 2xl:block" />
              </div>
            )}

            <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 md:py-20 lg:px-8">
              <div
                aria-hidden="true"
                className="mx-auto mb-6 h-1 w-20 rounded-full bg-gold"
              />
              <h1 className="font-display text-3xl leading-[1.08] font-bold tracking-wide text-cream sm:text-5xl md:text-6xl lg:text-7xl">
                {hero.title}
              </h1>
              {hero.subtitle && (
                <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream/90 sm:text-xl">
                  {hero.subtitle}
                </p>
              )}

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                {hero.ctaPrimaryLabel && hero.ctaPrimaryHref && (
                  <Link
                    href={hero.ctaPrimaryHref}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gold/50 bg-umber px-7 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-gold hover:text-ink sm:w-auto sm:min-w-[215px]"
                  >
                    <span>{hero.ctaPrimaryLabel}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
                {hero.ctaSecondaryLabel && hero.ctaSecondaryHref && (
                  <Link
                    href={hero.ctaSecondaryHref}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-cream/80 bg-cream px-7 py-3.5 text-sm font-semibold text-espresso transition-colors hover:bg-butter sm:w-auto sm:min-w-[215px]"
                  >
                    {hero.ctaSecondaryLabel}
                  </Link>
                )}
              </div>

              {(hero.mediaItems.length > 0 || hero.documents.length > 0) && (
                <div className="mx-auto mt-12 max-w-4xl space-y-6 rounded-2xl border border-taupe bg-surface p-5 text-left text-ink shadow-md sm:p-7">
                  {hero.mediaItems.length > 0 && (
                    <MixedMediaShowcase items={hero.mediaItems} />
                  )}
                  {hero.documents.length > 0 && (
                    <DocumentDownloadList documents={hero.documents} />
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Nuestra Misión (ancla fija #nuestra-mision) */}
        {mission?.isVisible && (
          <section
            id="nuestra-mision"
            data-nav-theme="light"
            className="scroll-mt-24 px-4 py-16 sm:px-6 md:py-24 lg:px-8"
          >
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <h2 className="font-display text-3xl leading-tight font-bold text-espresso sm:text-5xl">
                  {mission.title}
                </h2>
              </div>

              <div className="mt-10 rounded-[28px] border border-taupe border-t-4 border-t-gold bg-butter px-6 py-9 text-center shadow-xs sm:rounded-[36px] sm:px-12 sm:py-14">
                <p className="mx-auto max-w-4xl text-base leading-relaxed text-ink sm:text-lg md:text-xl">
                  {mission.body}
                </p>
              </div>

              {(mission.mediaItems.length > 0 || mission.documents.length > 0) && (
                <div className="mx-auto mt-8 max-w-4xl space-y-6 rounded-2xl border border-taupe bg-surface p-5 shadow-xs sm:p-7">
                  {mission.mediaItems.length > 0 && (
                    <MixedMediaShowcase items={mission.mediaItems} />
                  )}
                  {mission.documents.length > 0 && (
                    <DocumentDownloadList documents={mission.documents} />
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Nuestras Áreas de Acción (#areas) */}
        <section
          id="areas"
          data-nav-theme="light"
          aria-labelledby="areas-de-accion-heading"
          className="scroll-mt-24 border-y border-taupe/70 bg-sand/55 px-4 py-16 sm:px-6 md:py-24 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="areas-de-accion-heading"
                className="font-display text-3xl leading-tight font-bold text-espresso sm:text-5xl"
              >
                Nuestras Áreas de Acción
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {actionAreas.map(area => (
                <article
                  key={area.slug}
                  className="flex flex-col items-center rounded-2xl border border-taupe bg-surface p-6 text-center shadow-xs transition-shadow hover:shadow-md sm:p-7"
                >
                  <div className="relative h-52 w-52 overflow-hidden rounded-full border-4 border-butter ring-2 ring-gold/45 shadow-sm sm:h-56 sm:w-56">
                    <Image
                      src={area.imageUrl}
                      alt={area.imageAlt}
                      fill
                      unoptimized={!isNextOptimizableImage(area.imageUrl)}
                      sizes="224px"
                      className="object-cover"
                    />
                  </div>
                  <h3 className="mt-6 font-display text-xl leading-snug font-bold text-espresso sm:text-2xl">
                    {area.title}
                  </h3>
                  <p className="mt-3 flex-1 text-base leading-relaxed text-earth">
                    {area.description}
                  </p>
                  <Link
                    href={area.href}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-umber bg-cream px-6 py-2.5 text-sm font-semibold text-umber transition-colors hover:bg-umber hover:text-cream"
                  >
                    <span>Saber más</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Impacto Comunitario */}
        {communityImpact?.isVisible && (
          <section
            data-nav-theme="dark"
            className="relative isolate overflow-hidden bg-espresso py-20 text-cream sm:py-28"
          >
            {communityImpact.imageUrl && (
              <Image
                src={communityImpact.imageUrl}
                alt={communityImpact.imageAlt || communityImpact.title}
                fill
                unoptimized={!isNextOptimizableImage(communityImpact.imageUrl)}
                sizes="100vw"
                className="-z-10 object-cover opacity-45"
              />
            )}
            <div className="absolute inset-0 -z-10 bg-ink/55" />

            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
              <div
                aria-hidden="true"
                className="mx-auto mb-5 h-1 w-16 rounded-full bg-gold"
              />
              <h2 className="font-display text-3xl leading-tight font-bold text-cream sm:text-5xl">
                {communityImpact.title}
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-cream/95 sm:text-xl">
                {communityImpact.body}
              </p>

              {(communityImpact.mediaItems.length > 0 ||
                communityImpact.documents.length > 0) && (
                <div className="mt-10 space-y-6 rounded-2xl border border-taupe bg-surface p-5 text-left text-ink shadow-xl sm:p-7">
                  {communityImpact.mediaItems.length > 0 && (
                    <MixedMediaShowcase items={communityImpact.mediaItems} />
                  )}
                  {communityImpact.documents.length > 0 && (
                    <DocumentDownloadList documents={communityImpact.documents} />
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Contacto Híbrido (Formulario + Correo/Teléfonos clicables) */}
        {contactIntro?.isVisible && (
          <section
            id="contacto"
            data-nav-theme="light"
            className="scroll-mt-24 px-4 py-16 sm:px-6 md:py-24 lg:px-8"
          >
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5">
                <h2 className="font-display text-3xl leading-tight font-bold text-espresso sm:text-5xl">
                  {contactIntro.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-earth sm:text-lg">
                  {contactIntro.subtitle}
                </p>

                <div className="mt-8 space-y-5 rounded-2xl border border-taupe bg-surface p-6 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-butter text-umber">
                      <Mail className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold tracking-wider text-earth uppercase">
                        Correo electrónico directo
                      </p>
                      <a
                        href={`mailto:${settings.contactEmail}`}
                        className="mt-0.5 inline-block text-base font-semibold break-all text-espresso underline decoration-gold underline-offset-4 hover:text-umber"
                      >
                        {settings.contactEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-butter text-umber">
                      <Phone className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-bold tracking-wider text-earth uppercase">
                        Teléfonos de contacto
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1">
                        {settings.phones.map(phone => (
                          <a
                            key={phone}
                            href={formatTelHref(phone)}
                            className="text-base font-semibold text-espresso underline decoration-gold underline-offset-4 hover:text-umber"
                          >
                            {phone}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-taupe bg-surface p-6 shadow-xs sm:p-8 lg:col-span-7">
                <ContactForm />
              </div>
            </div>
          </section>
        )}

        {/* Franja de cita institucional */}
        <section
          data-nav-theme="light"
          className="border-y border-taupe bg-butter px-4 py-12 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-4xl text-center">
            <div
              aria-hidden="true"
              className="mx-auto mb-4 h-0.5 w-16 rounded-full bg-gold"
            />
            <blockquote className="text-base leading-relaxed font-medium text-ink italic sm:text-lg">
              {settings.quoteText}
            </blockquote>
          </div>
        </section>
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
