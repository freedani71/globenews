import { NextResponse } from "next/server";

type Category = "Politics" | "Business" | "Technology" | "Sports" | "Entertainment" | "Science" | "Environment" | "Health";
type Importance = "Breaking" | "Top" | "General";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  category: Category;
  importance: Importance;
  lat: number;
  lng: number;
  imageUrl: string;
  sponsored: boolean;
}

const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  us: { lat: 38.9072, lng: -77.0369 },
  gb: { lat: 51.5074, lng: -0.1278 },
  de: { lat: 52.52, lng: 13.405 },
  fr: { lat: 48.8566, lng: 2.3522 },
  it: { lat: 41.9028, lng: 12.4964 },
  es: { lat: 40.4168, lng: -3.7038 },
  ru: { lat: 55.7558, lng: 37.6173 },
  cn: { lat: 39.9042, lng: 116.4074 },
  jp: { lat: 35.6762, lng: 139.6503 },
  kr: { lat: 37.5665, lng: 126.978 },
  in: { lat: 28.6139, lng: 77.209 },
  br: { lat: -15.7801, lng: -47.9292 },
  au: { lat: -35.2809, lng: 149.13 },
  ca: { lat: 45.4215, lng: -75.6972 },
  mx: { lat: 19.4326, lng: -99.1332 },
  za: { lat: -25.7479, lng: 28.2293 },
  eg: { lat: 30.0444, lng: 31.2357 },
  ng: { lat: 9.0765, lng: 7.3986 },
  ar: { lat: -34.6037, lng: -58.3816 },
  sa: { lat: 24.7136, lng: 46.6753 },
  ae: { lat: 25.2048, lng: 55.2708 },
  il: { lat: 31.7683, lng: 35.2137 },
  tr: { lat: 39.9334, lng: 32.8597 },
  pl: { lat: 52.2297, lng: 21.0122 },
  nl: { lat: 52.3676, lng: 4.9041 },
  se: { lat: 59.3293, lng: 18.0686 },
  no: { lat: 59.9139, lng: 10.7522 },
  ch: { lat: 46.9481, lng: 7.4474 },
  at: { lat: 48.2082, lng: 16.3738 },
  be: { lat: 50.8503, lng: 4.3517 },
  ua: { lat: 50.4501, lng: 30.5234 },
  nz: { lat: -41.2865, lng: 174.7762 },
  sg: { lat: 1.3521, lng: 103.8198 },
  hk: { lat: 22.3193, lng: 114.1694 },
  id: { lat: -6.2088, lng: 106.8456 },
  my: { lat: 3.139, lng: 101.6869 },
  th: { lat: 13.7563, lng: 100.5018 },
  ph: { lat: 14.5995, lng: 120.9842 },
  vn: { lat: 21.0285, lng: 105.8542 },
  pk: { lat: 33.6844, lng: 73.0479 },
  ir: { lat: 35.6892, lng: 51.389 },
};

