// Gulf currencies are pegged to the US dollar, so we can convert taxes exactly
// without a live rate feed. Anything else stays in the currency it came in.

export type CurrencyId = 'USD' | 'AED' | 'SAR' | 'QAR';

export const CURRENCIES: CurrencyId[] = ['USD', 'AED', 'SAR', 'QAR'];

/** Units of each currency per US dollar, at the official peg. */
export const PER_USD: Record<CurrencyId, number> = { USD: 1, AED: 3.6725, SAR: 3.75, QAR: 3.64 };

export const isCurrency = (v: unknown): v is CurrencyId => typeof v === 'string' && v in PER_USD;

/** Convert between pegged currencies. Returns null when either side is not one of ours. */
export function convert(amount: number, from: string, to: CurrencyId): number | null {
  if (!isCurrency(from)) return null;
  return (amount / PER_USD[from]) * PER_USD[to];
}

/** A sensible default from a locale such as 'ar-SA' or 'en-AE'. */
export function currencyForLocale(locale: string | undefined): CurrencyId {
  const region = (locale ?? '').split(/[-_]/)[1]?.toUpperCase();
  return region === 'AE' ? 'AED' : region === 'SA' ? 'SAR' : region === 'QA' ? 'QAR' : 'USD';
}
