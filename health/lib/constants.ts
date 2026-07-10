// Library Shared constants
// App Constants

// all the main category translations are on the routeTranslation.ts file
export const mainCategories = [
  "health",
  "fitness",
  "nutrition",
  "intimacy",
  "beauty",
  "weight-loss",
  "life",
];

export const newsletterFrequencies = ["daily", "weekly", "monthly"];

export const roles = ["admin", "user"];

export const articleStatus = ["published", "archived"];

export const commentReportReasons = [
  "bad_language",
  "racist",
  "spam",
  "harassment",
  "inappropriate_content",
  "false_information",
  "other",
];

// Category-specific hero images
export const categoryHeroImages = {
  home: "https://res.cloudinary.com/jpsm83/image/upload/v1761366390/health/dh6wlgqj1iuumg9utub1.jpg",
  health:
    "https://res.cloudinary.com/jpsm83/image/upload/v1760114147/health/cmgka42a5k9po8gc9cxm.png",
  fitness:
    "https://res.cloudinary.com/jpsm83/image/upload/v1760117286/health/npjkyt26ta3docojirrb.png",
  nutrition:
    "https://res.cloudinary.com/jpsm83/image/upload/v1760115243/health/bpkjpqjipibnwqeuabmq.png",
  intimacy:
    "https://res.cloudinary.com/jpsm83/image/upload/v1760167913/health/v35vhnluyjpwab6qml2z.jpg",
  beauty:
    "https://res.cloudinary.com/jpsm83/image/upload/v1760116224/health/rgmecdllfqgaeborqkur.png",
  "weight-loss":
    "https://res.cloudinary.com/jpsm83/image/upload/v1760860863/health/cxcinavpch40pcxxfooo.jpg",
  life: "https://res.cloudinary.com/jpsm83/image/upload/v1760860888/health/oymcvrxmvggo547lsqau.jpg",
  "search-results":
    "https://res.cloudinary.com/jpsm83/image/upload/v1760170369/health/krxqbddm7g2xegyjzdhj.jpg",
  "search-no-results":
    "https://res.cloudinary.com/jpsm83/image/upload/v1760168603/health/bszqgxauhdetbqrpdzw8.jpg",
  favorites:
    "https://res.cloudinary.com/jpsm83/image/upload/v1762840769/health/lctiqsxlb9szuuzphb99.jpg",
} as const;

// https://www.amazon.[TLD]/s?k=[SEARCH_TERM]&tag=[YOUR_AFFILIATE_ID]
// https://www.amazon.es/s?k=book+life&tag=womensspotorg-21
// [TLD] → country domain (co.uk, com, es, de…)
// [SEARCH_TERM] → URL-encoded search query (e.g., creatine+powder)
// tag=[YOUR_AFFILIATE_ID] → your affiliate tag
export const affiliateCompanies = {
  amazon: {
    logo: "https://res.cloudinary.com/jpsm83/image/upload/v1763812333/health/banner/av1g80lt4qcbhdu4jdv7.png",
    baseUrl: "https://www.amazon.",
    country: {
      us: {
        domain: "com",
        affiliateId: "womensspotorg-20",
      },
      uk: {
        domain: "co.uk",
        affiliateId: "womensspoto05-21",
      },
      ca: {
        domain: "ca",
        affiliateId: "womensspoto0f-20",
      },
      au: {
        domain: "com.au",
        affiliateId: "womensspotorg-22",
      },
      ie: {
        domain: "ie",
        affiliateId: "womensspoto06-21",
      },
      br: {
        domain: "com.br",
        affiliateId: "womensspoto08-20",
      },
      es: {
        domain: "es",
        affiliateId: "womensspotorg-21",
      },
      it: {
        domain: "it",
        affiliateId: "womensspoto04-21",
      },
      fr: {
        domain: "fr",
        affiliateId: "womensspoto02-21",
      },
      de: {
        domain: "de",
        affiliateId: "womensspoto0f-21",
      },
      nl: {
        domain: "nl",
        affiliateId: "womensspoto03-21",
      },
      se: {
        domain: "se",
        affiliateId: "womensspot-21",
      },
      pl: {
        domain: "pl",
        affiliateId: "womensspot09-21",
      }
    },
  },
} as const;

