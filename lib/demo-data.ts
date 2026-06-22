/**
 * @file demo-data.ts
 * @fileoverview Statische Demodaten für die GlobeNews-Applikation.
 *              Wird als Fallback verwendet, wenn die Guardian API nicht erreichbar ist
 *              oder kein API-Schlüssel konfiguriert wurde. Enthält 30 fiktive aber
 *              realistische Nachrichtenartikel über alle Kategorien, Wichtigkeitsstufen
 *              und Zeiträume verteilt sowie die Kontinent- und Länderlisten für Filter-UI.
 * @author Projektteam GlobeNews
 * @version 1.0
 * @date 2026-05-20
 */

import type { NewsItem, Category, Importance } from "./types";

/** Referenzzeitpunkt für alle relativen Zeitstempel in den Demodaten. */
const now = new Date();

/**
 * Berechnet ein Datum, das eine bestimmte Anzahl Stunden in der Vergangenheit liegt.
 * @param hours - Anzahl vergangener Stunden
 * @returns Date-Objekt relativ zu `now`
 */
function hoursAgo(hours: number): Date {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

/**
 * Berechnet ein Datum, das eine bestimmte Anzahl Tage in der Vergangenheit liegt.
 * @param days - Anzahl vergangener Tage
 * @returns Date-Objekt relativ zu `now`
 */
function daysAgo(days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export const demoNews: NewsItem[] = [
  // Breaking News - Last Hour
  {
    id: "1",
    title: "Major Climate Summit Agreement Reached",
    description: "World leaders have agreed to unprecedented emissions cuts at the Global Climate Summit, marking a historic turning point in the fight against climate change.",
    source: "Reuters",
    timestamp: hoursAgo(0.5),
    category: "Environment",
    importance: "Breaking",
    lat: 48.8566,
    lng: 2.3522,
    imageUrl: "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=400",
    sponsored: false,
  },
  {
    id: "2",
    title: "Tech Giant Announces Quantum Computing Breakthrough",
    description: "A major technology company has achieved quantum supremacy with a new 1000-qubit processor, potentially revolutionizing computing as we know it.",
    source: "TechCrunch",
    timestamp: hoursAgo(0.8),
    category: "Technology",
    importance: "Breaking",
    lat: 37.3861,
    lng: -122.0839,
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400",
    sponsored: false,
  },
  {
    id: "3",
    title: "Global Markets React to Central Bank Decision",
    description: "Stock markets worldwide surge following unexpected interest rate announcement from the Federal Reserve.",
    source: "Bloomberg",
    timestamp: hoursAgo(1),
    category: "Business",
    importance: "Breaking",
    lat: 40.7128,
    lng: -74.006,
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400",
    sponsored: false,
  },

  // Top Stories - Today
  {
    id: "4",
    title: "Historic Peace Agreement Signed in Middle East",
    description: "Two long-standing rivals have signed a comprehensive peace accord, ending decades of conflict in the region.",
    source: "BBC News",
    timestamp: hoursAgo(3),
    category: "Politics",
    importance: "Top",
    lat: 31.7683,
    lng: 35.2137,
    imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400",
    sponsored: false,
  },
  {
    id: "5",
    title: "New Cancer Treatment Shows 90% Success Rate",
    description: "Clinical trials of a revolutionary immunotherapy treatment have shown remarkable results in treating advanced cancers.",
    source: "Nature Medicine",
    timestamp: hoursAgo(5),
    category: "Health",
    importance: "Top",
    lat: 51.5074,
    lng: -0.1278,
    imageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400",
    sponsored: false,
  },
  {
    id: "6",
    title: "World Cup Host Announces Sustainable Stadium Plans",
    description: "The 2030 World Cup organizers reveal plans for the most environmentally friendly sporting event in history.",
    source: "ESPN",
    timestamp: hoursAgo(6),
    category: "Sports",
    importance: "Top",
    lat: -23.5505,
    lng: -46.6333,
    imageUrl: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400",
    sponsored: false,
  },
  {
    id: "7",
    title: "AI-Powered Drug Discovery Accelerates Research",
    description: "Scientists use advanced AI models to identify promising drug candidates in record time, potentially saving years of research.",
    source: "Scientific American",
    timestamp: hoursAgo(8),
    category: "Science",
    importance: "Top",
    lat: 42.3601,
    lng: -71.0589,
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400",
    sponsored: false,
  },
  {
    id: "8",
    title: "Streaming Platform Breaks Viewership Records",
    description: "The premiere of a highly anticipated series attracts over 100 million viewers in its first 24 hours.",
    source: "Variety",
    timestamp: hoursAgo(10),
    category: "Entertainment",
    importance: "Top",
    lat: 34.0522,
    lng: -118.2437,
    imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400",
    sponsored: false,
  },

  // Sponsored Content
  {
    id: "9",
    title: "Revolutionizing Remote Work: Enterprise Solutions",
    description: "Discover how leading companies are transforming their workflows with cutting-edge collaboration tools.",
    source: "Sponsored by TechCorp",
    timestamp: hoursAgo(2),
    category: "Technology",
    importance: "General",
    lat: 37.7749,
    lng: -122.4194,
    imageUrl: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400",
    sponsored: true,
    affiliateLink: "https://example.com/sponsor",
  },
  {
    id: "10",
    title: "Investment Opportunities in Green Energy",
    description: "Learn about the fastest-growing sector in the global economy and how to get involved.",
    source: "Sponsored by GreenInvest",
    timestamp: hoursAgo(4),
    category: "Business",
    importance: "General",
    lat: 52.52,
    lng: 13.405,
    imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400",
    sponsored: true,
    affiliateLink: "https://example.com/sponsor2",
  },

  // This Week
  {
    id: "11",
    title: "Electric Vehicle Sales Surpass Traditional Cars",
    description: "For the first time in history, electric vehicles have outsold gasoline-powered cars in Europe.",
    source: "Automotive News",
    timestamp: daysAgo(2),
    category: "Business",
    importance: "Top",
    lat: 52.2297,
    lng: 21.0122,
    imageUrl: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400",
    sponsored: false,
  },
  {
    id: "12",
    title: "Space Agency Confirms Water on Mars",
    description: "NASA scientists announce definitive evidence of liquid water beneath the Martian surface.",
    source: "NASA",
    timestamp: daysAgo(2),
    category: "Science",
    importance: "Breaking",
    lat: 28.5721,
    lng: -80.648,
    imageUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=400",
    sponsored: false,
  },
  {
    id: "13",
    title: "International Trade Agreement Expanded",
    description: "Pacific nations agree to reduce tariffs and strengthen economic cooperation.",
    source: "Financial Times",
    timestamp: daysAgo(3),
    category: "Politics",
    importance: "Top",
    lat: 35.6762,
    lng: 139.6503,
    imageUrl: "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=400",
    sponsored: false,
  },
  {
    id: "14",
    title: "Tennis Champion Announces Retirement",
    description: "After 20 Grand Slam titles, the legendary player announces the end of an era.",
    source: "Sports Illustrated",
    timestamp: daysAgo(3),
    category: "Sports",
    importance: "Top",
    lat: 51.4237,
    lng: -0.2147,
    imageUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400",
    sponsored: false,
  },
  {
    id: "15",
    title: "Coral Reef Recovery Program Shows Promise",
    description: "Scientists report significant coral regrowth in protected marine areas.",
    source: "National Geographic",
    timestamp: daysAgo(4),
    category: "Environment",
    importance: "General",
    lat: -18.2871,
    lng: 147.6992,
    imageUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=400",
    sponsored: false,
  },
  {
    id: "16",
    title: "Award-Winning Director Announces New Film",
    description: "The acclaimed filmmaker reveals details about an ambitious sci-fi epic.",
    source: "Hollywood Reporter",
    timestamp: daysAgo(4),
    category: "Entertainment",
    importance: "General",
    lat: 34.0522,
    lng: -118.2437,
    imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400",
    sponsored: false,
  },
  {
    id: "17",
    title: "WHO Launches Global Mental Health Initiative",
    description: "The World Health Organization announces a comprehensive plan to address the growing mental health crisis.",
    source: "WHO",
    timestamp: daysAgo(5),
    category: "Health",
    importance: "Top",
    lat: 46.2044,
    lng: 6.1432,
    imageUrl: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=400",
    sponsored: false,
  },
  {
    id: "18",
    title: "5G Network Coverage Reaches 80% Globally",
    description: "Telecommunications companies announce major milestone in global connectivity.",
    source: "GSMA",
    timestamp: daysAgo(5),
    category: "Technology",
    importance: "General",
    lat: 22.3193,
    lng: 114.1694,
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400",
    sponsored: false,
  },

  // This Month
  {
    id: "19",
    title: "Historic Election Results Transform Nation",
    description: "A surprising election outcome leads to significant policy shifts in Southeast Asia.",
    source: "AP News",
    timestamp: daysAgo(8),
    category: "Politics",
    importance: "Top",
    lat: 1.3521,
    lng: 103.8198,
    imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=400",
    sponsored: false,
  },
  {
    id: "20",
    title: "Cryptocurrency Regulation Framework Announced",
    description: "Major economies agree on unified approach to digital currency oversight.",
    source: "Reuters",
    timestamp: daysAgo(10),
    category: "Business",
    importance: "Top",
    lat: 47.3769,
    lng: 8.5417,
    imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400",
    sponsored: false,
  },
  {
    id: "21",
    title: "Olympic Committee Announces New Host City",
    description: "The 2036 Summer Olympics will be held in an unexpected location.",
    source: "IOC",
    timestamp: daysAgo(12),
    category: "Sports",
    importance: "Top",
    lat: 25.276987,
    lng: 55.296249,
    imageUrl: "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=400",
    sponsored: false,
  },
  {
    id: "22",
    title: "Fusion Energy Startup Achieves Milestone",
    description: "A private company reports sustained fusion reaction for over 5 minutes.",
    source: "MIT Technology Review",
    timestamp: daysAgo(14),
    category: "Science",
    importance: "Breaking",
    lat: 42.3601,
    lng: -71.0589,
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400",
    sponsored: false,
  },
  {
    id: "23",
    title: "Amazon Rainforest Deforestation Rate Drops",
    description: "New satellite data shows the lowest deforestation rate in 15 years.",
    source: "BBC Earth",
    timestamp: daysAgo(15),
    category: "Environment",
    importance: "Top",
    lat: -3.4653,
    lng: -62.2159,
    imageUrl: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400",
    sponsored: false,
  },
  {
    id: "24",
    title: "Blockbuster Movie Breaks Box Office Records",
    description: "The latest superhero film surpasses $2 billion in global box office revenue.",
    source: "Box Office Mojo",
    timestamp: daysAgo(17),
    category: "Entertainment",
    importance: "General",
    lat: 40.758,
    lng: -73.9855,
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400",
    sponsored: false,
  },
  {
    id: "25",
    title: "Vaccine Distribution Reaches Remote Areas",
    description: "Innovative drone delivery system brings healthcare to underserved communities.",
    source: "UNICEF",
    timestamp: daysAgo(18),
    category: "Health",
    importance: "General",
    lat: -4.0383,
    lng: 21.7587,
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    sponsored: false,
  },
  {
    id: "26",
    title: "Autonomous Vehicles Approved for Public Roads",
    description: "Regulatory bodies in multiple countries give green light to self-driving cars.",
    source: "Wired",
    timestamp: daysAgo(20),
    category: "Technology",
    importance: "Top",
    lat: 48.1351,
    lng: 11.582,
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400",
    sponsored: false,
  },
  {
    id: "27",
    title: "UN Security Council Adopts Resolution",
    description: "Historic resolution aims to address ongoing humanitarian crisis.",
    source: "UN News",
    timestamp: daysAgo(22),
    category: "Politics",
    importance: "Top",
    lat: 40.749,
    lng: -73.968,
    imageUrl: "https://images.unsplash.com/photo-1594391969111-1c98ad32fcc5?w=400",
    sponsored: false,
  },
  {
    id: "28",
    title: "Global Startup Funding Reaches New High",
    description: "Venture capital investments in Q4 set a new quarterly record.",
    source: "Crunchbase",
    timestamp: daysAgo(24),
    category: "Business",
    importance: "General",
    lat: 37.7749,
    lng: -122.4194,
    imageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400",
    sponsored: false,
  },
  {
    id: "29",
    title: "Rugby World Cup Final Draws Record Viewers",
    description: "The championship match becomes the most-watched rugby event in history.",
    source: "Sky Sports",
    timestamp: daysAgo(26),
    category: "Sports",
    importance: "Top",
    lat: -33.8688,
    lng: 151.2093,
    imageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400",
    sponsored: false,
  },
  {
    id: "30",
    title: "James Webb Telescope Discovers New Exoplanets",
    description: "NASA announces the discovery of potentially habitable planets in nearby star system.",
    source: "NASA",
    timestamp: daysAgo(28),
    category: "Science",
    importance: "Breaking",
    lat: 38.8833,
    lng: -77.0167,
    imageUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400",
    sponsored: false,
  },
];

/**
 * Kontinentliste für den Regionsfilter in der FilterSidebar.
 * Jedes Objekt enthält einen `value` (wird für Bounding-Box-Lookup im Store verwendet)
 * und ein `label` (wird in der UI angezeigt).
 * Der Eintrag `{ value: "all" }` deaktiviert den Regionsfilter.
 */
export const continents = [
  { value: "all", label: "All Continents" },
  { value: "africa", label: "Africa" },
  { value: "asia", label: "Asia" },
  { value: "europe", label: "Europe" },
  { value: "north-america", label: "North America" },
  { value: "south-america", label: "South America" },
  { value: "oceania", label: "Oceania" },
];

/**
 * Liste der häufigsten Länder für den Länderfilter.
 * Wird in der FilterSidebar als Dropdown-Optionen angeboten.
 * Die Strings entsprechen den Ländernamen in Englisch, da sie
 * mit den Erkennungsmustern in `detectCountry` übereinstimmen müssen.
 */
export const countries = [
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Japan",
  "China",
  "Brazil",
  "Australia",
  "India",
  "Canada",
];
