export interface SiteSettingsData {
  organizationName: string;
  seoTitle: string;
  seoDescription: string;
  contactEmail: string;
  phones: string[];
  instagramHandle: string;
  instagramUrl: string;
  quoteText: string;
  footerCopyright: string;
  logoUrl: string;
  logoAlt: string;
}

export interface PageSectionData {
  key: string;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
  ctaPrimaryLabel: string | null;
  ctaPrimaryHref: string | null;
  ctaSecondaryLabel: string | null;
  ctaSecondaryHref: string | null;
  items: string[];
  isVisible: boolean;
}

export interface ActionAreaData {
  id: number;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProjectItemData {
  id: number;
  slug: string;
  numberLabel: string;
  title: string;
  summary: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  sortOrder: number;
  isPublished: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  organizationName: 'Corporación Tejer Paz',
  seoTitle: 'Corporación Tejer Paz | Construyendo Paz y Reconciliación',
  seoDescription:
    'Organización nacida del impulso juvenil del suroccidente colombiano que promueve la construcción de paz, la defensa de los derechos humanos y la protección integral de la vida en los territorios.',
  contactEmail: 'coorp.tejerpaz@gmail.com',
  phones: ['301 3617133', '301 6279744'],
  instagramHandle: '@corp.tejepaz',
  instagramUrl: 'https://www.instagram.com/corp.tejepaz/',
  quoteText:
    '“La paz es el tejido que nos une, la reconciliación es el hilo que nos sostiene y el fortalecimiento social es el tejido que nos sostiene.”',
  footerCopyright: '© 2026 Corporación Tejer Paz. Todos los derechos reservados.',
  logoUrl: '/images/logo-corporacion-tejer-paz.png',
  logoAlt: 'Logotipo de la Corporación Tejer Paz',
};

export const DEFAULT_PAGE_SECTIONS: Record<string, PageSectionData> = {
  hero: {
    key: 'hero',
    title: 'Construyendo Paz y Reconciliación',
    subtitle:
      'Impulsamos el tejido social a través de proyectos integradores que fortalecen comunidades en zonas de conflicto.',
    body: '',
    imageUrl: '/images/hero-banner-manos-tejiendo-paz.png',
    imageAlt:
      'Manos tejiendo un telar tradicional bajo el emblema de la Corporación Tejer Paz',
    ctaPrimaryLabel: 'Nuestros Proyectos',
    ctaPrimaryHref: '/proyectos',
    ctaSecondaryLabel: 'Conoce Nuestra Misión',
    ctaSecondaryHref: '#nuestra-mision',
    items: [],
    isVisible: true,
  },
  mission: {
    key: 'mission',
    title: 'Nuestra Misión',
    subtitle: '',
    body: 'La Corporación Tejer Paz es una organización nacida del impulso juvenil del suroccidente colombiano y otras regiones del país que promueve la construcción de paz, la defensa de los derechos humanos y la protección integral de la vida en los territorios. Desde el reconocimiento de las juventudes como sujetos políticos, culturales y comunitarios, articulamos capacidades con autoridades tradicionales, organizaciones sociales y comunidades para fortalecer redes intergeneracionales de cuidado, procesos organizativos propios y mecanismos colectivos de autoprotección frente a las diversas expresiones de violencia y el reclutamiento forzado. Integramos los saberes comunitarios, la investigación participativa, la expresión cultural, la sanación psicosocial-espiritual y las tecnologías digitales para tejer posibilidades de vida digna, permanencia y pervivencia territorial.',
    imageUrl: null,
    imageAlt: null,
    ctaPrimaryLabel: null,
    ctaPrimaryHref: null,
    ctaSecondaryLabel: null,
    ctaSecondaryHref: null,
    items: [],
    isVisible: true,
  },
  community_impact: {
    key: 'community_impact',
    title: 'Impacto Comunitario',
    subtitle: '',
    body: 'Reconocemos a las juventudes como sujetos políticos, culturales y comunitarios con capacidad para transformar sus territorios, fortalecer redes de cuidado y participar activamente en la construcción de paz.',
    imageUrl: '/images/fondo-impacto-comunitario-montanas-niebla.jpg',
    imageAlt:
      'Montañas boscosas con niebla representando los territorios del suroccidente colombiano',
    ctaPrimaryLabel: null,
    ctaPrimaryHref: null,
    ctaSecondaryLabel: null,
    ctaSecondaryHref: null,
    items: [],
    isVisible: true,
  },
  contact_intro: {
    key: 'contact_intro',
    title: 'Conectemos para la Paz',
    subtitle:
      'Estamos comprometidos con el fortalecimiento del tejido social. Si deseas colaborar o tener una consulta sobre nuestros proyectos, estamos aquí para escucharte.',
    body: '',
    imageUrl: null,
    imageAlt: null,
    ctaPrimaryLabel: null,
    ctaPrimaryHref: null,
    ctaSecondaryLabel: null,
    ctaSecondaryHref: null,
    items: [],
    isVisible: true,
  },
  projects_intro: {
    key: 'projects_intro',
    title: 'Iniciativas Actuales',
    subtitle:
      'Impulsamos proyectos sociales, artísticos y educativos que fortalecen el tejido social y promueven la reconciliación en cada comunidad.',
    body: '',
    imageUrl: null,
    imageAlt: null,
    ctaPrimaryLabel: null,
    ctaPrimaryHref: null,
    ctaSecondaryLabel: null,
    ctaSecondaryHref: null,
    items: [],
    isVisible: true,
  },
  projects_impact: {
    key: 'projects_impact',
    title: 'Impacto en Nuestras Comunidades',
    subtitle: '',
    body: '',
    imageUrl: '/images/impacto-comunidad-retrato-grupal.jpg',
    imageAlt:
      'Retrato grupal de liderazgos, familias, niñez y juventudes de las comunidades acompañadas',
    ctaPrimaryLabel: null,
    ctaPrimaryHref: null,
    ctaSecondaryLabel: null,
    ctaSecondaryHref: null,
    items: ['Comunidades fortalecidas', 'Proyectos ejecutados', 'Participación activa'],
    isVisible: true,
  },
};

export const DEFAULT_ACTION_AREAS: ActionAreaData[] = [
  {
    id: 1,
    slug: 'juventudes-que-protegen',
    title: 'Juventudes que protegen',
    description: 'Estrategia comunitaria de prevención del reclutamiento.',
    imageUrl: '/images/area-juventudes-que-protegen-paloma-tejida.jpg',
    imageAlt:
      'Taller comunitario juvenil con paloma blanca tejida y palabras clave sobre tela azul',
    href: '/proyectos#escuchar-la-voz-de-los-jovenes',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 2,
    slug: 'activacion-rutas-ddhh-dih',
    title: 'Activación de rutas y acompañamiento en derechos humanos y DIH',
    description:
      'Acciones de acompañamiento territorial frente a casos de vulneración de derechos humanos e infracciones al Derecho Internacional Humanitario, fortaleciendo la identificación de riesgos, la activación de rutas de protección y el acompañamiento a comunidades y juventudes afectadas.',
    imageUrl: '/images/area-acompanamiento-derechos-humanos-dih-rio.jpg',
    imageAlt:
      'Acompañamiento territorial en lancha por el río junto a autoridades del Pueblo Awá y equipo Tejer Paz',
    href: '/proyectos#cultura-de-paz',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 3,
    slug: 'investigacion-produccion-conocimiento',
    title: 'Investigación y producción del conocimiento',
    description:
      'Tejer Paz desarrolla procesos de investigación y elaboración de informes de análisis orientados a comprender las dinámicas de violencia que afectan a las juventudes y aportar elementos para la construcción de respuestas de protección y paz territorial.',
    imageUrl: '/images/area-investigacion-conocimiento-diccionario-awapit.jpg',
    imageAlt:
      'Página de diccionario bilingüe Awapit-Español utilizada en procesos de investigación comunitaria',
    href: '/proyectos#dialogos-intergeneracionales',
    sortOrder: 3,
    isActive: true,
  },
];

export const DEFAULT_PROJECTS: ProjectItemData[] = [
  {
    id: 1,
    slug: 'escuchar-la-voz-de-los-jovenes',
    numberLabel: '01',
    title: 'Escuchar la voz de los jóvenes',
    summary: 'Fomentar espacios protectores a partir del diálogo.',
    description:
      'Fomentar espacios protectores a partir del diálogo territorial, fortaleciendo la participación juvenil y la escucha activa en comunidad.',
    imageUrl: '/images/proyecto-01-escuchar-voz-jovenes.jpg',
    imageAlt:
      'Encuentro de diálogo comunitario escuchando la voz de jóvenes en territorio rural',
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: 2,
    slug: 'cultura-de-paz',
    numberLabel: '02',
    title: 'Cultura de paz',
    summary: 'Proyectos enfocados a la cultura de paz.',
    description:
      'Proyectos enfocados a la cultura de paz, la expresión artística, la amistad y el cuidado colectivo con niñez y juventudes.',
    imageUrl: '/images/proyecto-02-cultura-de-paz-amistad.jpg',
    imageAlt:
      'Niñas participando en jornada de cultura de paz sosteniendo un cartel con la palabra Amistad',
    sortOrder: 2,
    isPublished: true,
  },
  {
    id: 3,
    slug: 'dialogos-intergeneracionales',
    numberLabel: '03',
    title: 'Diálogos intergeneracionales',
    summary: 'Encuentros comunitarios de memoria, saberes y cuidado entre generaciones.',
    description:
      'Espacios de articulación entre mayores, liderazgos tradicionales y juventudes para preservar la memoria histórica y tejer estrategias de autoprotección territorial.',
    imageUrl: '/images/proyecto-03-dialogos-intergeneracionales.jpg',
    imageAlt:
      'Mesa de diálogo intergeneracional comunitario acompañada de ejercicios de memoria histórica',
    sortOrder: 3,
    isPublished: true,
  },
];
