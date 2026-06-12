import { USE_MOCK_DATA } from "@/services/mock";

/**
 * Effective TTL: in mock mode, force a 1s window so fixture edits show
 * up immediately without waiting out a 60s+ s-maxage. Real mode honors
 * the spec.
 */
export function effectiveTtl(seconds: number): number {
  return USE_MOCK_DATA ? 1 : seconds;
}

export function cachePublic(
  sMaxAge: number,
  swr: number,
  maxAge?: number
): { "Cache-Control": string } {
  const eff = effectiveTtl(sMaxAge);
  const effSwr = effectiveTtl(swr);
  const m = maxAge !== undefined ? effectiveTtl(maxAge) : Math.max(1, Math.floor(eff / 2));
  return {
    "Cache-Control": `public, max-age=${m}, s-maxage=${eff}, stale-while-revalidate=${effSwr}`,
  };
}

export function cachePrivate(maxAge: number): { "Cache-Control": string } {
  return {
    "Cache-Control": `private, max-age=${effectiveTtl(maxAge)}`,
  };
}