// fitness & weight-loss banners are the same
export const banners = {
  intimacy: {
    "970x90":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897717/health/banner/Intimacy/ldruxotuvbw2r8gxjg14.png",
    "970x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897720/health/banner/Intimacy/nxmegjvtrcdqv7myvn1z.png",
    "240x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897715/health/banner/Intimacy/yoexlngtgmuwmm8zzzrz.png",
    "240x390":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897716/health/banner/Intimacy/mkwgzpe2vr1usmpbhl4w.png",
    "390x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897718/health/banner/Intimacy/j9utzkcmt3pay6gubxxu.png",
  },
  beauty: {
    "970x90":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897768/health/banner/Beauty/uuta8kqzxbhtwqm7xnrq.png",
    "970x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897770/health/banner/Beauty/gc7eeaoox5z9qj6g8zli.png",
    "240x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897773/health/banner/Beauty/p553qkbpb8zruoow00yv.png",
    "240x390":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897769/health/banner/Beauty/u07umpmvaussb6wd2hzl.png",
    "390x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897772/health/banner/Beauty/ddut8h3sknjqeipvuezw.png",
  },
  fitness: {
    "970x90":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897539/health/banner/Fitness%20-%20Weight%20Loss/jmgldopkkkb7bjtaiyfg.png",
    "970x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897537/health/banner/Fitness%20-%20Weight%20Loss/gmoxlyvqgu96ztiyzuqm.png",
    "240x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897538/health/banner/Fitness%20-%20Weight%20Loss/lpco2rdyvm3ahwx3ozmr.png",
    "240x390":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897537/health/banner/Fitness%20-%20Weight%20Loss/s8umawzfosn7q9iugh8l.png",
    "390x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897537/health/banner/Fitness%20-%20Weight%20Loss/jfjolm365nlzcebihkds.png",
  },
  "weight-loss": {
    "970x90":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897539/health/banner/Fitness%20-%20Weight%20Loss/jmgldopkkkb7bjtaiyfg.png",
    "970x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897537/health/banner/Fitness%20-%20Weight%20Loss/gmoxlyvqgu96ztiyzuqm.png",
    "240x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897538/health/banner/Fitness%20-%20Weight%20Loss/lpco2rdyvm3ahwx3ozmr.png",
    "240x390":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897537/health/banner/Fitness%20-%20Weight%20Loss/s8umawzfosn7q9iugh8l.png",
    "390x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897537/health/banner/Fitness%20-%20Weight%20Loss/jfjolm365nlzcebihkds.png",
  },
  health: {
    "970x90":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897591/health/banner/Health/xic3cbbz4htmacunggop.png",
    "970x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897592/health/banner/Health/xigwwijg9ajsw6xf0fpk.png",
    "240x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897594/health/banner/Health/setdppbwkixhteqna3oq.png",
    "240x390":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897591/health/banner/Health/j5un5acfewduqenismpa.png",
    "390x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897593/health/banner/Health/sjpv3r31o8fnkmjkfefi.png",
  },
  life: {
    "970x90":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763979847/health/banner/Life%20-%20Default/ynrghdyj7j8lhaqpps9q.png",
    "970x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897846/health/banner/Life%20-%20Default/qwpbttgrgdrrhrryznna.png",
    "240x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897844/health/banner/Life%20-%20Default/xymmq3e4ww6c9lafclsc.png",
    "240x390":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897843/health/banner/Life%20-%20Default/vpiv4q7bftfhn5hxtiho.png",
    "390x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897842/health/banner/Life%20-%20Default/nez0tukgu4ibgn1sqigw.png",
  },
  nutrition: {
    "970x90":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897642/health/banner/Nutritiun/in7bechptaixfc9p8n3q.png",
    "970x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897640/health/banner/Nutritiun/seqnavgkvaebpslpxzer.png",
    "240x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897641/health/banner/Nutritiun/fsrcf3yhfzf8jjmjvcdj.png",
    "240x390":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897638/health/banner/Nutritiun/x2u6kihx4gmkgdjy4fcq.png",
    "390x240":
      "https://res.cloudinary.com/jpsm83/image/upload/v1763897639/health/banner/Nutritiun/ndsvopb5e0mri86ircee.png",
  },
} as const;

export const socialMedia = {
  language: {
    en: {
      pinterest: "https://es.pinterest.com/womens_spot_org/",
      instagram: "https://www.instagram.com/womens_spot_org/",
      threads: "https://www.threads.com/@womens_spot_org",
      facebook: "https://www.facebook.com/profile.php?id=61583217620986",
      twitter: "https://x.com/Womens_Spot",
      tiktok: "https://www.tiktok.com/@womensspot",
    },
    pt: {
      pinterest: "https://es.pinterest.com/womens_spot_org_pt/",
      instagram: "https://www.instagram.com/womens_spot_org_pt/",
      threads: "https://www.threads.com/@womens_spot_org_pt",
      facebook: "https://www.facebook.com/profile.php?id=61582918719099",
      twitter: "https://x.com/Womens_Spot_PT",
      tiktok: "https://www.tiktok.com/@womens_spot_pt",
    },
    es: {
      pinterest: "https://es.pinterest.com/womens_spot_org_es/",
      instagram: "https://www.instagram.com/womens_spot_org_es/",
      facebook: "https://www.facebook.com/profile.php?id=61582730597914",
      twitter: "https://x.com/Womens_Spot_ES",
      tiktok: "https://www.tiktok.com/@womens_spot_es",
    },
    it: {
      pinterest: "https://es.pinterest.com/womens_spot_org_it/",
      instagram: "https://www.instagram.com/womens_spot_org_it/",
      facebook: "https://www.facebook.com/profile.php?id=61583489394975",
      twitter: "https://x.com/Womens_Spot_IT",
      tiktok: "https://www.tiktok.com/@womens_spot_it",
    },
    fr: {
      pinterest: "https://es.pinterest.com/womens_spot_org_fr/",
      instagram: "https://www.instagram.com/womens_spot_org_fr/",
      facebook: "https://www.facebook.com/profile.php?id=61583282082756",
      twitter: "https://x.com/Womens_Spot_FR",
      tiktok: "https://www.tiktok.com/@womens_spot_fr",
    },
    de: {
      pinterest: "https://es.pinterest.com/womens_spot_org_de/",
      instagram: "https://www.instagram.com/womens_spot_org_de/",
      threads: "https://www.threads.com/@womens_spot_org_de",
      facebook: "https://www.facebook.com/profile.php?id=61583825361241",
      twitter: "https://x.com/Womens_Spot_DE",
      tiktok: "https://www.tiktok.com/@womens_spot_de",
    },
  },
} as const;