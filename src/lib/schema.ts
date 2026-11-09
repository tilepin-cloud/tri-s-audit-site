/**
 * schema.org builders. Everything carries an @id so Organization, Person and Article link into one graph,
 * which is what search engines and answer engines use to resolve "who wrote this" and "who is this firm".
 */
import { firm, LANG_TAG, SITE_URL, type Lang } from '@/config/site';

const site = SITE_URL.replace(/\/$/, '');
export const ORG_ID = `${site}/#organization`;
export const SITE_ID = `${site}/#website`;

export function organization(lang: Lang) {
  const sameAs = Object.values(firm.social).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'ProfessionalService', 'AccountingService'],
    '@id': ORG_ID,
    name: firm.shortName,
    legalName: firm.legalName[lang],
    url: `${site}/${lang}/`,
    logo: { '@type': 'ImageObject', url: `${site}/logo.png`, width: 1200, height: 270 },
    image: `${site}/og/default.png`,
    foundingDate: String(firm.foundedYear),
    email: firm.email,
    telephone: firm.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: firm.addressParts.street,
      addressLocality: firm.addressParts.city,
      postalCode: firm.addressParts.postal,
      addressCountry: firm.addressParts.country,
    },
    areaServed: { '@type': 'Country', name: 'Uzbekistan' },
    identifier: {
      '@type': 'PropertyValue',
      propertyID: lang === 'ru' ? 'Реестр аудиторских организаций Минфина РУз' : 'Register of audit organisations, Ministry of Finance of Uzbekistan',
      value: firm.registryNumber,
    },
    taxID: firm.taxId,
    knowsLanguage: ['ru', 'en', 'uz'],
    sameAs,
  };
}

export function website(lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: `${site}/`,
    name: firm.shortName,
    inLanguage: Object.values(LANG_TAG),
    publisher: { '@id': ORG_ID },
  };
}

export function person(lang: Lang, m: { key: string; name: string; role: string; url: string; image?: string; linkedin?: string; credentials?: string[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${site}/${lang}/team/${m.key}/#person`,
    name: m.name,
    jobTitle: m.role,
    url: m.url,
    image: m.image,
    worksFor: { '@id': ORG_ID },
    sameAs: m.linkedin ? [m.linkedin] : undefined,
    hasCredential: m.credentials?.map((c) => ({ '@type': 'EducationalOccupationalCredential', name: c })),
  };
}

export function article(lang: Lang, a: { url: string; title: string; description: string; published: Date; updated?: Date; image: string; authorName: string; authorUrl: string; authorKey: string; section: string; keywords: string[]; wordCount?: number; mdUrl?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${a.url}#article`,
    mainEntityOfPage: a.url,
    url: a.url,
    headline: a.title,
    description: a.description,
    inLanguage: LANG_TAG[lang],
    datePublished: a.published.toISOString(),
    dateModified: (a.updated ?? a.published).toISOString(),
    image: a.image,
    author: { '@type': 'Person', '@id': `${site}/${lang}/team/${a.authorKey}/#person`, name: a.authorName, url: a.authorUrl },
    publisher: { '@id': ORG_ID },
    articleSection: a.section,
    keywords: a.keywords.join(', '),
    wordCount: a.wordCount,
    isAccessibleForFree: true,
    encoding: a.mdUrl ? [{ '@type': 'MediaObject', encodingFormat: 'text/markdown', contentUrl: a.mdUrl }] : undefined,
  };
}

export function service(lang: Lang, s: { url: string; name: string; description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${s.url}#service`,
    name: s.name,
    description: s.description,
    url: s.url,
    serviceType: s.name,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Uzbekistan' },
    availableLanguage: ['ru', 'en', 'uz'],
  };
}

export function faqPage(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  };
}

export function breadcrumbs(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}
