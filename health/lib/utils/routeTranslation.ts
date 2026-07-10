import { mainCategories } from "@/lib/constants";

/**
 * Comprehensive route translations for all pages in the application
 * Includes categories and all other routes
 * Single source of truth for all route translations
 */

// Category translations - exported for use in canonical URLs and other utilities
// Single source of truth for all category translations
export const categoryTranslations = {
  health: { en: "health", pt: "saude", es: "salud", fr: "sante", de: "gesundheit", it: "salute" },
  fitness: { en: "fitness", pt: "fitness", es: "fitness", fr: "fitness", de: "fitness", it: "fitness" },
  nutrition: { en: "nutrition", pt: "nutricao", es: "nutricion", fr: "nutrition", de: "ernahrung", it: "nutrizione" },
  intimacy: { en: "intimacy", pt: "intimidade", es: "intimidad", fr: "intimite", de: "intimitat", it: "intimita" },
  beauty: { en: "beauty", pt: "beleza", es: "belleza", fr: "beaute", de: "schonheit", it: "bellezza" },
  "weight-loss": { en: "weight-loss", pt: "perda-de-peso", es: "perdida-de-peso", fr: "perte-de-poids", de: "gewichtsverlust", it: "perdita-di-peso" },
  life: { en: "life", pt: "vida", es: "vida", fr: "vie", de: "leben", it: "vita" },
} as const;

// Helper function to get category translation
// Exported for use in canonical URLs and other utilities
export function getCategoryTranslation(category: string, locale: string): string {
  const normalizedCategory = category.toLowerCase();
  const translations = categoryTranslations[normalizedCategory as keyof typeof categoryTranslations];
  if (!translations) {
    console.warn(`Category "${category}" not found in translations, using original`);
    return category;
  }
  return translations[locale as keyof typeof translations] || translations.en;
}

// Route translations for all other pages
const routeTranslations: Record<string, Record<string, string>> = {
  // User account routes
  profile: { en: "profile", pt: "perfil", es: "perfil", fr: "profil", de: "profil", it: "profilo" },
  favorites: { en: "favorites", pt: "favoritos", es: "favoritos", fr: "favoris", de: "favoriten", it: "preferiti" },
  dashboard: { en: "dashboard", pt: "painel", es: "panel", fr: "tableau-de-bord", de: "dashboard", it: "cruscotto" },
  
  // Authentication routes
  signin: { en: "signin", pt: "entrar", es: "iniciar-sesion", fr: "connexion", de: "anmelden", it: "accedi" },
  signup: { en: "signup", pt: "cadastrar", es: "registrarse", fr: "inscription", de: "registrieren", it: "registrati" },
  "forgot-password": { en: "forgot-password", pt: "esqueceu-senha", es: "olvide-contrasena", fr: "mot-de-passe-oublie", de: "passwort-vergessen", it: "password-dimenticata" },
  "reset-password": { en: "reset-password", pt: "redefinir-senha", es: "restablecer-contrasena", fr: "reinitialiser-mot-de-passe", de: "passwort-zurucksetzen", it: "reimposta-password" },
  "confirm-email": { en: "confirm-email", pt: "confirmar-email", es: "confirmar-email", fr: "confirmer-email", de: "email-bestaetigen", it: "conferma-email" },
  
  // Content creation
  "create-article": { en: "create-article", pt: "criar-artigo", es: "crear-articulo", fr: "creer-article", de: "artikel-erstellen", it: "crea-articolo" },
  
  // Core pages
  about: { en: "about", pt: "sobre", es: "acerca-de", fr: "a-propos", de: "uber-uns", it: "chi-siamo" },
  search: { en: "search", pt: "pesquisar", es: "buscar", fr: "rechercher", de: "suchen", it: "cerca" },
  "site-map": { en: "site-map", pt: "mapa-do-site", es: "mapa-del-sitio", fr: "plan-du-site", de: "sitemap", it: "mappa-del-sito" },
  
  // Legal & policies
  "privacy-policy": { en: "privacy-policy", pt: "politica-de-privacidade", es: "politica-de-privacidad", fr: "politique-de-confidentialite", de: "datenschutzrichtlinie", it: "politica-sulla-privacy" },
  "terms-conditions": { en: "terms-conditions", pt: "termos-e-condicoes", es: "terminos-y-condiciones", fr: "conditions-generales", de: "allgemeine-geschaftsbedingungen", it: "termini-e-condizioni" },
  "cookie-policy": { en: "cookie-policy", pt: "politica-de-cookies", es: "politica-de-cookies", fr: "politique-de-cookies", de: "cookie-richtlinie", it: "politica-dei-cookie" },
  
  // Newsletter
  "confirm-newsletter": { en: "confirm-newsletter", pt: "confirmar-newsletter", es: "confirmar-boletin", fr: "confirmer-newsletter", de: "newsletter-bestaetigen", it: "conferma-newsletter" },
  unsubscribe: { en: "unsubscribe", pt: "cancelar-inscricao", es: "cancelar-suscripcion", fr: "se-desabonner", de: "abbestellen", it: "annulla-iscrizione" },
};

