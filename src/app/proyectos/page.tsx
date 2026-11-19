import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { DocumentDownloadList } from '@/components/media/DocumentDownloadList';
import { MixedMediaShowcase } from '@/components/media/MixedMediaShowcase';
import { getPublicSiteContent } from '@/lib/content/queries';
import { isNextOptimizableImage, type GalleryMediaItem } from '@/lib/media/embeds';

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
    <div className="flex min-h-screen flex-col bg-cream text-ink">
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
                <span className="inline-block rounded-full border border-gold/50 bg-butter px-3.5 py-1 text-xs font-bold tracking-wider text-umber uppercase">
                  Procesos Vivos
                </span>
                <h1 className="mt-3 font-display text-3xl leading-tight font-bold text-espresso sm:text-5xl">
                  {intro.title}
                </h1>
                <p className="mt-5 text-base leading-relaxed text-earth sm:text-lg">
                  {intro.subtitle}
                </p>
                <Link
                  href="/#contacto"
                  className="mt-8 inline-flex items-center justify-center rounded-lg bg-umber px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-espresso"
                >
                  Colaborar con una iniciativa
                </Link>

                {(intro.mediaItems.length > 0 || intro.documents.length > 0) && (
                  <div className="mt-8 space-y-5">
                    {intro.mediaItems.length > 0 && (
                      <MixedMediaShowcase items={intro.mediaItems} />
                    )}
                    {intro.documents.length > 0 && (
                      <DocumentDownloadList documents={intro.documents} />
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:col-span-8">
                {projects.map((project, index) => {
                  const hasGallery = project.mediaItems.length > 0;
                  const aspectClass = index === 0 ? 'aspect-[16/9]' : 'aspect-[3/2]';
                  const showcaseItems: GalleryMediaItem[] = hasGallery
                    ? [
                        {
                          id: `cover-${project.id}`,
                          type: 'image',
                          url: project.imageUrl,
                          title: project.title,
                          alt: project.imageAlt,
                        },
                        ...project.mediaItems.filter(m => m.url !== project.imageUrl),
                      ]
                    : [];

                  return (
                    <article
                      key={project.slug}
                      id={project.slug}
                      className={`scroll-mt-28 overflow-hidden rounded-2xl border border-taupe bg-surface shadow-xs transition-shadow hover:shadow-md ${
                        index === 0 ? 'sm:col-span-2' : ''
                      }`}
                    >
                      {hasGallery ? (
                        <div className="p-3 pb-0">
                          <MixedMediaShowcase
                            items={showcaseItems}
                            aspectClassName={aspectClass}
                          />
                        </div>
                      ) : (
                        <div
                          className={`relative w-full overflow-hidden bg-sand ${aspectClass}`}
                        >
                          <Image
                            src={project.imageUrl}
                            alt={project.imageAlt}
                            fill
                            unoptimized={!isNextOptimizableImage(project.imageUrl)}
                            sizes={
                              index === 0
                                ? '(max-width: 1024px) 100vw, 66vw'
                                : '(max-width: 640px) 100vw, 33vw'
                            }
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="space-y-4 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <h2 className="font-display text-xl leading-snug font-bold text-espresso sm:text-2xl">
                            {project.title}
                          </h2>
                          <span className="shrink-0 rounded-full border border-gold/50 bg-butter px-3 py-1 font-display text-sm font-bold text-umber">
                            {project.numberLabel}
                          </span>
                        </div>

                        {(project.description || project.summary) && (
                          <p className="text-base leading-relaxed text-earth">
                            {project.description || project.summary}
                          </p>
                        )}

                        {project.documents.length > 0 && (
                          <div className="pt-2">
                            <DocumentDownloadList
                              documents={project.documents}
                              heading="Documentos del proyecto"
                            />
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Impacto en Nuestras Comunidades (alto contraste sobre tierra tejida #3B2816) */}
        {impact?.isVisible && (
          <section className="grid grid-cols-1 border-t border-taupe lg:grid-cols-2">
            <div className="flex flex-col justify-center bg-espresso px-6 py-16 text-cream sm:px-12 lg:px-16 lg:py-24">
              <div className="mx-auto w-full max-w-lg lg:mx-0">
                <div aria-hidden="true" className="mb-5 h-1 w-16 rounded-full bg-gold" />
                <h2 className="font-display text-3xl leading-tight font-bold text-cream sm:text-5xl">
                  {impact.title}
                </h2>
                <ul className="mt-8 space-y-4">
                  {impact.items.map(item => (
                    <li
                      key={item}
                      className="flex items-center gap-3.5 rounded-xl border-l-4 border-l-gold bg-surface px-5 py-3.5 text-base font-semibold text-ink shadow-xs"
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

            <div className="flex flex-col items-center justify-center gap-8 bg-sand/70 px-6 py-16 sm:px-12 lg:py-24">
              {impact.imageUrl && (
                <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-surface ring-4 ring-gold/35 shadow-lg sm:h-88 sm:w-88 lg:h-[400px] lg:w-[400px]">
                  <Image
                    src={impact.imageUrl}
                    alt={impact.imageAlt || impact.title}
                    fill
                    unoptimized={!isNextOptimizableImage(impact.imageUrl)}
                    sizes="(max-width: 640px) 256px, 400px"
                    className="object-cover"
                  />
                </div>
              )}

              {(impact.mediaItems.length > 0 || impact.documents.length > 0) && (
                <div className="w-full max-w-lg space-y-5 rounded-2xl border border-taupe bg-surface p-5">
                  {impact.mediaItems.length > 0 && (
                    <MixedMediaShowcase items={impact.mediaItems} />
                  )}
                  {impact.documents.length > 0 && (
                    <DocumentDownloadList documents={impact.documents} />
                  )}
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