const CITY_PATTERNS: [RegExp, string][] = [
  [/\bnew york\b/i, "New York City"],
  [/\blos angeles\b/i, "Los Angeles"],
  [/\bchicago\b/i, "Chicago"],
  [/\bwashington\s*(d\.?c\.?)?\b/i, "Washington DC"],
  [/\bsan francisco\b/i, "San Francisco"],
  [/\bhouston\b/i, "Houston"],
  [/\bseattle\b/i, "Seattle"],
  [/\bboston\b/i, "Boston"],
  [/\bmiami\b/i, "Miami"],
  [/\bdallas\b/i, "Dallas"],
  [/\batlanta\b/i, "Atlanta"],
  [/\blas vegas\b/i, "Las Vegas"],
  [/\blondon\b/i, "London"],
  [/\bmanchester\b/i, "Manchester"],
  [/\bedinburgh\b/i, "Edinburgh"],
  [/\bparis\b/i, "Paris"],
  [/\bberlin\b/i, "Berlin"],
  [/\bmunich\b|\bmünchen\b/i, "Munich"],
  [/\bhamburg\b/i, "Hamburg"],
  [/\bfrankfurt\b/i, "Frankfurt"],
  [/\bmadrid\b/i, "Madrid"],
  [/\bbarcelona\b/i, "Barcelona"],
  [/\brome\b/i, "Rome"],
  [/\bmilan\b/i, "Milan"],
  [/\bamsterdam\b/i, "Amsterdam"],
  [/\bbrussels\b/i, "Brussels"],
  [/\bvienna\b/i, "Vienna"],
  [/\bzurich\b/i, "Zurich"],
  [/\bstockholm\b/i, "Stockholm"],
  [/\boslo\b/i, "Oslo"],
  [/\bcopenhagen\b/i, "Copenhagen"],
  [/\bhelsinki\b/i, "Helsinki"],
  [/\bwarsaw\b/i, "Warsaw"],
  [/\bprague\b/i, "Prague"],
  [/\bbudapest\b/i, "Budapest"],
  [/\bkyiv\b|\bkiev\b/i, "Kyiv"],
  [/\bmoscow\b/i, "Moscow"],
  [/\binstanbul\b/i, "Istanbul"],
  [/\bankara\b/i, "Ankara"],
  [/\bbeijing\b/i, "Beijing"],
  [/\bshanghai\b/i, "Shanghai"],
  [/\bhong kong\b/i, "Hong Kong"],
  [/\btokyo\b/i, "Tokyo"],
  [/\bosaka\b/i, "Osaka"],
  [/\bseoul\b/i, "Seoul"],
  [/\bsingapore\b/i, "Singapore"],
  [/\bbangkok\b/i, "Bangkok"],
  [/\bjakarta\b/i, "Jakarta"],
  [/\bmanila\b/i, "Manila"],
  [/\bkuala lumpur\b/i, "Kuala Lumpur"],
  [/\bhanoi\b/i, "Hanoi"],
  [/\bho chi minh\b|\bsaigon\b/i, "Ho Chi Minh City"],
  [/\bmumbai\b|\bbombay\b/i, "Mumbai"],
  [/\bnew delhi\b|\bdelhi\b/i, "New Delhi"],
  [/\bbangalore\b/i, "Bangalore"],
  [/\bkarachi\b/i, "Karachi"],
  [/\bdhaka\b/i, "Dhaka"],
  [/\btehran\b/i, "Tehran"],
  [/\bbaghdad\b/i, "Baghdad"],
  [/\briyadh\b/i, "Riyadh"],
  [/\bdubai\b/i, "Dubai"],
  [/\btel aviv\b/i, "Tel Aviv"],
  [/\bjerusalem\b/i, "Jerusalem"],
  [/\bbeirut\b/i, "Beirut"],
  [/\bdamascus\b/i, "Damascus"],
  [/\bcairo\b/i, "Cairo"],
  [/\bnairobi\b/i, "Nairobi"],
  [/\blagos\b/i, "Lagos"],
  [/\bjohannesburg\b/i, "Johannesburg"],
  [/\bcape town\b/i, "Cape Town"],
  [/\baddis ababa\b/i, "Addis Ababa"],
  [/\btoronto\b/i, "Toronto"],
  [/\bvancouver\b/i, "Vancouver"],
  [/\bmontreal\b/i, "Montreal"],
  [/\bottawa\b/i, "Ottawa"],
  [/\bmexico city\b/i, "Mexico City"],
  [/\bsão paulo\b|\bsao paulo\b/i, "São Paulo"],
  [/\brio de janeiro\b/i, "Rio de Janeiro"],
  [/\bbuenos aires\b/i, "Buenos Aires"],
  [/\bbogotá\b|\bbogota\b/i, "Bogotá"],
  [/\blima\b/i, "Lima"],
  [/\bsantiago\b/i, "Santiago"],
  [/\bsydney\b/i, "Sydney"],
  [/\bmelbourne\b/i, "Melbourne"],
  [/\bauckland\b/i, "Auckland"],
];

