import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// Detect locale from Accept-Language header or fallback
export function detectLocale(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  
  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, quality] = lang.trim().split(';q=');
      return { code: code.trim().split('-')[0].toLowerCase(), quality: quality ? parseFloat(quality) : 1 };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { code } of languages) {
    if (locales.includes(code as Locale)) {
      return code as Locale;
    }
  }
  
  return defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  // Try cookie first, then requestLocale, then default
  let locale: string = defaultLocale;
  
  try {
    const { cookies, headers } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
    
    if (cookieLocale && locales.includes(cookieLocale as Locale)) {
      locale = cookieLocale;
    } else {
      const headerStore = await headers();
      const acceptLang = headerStore.get('accept-language');
      locale = detectLocale(acceptLang);
    }
  } catch {
    const requested = await requestLocale;
    if (requested && locales.includes(requested as Locale)) {
      locale = requested;
    }
  }
  
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../../messages/en.json`)).default;
  }

  return {
    locale,
    messages,
  };
});
