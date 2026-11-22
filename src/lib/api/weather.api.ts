import type { CropAdvice, FrostRisk, PlantingAdvice, WeatherConditions } from "@/lib/types/api";
import { api, asList, readAs } from "./farmnomad";

/**
 * Weather & planting (spec §7.13), all through the Spring Boot API:
 *   GET /weather/conditions?lat=&lon= → WeatherConditions (soil temp at 6 cm, frost risk, rain)
 *   GET /weather/planting?lat=&lon=   → PlantingAdvice    (readyToPlantOut / readyToSow, with blockers and warnings)
 * The crop calendar lives in the AI service; there is deliberately no calendar in this codebase.
 */
type At = { lat: number; lon: number };
const FROST_VALUES: Record<FrostRisk, true> = { NONE: true, LOW: true, MEDIUM: true, HIGH: true };

/** A field sent as null reads as "not sent": the widgets only check for undefined. */
const withoutNulls = (o: object) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null));

function readConditions(data: unknown): WeatherConditions | null {
  if (!data || typeof data !== "object") return null;
  const c = withoutNulls(data) as Partial<WeatherConditions>;
  if (!Number.isFinite(c.soilTemp6cm) || !Number.isFinite(c.rainNext24hMm) || !c.frostRisk || !Object.hasOwn(FROST_VALUES, c.frostRisk)) return null;
  const daily = Array.isArray(c.daily) && c.daily.every((d) => Number.isFinite(d?.tempMax) && Number.isFinite(d?.tempMin) && Number.isFinite(d?.rainMm)) ? c.daily : undefined;
  return { ...(c as WeatherConditions), daily };
}

function readPlanting(data: unknown): PlantingAdvice | null {
  const p = data as { readyToPlantOut?: unknown; readyToSow?: unknown; notReady?: unknown } | null;
  const crops = (list: unknown) => asList<CropAdvice>(list)?.map((a) => ({ ...(withoutNulls(a) as CropAdvice), blockers: a.blockers ?? [], warnings: a.warnings ?? [] }));
  const readyToPlantOut = crops(p?.readyToPlantOut);
  const readyToSow = crops(p?.readyToSow);
  return readyToPlantOut && readyToSow ? { readyToPlantOut, readyToSow, notReady: crops(p?.notReady) } : null;
}

const weatherApi = api.injectEndpoints({
  endpoints: (b) => ({
    conditions: b.query<WeatherConditions, At>({
      queryFn: ({ lat, lon }, _api, _extra, fetch) => readAs(fetch, { url: "/weather/conditions", params: { lat, lon } }, readConditions),
    }),
    planting: b.query<PlantingAdvice, At>({
      queryFn: ({ lat, lon }, _api, _extra, fetch) => readAs(fetch, { url: "/weather/planting", params: { lat, lon } }, readPlanting),
    }),
  }),
});

export const { useConditionsQuery, usePlantingQuery } = weatherApi;

export type Place = { lat: number; lon: number; postcode: string; name: string };

/**
 * UK postcode → coordinates via postcodes.io (public, no key), called straight from the browser.
 * Not part of our API on purpose: it's a free lookup with no secrets.
 */
export async function lookupPostcode(postcode: string): Promise<Place> {
  const clean = postcode.trim().toUpperCase();
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
  const json = (await res.json().catch(() => null)) as { status?: number; result?: { latitude: number; longitude: number; postcode: string; admin_district?: string; parish?: string; region?: string } } | null;
  if (!res.ok || !json?.result) throw new Error(res.status === 404 ? "We couldn't find that postcode." : "Postcode lookup isn't working right now.");
  const r = json.result;
  return { lat: r.latitude, lon: r.longitude, postcode: r.postcode, name: r.admin_district ?? r.parish ?? r.region ?? r.postcode };
}
