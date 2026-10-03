// Reference data for the three programs, their cabins and the airports we serve.
// Only airports reachable on the active carriers ship here, so the client never
// downloads airports it would filter out.

export type CarrierId = 'EK' | 'EY' | 'QR';
export type CabinId = 'economy' | 'premium' | 'business' | 'first';

export interface Airport {
  code: string;
  city: string;
  cityAr: string;
  country: string;
  countryAr: string;
  lat: number;
  lon: number;
  /** UTC offset in hours, used by the sample data generator only. */
  tz: number;
}

export interface Carrier {
  id: CarrierId;
  airline: string;
  airlineAr: string;
  program: string;
  programAr: string;
  unit: 'miles' | 'Avios';
  unitAr: string;
  hub: string;
  site: string;
  url: string;
  /** Name of the switch on the airline site that shows reward seats. */
  term: string;
  termAr: string;
}

export interface Cabin {
  id: CabinId;
  en: string;
  short: string;
  ar: string;
  arShort: string;
}

export const AIRPORTS: Airport[] = [
  { code: 'DXB', city: 'Dubai', cityAr: 'دبي', country: 'UAE', countryAr: 'الإمارات', lat: 25.25, lon: 55.36, tz: 4 },
  { code: 'AUH', city: 'Abu Dhabi', cityAr: 'أبوظبي', country: 'UAE', countryAr: 'الإمارات', lat: 24.43, lon: 54.65, tz: 4 },
  { code: 'DOH', city: 'Doha', cityAr: 'الدوحة', country: 'Qatar', countryAr: 'قطر', lat: 25.27, lon: 51.61, tz: 3 },
  { code: 'RUH', city: 'Riyadh', cityAr: 'الرياض', country: 'Saudi Arabia', countryAr: 'السعودية', lat: 24.96, lon: 46.7, tz: 3 },
  { code: 'JED', city: 'Jeddah', cityAr: 'جدة', country: 'Saudi Arabia', countryAr: 'السعودية', lat: 21.68, lon: 39.16, tz: 3 },
  { code: 'KWI', city: 'Kuwait City', cityAr: 'الكويت', country: 'Kuwait', countryAr: 'الكويت', lat: 29.24, lon: 47.97, tz: 3 },
  { code: 'BAH', city: 'Manama', cityAr: 'المنامة', country: 'Bahrain', countryAr: 'البحرين', lat: 26.27, lon: 50.63, tz: 3 },
  { code: 'MCT', city: 'Muscat', cityAr: 'مسقط', country: 'Oman', countryAr: 'عُمان', lat: 23.59, lon: 58.28, tz: 4 },
  { code: 'LHR', city: 'London', cityAr: 'لندن', country: 'United Kingdom', countryAr: 'المملكة المتحدة', lat: 51.47, lon: -0.45, tz: 1 },
  { code: 'CDG', city: 'Paris', cityAr: 'باريس', country: 'France', countryAr: 'فرنسا', lat: 49.0, lon: 2.55, tz: 2 },
  { code: 'IST', city: 'Istanbul', cityAr: 'إسطنبول', country: 'Türkiye', countryAr: 'تركيا', lat: 41.26, lon: 28.74, tz: 3 },
  { code: 'JFK', city: 'New York', cityAr: 'نيويورك', country: 'United States', countryAr: 'الولايات المتحدة', lat: 40.64, lon: -73.78, tz: -4 },
  { code: 'BOM', city: 'Mumbai', cityAr: 'مومباي', country: 'India', countryAr: 'الهند', lat: 19.09, lon: 72.87, tz: 5.5 },
  { code: 'MLE', city: 'Malé', cityAr: 'ماليه', country: 'Maldives', countryAr: 'المالديف', lat: 4.19, lon: 73.53, tz: 5 },
  { code: 'BKK', city: 'Bangkok', cityAr: 'بانكوك', country: 'Thailand', countryAr: 'تايلاند', lat: 13.69, lon: 100.75, tz: 7 },
  { code: 'SIN', city: 'Singapore', cityAr: 'سنغافورة', country: 'Singapore', countryAr: 'سنغافورة', lat: 1.36, lon: 103.99, tz: 8 },
  { code: 'NRT', city: 'Tokyo', cityAr: 'طوكيو', country: 'Japan', countryAr: 'اليابان', lat: 35.77, lon: 140.39, tz: 9 },
  { code: 'SYD', city: 'Sydney', cityAr: 'سيدني', country: 'Australia', countryAr: 'أستراليا', lat: -33.94, lon: 151.18, tz: 10 },
];

