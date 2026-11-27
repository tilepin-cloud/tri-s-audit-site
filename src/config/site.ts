/**
 * Firm-wide facts and switches. Edit here, never in templates.
 * Names, address and registry data follow the letterhead (logo/src/letterhead.py in the methodology repo)
 * and the auditor registry. The firm has worked since 2002; the registry number is not published (owner, 27.11.2026).
 */
export type Lang = 'ru' | 'en' | 'uz';
export const LANGS: Lang[] = ['ru', 'en', 'uz'];
export const DEFAULT_LANG: Lang = 'ru';

/** BCP 47 tags for <html lang>, hreflang and JSON-LD inLanguage. Uzbek is published in Latin script. */
export const LANG_TAG: Record<Lang, string> = { ru: 'ru', en: 'en', uz: 'uz-Latn' };
export const LANG_NAME: Record<Lang, string> = { ru: 'Русский', en: 'English', uz: 'Oʻzbek' };
export const LANG_LOCALE: Record<Lang, string> = { ru: 'ru-RU', en: 'en-GB', uz: 'uz-Latn-UZ' };

export const SITE_URL = (import.meta.env.SITE as string | undefined) ?? 'https://tri-s-audit.uz';

export const firm = {
  shortName: 'TRI-S-AUDIT',
  legalName: {
    ru: 'Аудиторская организация «TRI-S-AUDIT» в форме ООО',
    en: 'TRI-S-AUDIT LLC, audit organisation', // [TBC] official English name — owner
    uz: '«TRI-S-AUDIT» MChJ auditorlik tashkiloti', // [TBC] official Uzbek name — owner
  },
  foundedYear: 2002,
  registry: {
    ru: 'Включена в реестр аудиторских организаций Министерства финансов Республики Узбекистан',
    en: 'Entered in the register of audit organisations of the Ministry of Finance of the Republic of Uzbekistan',
    uz: 'Oʻzbekiston Respublikasi Moliya vazirligining auditorlik tashkilotlari reestriga kiritilgan',
  },
  taxId: '204722723',
  address: {
    ru: '100060, г. Ташкент, Мирабадский район, ул. Т. Шевченко, 28',
    en: '28 T. Shevchenko St., Mirabad district, Tashkent 100060, Uzbekistan',
    uz: '100060, Toshkent sh., Mirobod tumani, T. Shevchenko koʻchasi, 28',
  },
  addressParts: { street: 'ул. Т. Шевченко, 28', city: 'Ташкент', postal: '100060', country: 'UZ' },
  email: 'info@tri-s-audit.uz',
  phone: '+998 78 140 77 85',
  phoneHref: 'tel:+998781407785',
  mapUrl: 'https://maps.google.com/?q=Tashkent,+Shevchenko+28',
  /** Social channels. Empty string hides the link everywhere (header, footer, share, sameAs). */
  social: {
    telegram: 'https://t.me/trisaudit', // [TBC] channel handle — owner
    linkedin: 'https://www.linkedin.com/company/tri-s-audit', // [TBC] — owner
    facebook: '',
    instagram: '',
    youtube: '',
  },
  /** Which share targets a post offers, in order. */
  shareTargets: ['telegram', 'linkedin', 'copy'] as const,
};

/** Services shown on the home page and in the footer, in this order (keys of src/content/services/<lang>/). */
export const HOME_SERVICES = ['audit', 'tax', 'ifrs', 'forensic', 'review', 'agreed-upon-procedures'] as const;

/** Blog rubrics. The slug is language-independent and appears in URLs: /ru/blog/rubric/audit/ */
export const RUBRICS = {
  audit: { ru: 'Аудит и МСА', en: 'Audit and ISA', uz: 'Audit va XAS' },
  ifrs: { ru: 'МСФО и НСБУ', en: 'IFRS and NAS', uz: 'MHXS va BHMS' },
  tax: { ru: 'Налоги', en: 'Tax', uz: 'Soliq' },
  ai: { ru: 'Современные технологии', en: 'Technology', uz: 'Zamonaviy texnologiyalar' },
  firm: { ru: 'Новости фирмы', en: 'Firm news', uz: 'Firma yangiliklari' },
} as const;
export type Rubric = keyof typeof RUBRICS;
export const RUBRIC_KEYS = Object.keys(RUBRICS) as Rubric[];

/** Document categories for the Documents section. */
export const DOC_CATEGORIES = {
  quality: { ru: 'Система качества', en: 'Quality management', uz: 'Sifat tizimi' },
  legal: { ru: 'Регистрация и лицензии', en: 'Registration and licences', uz: 'Roʻyxat va litsenziyalar' },
  policy: { ru: 'Политики', en: 'Policies', uz: 'Siyosatlar' },
  publication: { ru: 'Публикации', en: 'Publications', uz: 'Nashrlar' },
} as const;
export type DocCategory = keyof typeof DOC_CATEGORIES;

/** Crawlers explicitly welcomed in robots.txt. Order is cosmetic. */
export const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'GoogleOther', 'Applebot-Extended',
  'Bingbot', 'YandexBot', 'DuckDuckBot', 'CCBot',
];
