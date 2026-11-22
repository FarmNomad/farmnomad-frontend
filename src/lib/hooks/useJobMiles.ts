"use client";

import { useEffect, useState } from "react";
import { lookupPostcode, type Place } from "@/lib/api/weather.api";

const POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/gi;
// Roads run about this much longer than a straight line in the UK.
const ROAD_FACTOR = 1.3;
const EARTH_MILES = 3958.8;

/** The last postcode in an address, or null. */
function postcodeIn(address?: string | null) {
  const found = [...(address ?? "").matchAll(POSTCODE)].pop();
  return found ? `${found[1]} ${found[2]}`.toUpperCase() : null;
}

// One lookup per postcode for the visit. Only the postcode is sent, never the name or street.
const places = new Map<string, Promise<Place>>();
function place(postcode: string) {
  let found = places.get(postcode);
  if (!found) {
    found = lookupPostcode(postcode);
    places.set(postcode, found);
    found.catch(() => places.delete(postcode));
  }
  return found;
}

function roadMiles(a: Place, b: Place) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.sqrt(h)) * ROAD_FACTOR;
}

/**
 * Rough road miles from pickup to drop-off: undefined while working it out, null when it can't be.
 * An estimate for choosing jobs. Never price a delivery from it: that belongs on the server.
 */
export function useJobMiles(pickup?: string | null, dropOff?: string | null): number | null | undefined {
  const from = postcodeIn(pickup);
  const to = postcodeIn(dropOff);
  const key = from && to ? `${from}>${to}` : null;
  const [found, setFound] = useState<{ key: string; miles: number | null }>();

  useEffect(() => {
    if (!from || !to) return;
    let live = true;
    const done = (miles: number | null) => live && setFound({ key: `${from}>${to}`, miles });
    Promise.all([place(from), place(to)]).then(
      ([a, b]) => done(roadMiles(a, b)),
      () => done(null),
    );
    return () => {
      live = false;
    };
  }, [from, to]);

  if (!key) return null;
  return found?.key === key ? found.miles : undefined;
}