export const AIRPORT_BY_CODE: Record<string, Airport> = Object.fromEntries(AIRPORTS.map((a) => [a.code, a]));

export const CARRIERS: Carrier[] = [
  {
    id: 'EK', airline: 'Emirates', airlineAr: 'طيران الإمارات', program: 'Skywards', programAr: 'سكاي واردز',
    unit: 'miles', unitAr: 'ميل', hub: 'DXB', site: 'emirates.com', url: 'https://www.emirates.com',
    term: 'Classic Rewards', termAr: 'Classic Rewards',
  },
  {
    id: 'EY', airline: 'Etihad', airlineAr: 'الاتحاد للطيران', program: 'Etihad Guest', programAr: 'ضيف الاتحاد',
    unit: 'miles', unitAr: 'ميل', hub: 'AUH', site: 'etihad.com', url: 'https://www.etihad.com',
    term: 'Book with miles', termAr: 'الحجز بالأميال',
  },
  {
    id: 'QR', airline: 'Qatar Airways', airlineAr: 'الخطوط الجوية القطرية', program: 'Privilege Club', programAr: 'نادي الامتياز',
    unit: 'Avios', unitAr: 'أفيوس', hub: 'DOH', site: 'qatarairways.com', url: 'https://www.qatarairways.com',
    term: 'Book with Avios', termAr: 'الحجز بنقاط أفيوس',
  },
];

export const CARRIER_BY_ID: Record<CarrierId, Carrier> = Object.fromEntries(CARRIERS.map((c) => [c.id, c])) as Record<CarrierId, Carrier>;

export const CABINS: Cabin[] = [
  { id: 'economy', en: 'Economy', short: 'Economy', ar: 'الدرجة السياحية', arShort: 'السياحية' },
  { id: 'premium', en: 'Premium Economy', short: 'Premium', ar: 'السياحية الممتازة', arShort: 'الممتازة' },
  { id: 'business', en: 'Business', short: 'Business', ar: 'درجة رجال الأعمال', arShort: 'الأعمال' },
  { id: 'first', en: 'First', short: 'First', ar: 'الدرجة الأولى', arShort: 'الأولى' },
];

export const CABIN_IDS: CabinId[] = CABINS.map((c) => c.id);
export const CABIN_BY_ID: Record<CabinId, Cabin> = Object.fromEntries(CABINS.map((c) => [c.id, c])) as Record<CabinId, Cabin>;

/** Etihad's program already carries the airline name, so do not repeat it. */
export const programName = (c: Carrier) => (c.program.startsWith(c.airline) ? c.program : `${c.airline} ${c.program}`);
export const programNameAr = (c: Carrier) => `${c.programAr} من ${c.airlineAr}`;

export const isCarrier = (v: unknown): v is CarrierId => CARRIERS.some((c) => c.id === v);
export const isCabin = (v: unknown): v is CabinId => CABIN_IDS.includes(v as CabinId);
export const isAirport = (v: unknown): v is string => typeof v === 'string' && v in AIRPORT_BY_CODE;

export const RETURN_OPTIONS = [0, 7, 14, 21, 28] as const;
export const MAX_PAX = 6;
/** The search window is always the next 90 days. */
export const WINDOW_DAYS = 90;
