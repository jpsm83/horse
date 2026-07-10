import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'pt', 'es', 'fr', 'de', 'it'],
 
  // Used when no locale matches
  defaultLocale: 'en',
  // Avoid redirecting "/" to "/en"; keep default locale prefix-less
  localePrefix: 'as-needed'
});