const SECTION_CATEGORY: Record<string, Category> = {
  politics: "Politics",
  "us-news": "Politics",
  "uk-news": "Politics",
  world: "Politics",
  business: "Business",
  money: "Business",
  technology: "Technology",
  sport: "Sports",
  football: "Sports",
  culture: "Entertainment",
  film: "Entertainment",
  music: "Entertainment",
  "tv-and-radio": "Entertainment",
  science: "Science",
  environment: "Environment",
  society: "Health",
  lifeandstyle: "Health",
};

// Fetch these 4 batches in parallel — 25 each = 100 total articles
const SECTION_GROUPS = [
  ["world", "politics", "us-news", "uk-news"],
  ["business", "money"],
  ["technology", "science"],
  ["sport", "culture", "environment", "lifeandstyle"],
];

const geocodeCache = new Map<string, { lat: number; lng: number }>();

async function geocodeCity(cityName: string, token: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(cityName)) return geocodeCache.get(cityName)!;
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?access_token=${token}&types=place,region,country&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].center;
      const result = { lat, lng };
      geocodeCache.set(cityName, result);
      return result;
    }
  } catch { /* fall through */ }
  return null;
}

export function extractCity(title: string, description: string): string | null {
  const text = `${title} ${description ?? ""}`;
  for (const [pattern, cityName] of CITY_PATTERNS) {
    if (pattern.test(text)) return cityName;
  }
  return null;
}

export function detectCountry(title: string, description: string): string {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  const patterns: [string, RegExp][] = [
    ["us", /\b(usa|united states|america|washington|new york|california|texas|pentagon|white house)\b/],
    ["gb", /\b(uk|britain|british|england|london|scotland|wales|downing street)\b/],
    ["de", /\b(germany|german|berlin|munich|bundestag)\b/],
    ["fr", /\b(france|french|paris|macron)\b/],
    ["cn", /\b(china|chinese|beijing|shanghai|xi jinping)\b/],
    ["jp", /\b(japan|japanese|tokyo)\b/],
    ["ru", /\b(russia|russian|moscow|kremlin|putin)\b/],
    ["in", /\b(india|indian|delhi|mumbai|modi)\b/],
    ["br", /\b(brazil|brazilian|são paulo|rio|lula)\b/],
    ["au", /\b(australia|australian|sydney|melbourne|canberra)\b/],
    ["ca", /\b(canada|canadian|toronto|ottawa)\b/],
    ["kr", /\b(south korea|korean|seoul)\b/],
    ["ua", /\b(ukraine|ukrainian|kyiv|zelensky)\b/],
    ["il", /\b(israel|israeli|tel aviv|jerusalem|netanyahu|gaza)\b/],
    ["sa", /\b(saudi|riyadh)\b/],
    ["ae", /\b(uae|dubai|emirates|abu dhabi)\b/],
    ["eg", /\b(egypt|egyptian|cairo)\b/],
    ["mx", /\b(mexico|mexican|mexico city)\b/],
    ["it", /\b(italy|italian|rome|milan)\b/],
    ["es", /\b(spain|spanish|madrid|barcelona)\b/],
    ["tr", /\b(turkey|turkish|istanbul|ankara|erdogan)\b/],
    ["ng", /\b(nigeria|nigerian|lagos|abuja)\b/],
    ["za", /\b(south africa|johannesburg|cape town)\b/],
    ["pk", /\b(pakistan|pakistani|islamabad|karachi)\b/],
    ["ir", /\b(iran|iranian|tehran)\b/],
  ];
  for (const [code, pattern] of patterns) {
    if (pattern.test(text)) return code;
  }
  return "gb";
}

