import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { getPublicSiteContent } from '@/lib/content/queries';

export const metadata: Metadata = {
  title: 'Proyectos e Iniciativas Actuales',
  description:
    'Conoce las iniciativas sociales, artísticas y educativas de Corporación Tejer Paz que fortalecen el tejido social y promueven la reconciliación.',
};

export default async function ProyectosPage() {
  const { settings, sections, projects } = await getPublicSiteContent();
  const intro = sections.projects_intro;
  const impact = sections.projects_impact;

  return (
    <div className="flex min-h-screen flex-col bg-cream text-espresso">
      <SiteHeader
        organizationName={settings.organizationName}
        logoUrl={settings.logoUrl}
        logoAlt={settings.logoAlt}
      />

      <main id="contenido-principal" className="flex-1">
        {/* Iniciativas Actuales */}
        {intro?.isVisible && (
          <section className="px-4 py-16 sm:px-6 md:py-24 lg:px-8">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
              <div className="lg:sticky lg:top-28 lg:col-span-4">
                <h1 className="font-display text-4xl leading-tight font-bold text-espresso sm:text-5xl">
                  {intro.title}
                </h1>
                <p className="mt-5 text-base leading-relaxed text-espresso/85 sm:text-lg">
                  {intro.subtitle}
                </p>
                <Link
                  href="/#contacto"
                  className="mt-8 inline-flex items-center justify-center rounded-lg bg-umber px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-espresso"
                >
                  Colaborar con una iniciativa
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:col-span-8">
                {projects.map((project, index) => (
                  <article
                    key={project.slug}
                    id={project.slug}
                    className={`scroll-mt-28 overflow-hidden rounded-2xl border border-taupe/60 bg-white/75 shadow-sm transition-shadow hover:shadow-md ${
                      index === 0 ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <div
                      className={`relative w-full overflow-hidden bg-sand ${
                        index === 0 ? 'aspect-[16/9]' : 'aspect-[3/2]'
                      }`}
                    >
                      <Image
                        src={project.imageUrl}
                        alt={project.imageAlt}
                        fill
                        sizes={
                          index === 0
                            ? '(max-width: 1024px) 100vw, 66vw'
                            : '(max-width: 640px) 100vw, 33vw'
                        }
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-baseline justify-between gap-4">
                        <h2 className="font-display text-xl leading-snug font-bold text-espresso sm:text-2xl">
                          {project.title}
                        </h2>
                        <span className="shrink-0 font-display text-lg font-bold text-umber">
                          {project.numberLabel}
                        </span>
                      </div>
                      {(project.description || project.summary) && (
                        <p className="mt-3 text-base leading-relaxed text-espresso/85">
                          {project.description || project.summary}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Impacto en Nuestras Comunidades (contraste WCAG AA sobre ocre con texto #2E241C) */}
        {impact?.isVisible && (
          <section className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex flex-col justify-center bg-ochre px-6 py-16 text-ink sm:px-12 lg:px-16 lg:py-24">
              <div className="mx-auto w-full max-w-lg lg:mx-0">
                <h2 className="font-display text-3xl leading-tight font-bold text-ink sm:text-5xl">
                  {impact.title}
                </h2>
                <ul className="mt-8 space-y-4">
                  {impact.items.map(item => (
                    <li
                      key={item}
                      className="flex items-center gap-3 rounded-xl bg-cream/85 px-5 py-3.5 text-base font-semibold text-ink shadow-xs"
                    >
                      <CheckCircle2
                        className="h-5 w-5 shrink-0 text-umber"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-center bg-cream px-6 py-16 sm:px-12 lg:py-24">
              {impact.imageUrl && (
                <div className="relative h-72 w-72 overflow-hidden rounded-full shadow-[0_20px_40px_rgba(35,61,46,0.14)] sm:h-96 sm:w-96 lg:h-[420px] lg:w-[420px]">
                  <Image
                    src={impact.imageUrl}
                    alt={impact.imageAlt || impact.title}
                    fill
                    sizes="(max-width: 640px) 288px, 420px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
