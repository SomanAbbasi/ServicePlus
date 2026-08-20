import { useCallback, useEffect, useState } from "react";

import { isInDubai } from "./service-area";

export interface SavedLocation {
  address: string;
  lat: number | null;
  lng: number | null;
}

const KEY = "serviceplus.location";
const EVENT = "serviceplus:location";

export function readLocation(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as SavedLocation;
    // Drop anything stored before we limited the service area to Dubai.
    if (!isInDubai(value.address, value.lat, value.lng)) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function writeLocation(value: SavedLocation) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Hydration-safe read of the visitor's chosen service location. */
export function useSavedLocation() {
  const [location, setLocation] = useState<SavedLocation | null>(null);

  useEffect(() => {
    const sync = () => setLocation(readLocation());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((value: SavedLocation) => {
    writeLocation(value);
    setLocation(value);
  }, []);

  return { location, save };
}