export function detectCategory(sectionId: string, title: string, description: string): Category {
  if (SECTION_CATEGORY[sectionId]) return SECTION_CATEGORY[sectionId];
  const text = `${title} ${description ?? ""}`.toLowerCase();
  if (text.match(/politi|election|government|president|minister|parliament|vote|war|conflict/)) return "Politics";
  if (text.match(/business|economy|market|stock|trade|company|ceo|finance|bank|invest/)) return "Business";
  if (text.match(/tech|ai|software|app|digital|cyber|robot|computer|startup|openai|google|apple/)) return "Technology";
  if (text.match(/sport|football|soccer|basketball|tennis|olympic|championship|league|cricket|rugby/)) return "Sports";
  if (text.match(/movie|music|celebrity|entertainment|film|actor|singer|concert|award|theatre/)) return "Entertainment";
  if (text.match(/science|research|study|discover|space|nasa|university|scientist|experiment/)) return "Science";
  if (text.match(/climate|environment|green|carbon|pollution|wildlife|nature|sustainable|flood/)) return "Environment";
  if (text.match(/health|medical|doctor|hospital|disease|vaccine|treatment|drug|patient|nhs/)) return "Health";
  return "Politics";
}

async function fetchGuardianSection(
  sections: string[],
  pageSize: number,
  apiKey: string,
  query?: string
): Promise<any[]> {
  const params = new URLSearchParams({
    "api-key": apiKey,
    "page-size": String(pageSize),
    "show-fields": "thumbnail,trailText",
    "order-by": "newest",
    "section": sections.join("|"),
    ...(query ? { q: query } : {}),
  });
  try {
    const res = await fetch(`https://content.guardianapis.com/search?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.response?.results ?? [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryFilter = searchParams.get("category") || "";
  const query = searchParams.get("q") || "";

  const apiKey = process.env.GUARDIAN_API_KEY;
  const mapboxToken = process.env.MAPBOX_TOKEN;

  if (!apiKey) {
    return NextResponse.json({ error: "Guardian API key not configured" }, { status: 500 });
  }

  try {
    let articles: any[];

    if (categoryFilter && categoryFilter !== "all") {
      // Single category: fetch 50 from matching sections
      const matchingSections = Object.entries(SECTION_CATEGORY)
        .filter(([, cat]) => cat === categoryFilter)
        .map(([sec]) => sec);
      const sections = matchingSections.length > 0 ? matchingSections : ["world"];
      articles = await fetchGuardianSection(sections, 50, apiKey, query);
    } else {
      // All categories: fetch 25 from each of 4 section groups in parallel
      const results = await Promise.all(
        SECTION_GROUPS.map((sections) => fetchGuardianSection(sections, 25, apiKey, query))
      );
      articles = results.flat();
    }

    if (articles.length === 0) {
      return NextResponse.json({ error: "No articles returned from Guardian API" }, { status: 502 });
    }

    // Resolve coordinates in parallel
    const coordResults = await Promise.all(
      articles.map(async (article) => {
        const title = article.webTitle ?? "";
        const description = article.fields?.trailText ?? "";
        const city = extractCity(title, description);
        if (city && mapboxToken) {
          const geocoded = await geocodeCity(city, mapboxToken);
          if (geocoded) return geocoded;
        }
        return COUNTRY_COORDINATES[detectCountry(title, description)] ?? COUNTRY_COORDINATES.gb;
      })
    );

    const newsItems: NewsItem[] = articles.map((article, index) => ({
      id: article.id ?? `guardian-${index}`,
      title: article.webTitle ?? "",
      description: article.fields?.trailText ?? article.webTitle ?? "",
      category: detectCategory(article.sectionId ?? "", article.webTitle ?? "", article.fields?.trailText ?? ""),
      source: "The Guardian",
      imageUrl: article.fields?.thumbnail ?? "",
      timestamp: new Date(article.webPublicationDate),
      lat: coordResults[index].lat,
      lng: coordResults[index].lng,
      importance: (index < 5 ? "Breaking" : index < 25 ? "Top" : "General") as Importance,
      sponsored: false,
    }));

    return NextResponse.json({ articles: newsItems, totalResults: newsItems.length });
  } catch (error) {
    console.error("Guardian API error:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
