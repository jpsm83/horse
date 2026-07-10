import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { routing } from '@/i18n/routing';

export default async function RootPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Parse Accept-Language header to get preferred language
  let preferredLocale = routing.defaultLocale;
  
  if (acceptLanguage) {
    // Extract language codes from Accept-Language header
    const languages = acceptLanguage
      .split(',')
      .map((lang: string) => lang.split(';')[0].trim().substring(0, 2))
      .filter((lang: string) => routing.locales.includes(lang as typeof routing.locales[number]));
    
    if (languages.length > 0) {
      preferredLocale = languages[0] as typeof routing.defaultLocale;
    }
  }
  
  // Ensure we always redirect to a valid locale
  if (!routing.locales.includes(preferredLocale as typeof routing.locales[number])) {
    preferredLocale = routing.defaultLocale;
  }
  
  // Force redirect to the preferred locale
  redirect(`/${preferredLocale}`);
}