// Combined translations (categories + routes)
const allRouteTranslations: Record<string, Record<string, string>> = {
  ...categoryTranslations,
  ...routeTranslations,
};

/**
 * Converts a translated route name to its English equivalent
 * Works for both categories and other routes
 */
export function translateRouteToEnglish(route: string): string {
  const lowerRoute = route.toLowerCase();
  
  // Check if it's already English
  if (allRouteTranslations[lowerRoute]?.en === lowerRoute) {
    return lowerRoute;
  }
  
  // Search through all routes to find the English equivalent
  for (const [english, translations] of Object.entries(allRouteTranslations)) {
    if (Object.values(translations).includes(lowerRoute)) {
      return english;
    }
  }
  
  return route; // Fallback
}

/**
 * Converts an English route name to its locale-specific equivalent
 * Works for both categories and other routes
 */
export function translateRouteToLocale(englishRoute: string, locale: string): string {
  if (locale === "en") return englishRoute;
  return allRouteTranslations[englishRoute]?.[locale] || englishRoute;
}

/**
 * Gets all valid route names (English + all translations)
 */
export function getAllValidRoutes(): string[] {
  const allRoutes: string[] = [];
  Object.values(allRouteTranslations).forEach(translations => {
    allRoutes.push(...Object.values(translations));
  });
  return [...new Set(allRoutes)]; // Remove duplicates
}

/**
 * Check if a route is an English route name
 */
export function isEnglishRoute(route: string): boolean {
  return Object.keys(allRouteTranslations).includes(route.toLowerCase());
}

/**
 * Check if a route is a category
 */
export function isCategoryRoute(route: string): boolean {
  return mainCategories.includes(translateRouteToEnglish(route));
}

// Re-export category-specific functions for backward compatibility
// These use the same categoryTranslations object, so they work identically
export function translateCategoryToEnglish(category: string): string {
  const lowerCategory = category.toLowerCase();
  
  // Check if it's already English
  const translations = categoryTranslations[lowerCategory as keyof typeof categoryTranslations];
  if (translations && translations.en === lowerCategory) {
    return lowerCategory;
  }
  
  // Search through all translations to find the English equivalent
  for (const [english, trans] of Object.entries(categoryTranslations)) {
    if ((Object.values(trans) as string[]).includes(lowerCategory)) {
      return english;
    }
  }
  
  return category;
}

export function translateCategoryToLocale(englishCategory: string, locale: string): string {
  if (locale === "en") return englishCategory;
  const normalizedCategory = englishCategory.toLowerCase();
  const translations = categoryTranslations[normalizedCategory as keyof typeof categoryTranslations];
  if (!translations) {
    return englishCategory;
  }
  return translations[locale as keyof typeof translations] || englishCategory;
}

export function getAllValidCategories(): string[] {
  const allCategories: string[] = [];
  Object.values(categoryTranslations).forEach(trans => {
    allCategories.push(...(Object.values(trans) as string[]));
  });
  return [...new Set(allCategories)];
}

export function isEnglishCategory(category: string): boolean {
  return mainCategories.includes(category.toLowerCase());
}

