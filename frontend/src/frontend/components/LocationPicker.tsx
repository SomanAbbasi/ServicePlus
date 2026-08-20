/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";

import { reverseGeocode, searchPlaces } from "@/frontend/lib/api-services";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { toast } from "sonner";

import { DUBAI_CENTER, loadMapboxGl, MAPBOX_ACCESS_TOKEN } from "@/frontend/lib/mapbox";
import { isInDubai } from "@/frontend/lib/service-area";
import type { SavedLocation } from "@/frontend/lib/location";
import { useLocale } from "@/frontend/lib/locale";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (location: SavedLocation) => void;
}

// Strictly restrict map panning to Dubai Emirate area
const DUBAI_MAP_BOUNDS: [[number, number], [number, number]] = [
  [54.8, 24.72], // SW (lng, lat)
  [55.75, 25.45], // NE (lng, lat)
];

export function LocationPicker({ open, onOpenChange, onSelect }: Props) {
  const { t } = useLocale();
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [coords, setCoords] = useState(DUBAI_CENTER);
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; name: string; address: string; lat: number; lng: number }>
  >([]);
  const [busy, setBusy] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [areaError, setAreaError] = useState<string | null>(null);

  /** Reject anything outside Dubai and clear the pick. */
  function rejectOutsideDubai() {
    setAreaError(t("loc.outsideDubai"));
    toast.error(t("loc.outsideDubai"));
    setAddress("");
    moveMarker(DUBAI_CENTER.lat, DUBAI_CENTER.lng);
  }

  // Load the map lazily, only while the dialog is open.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    if (!MAPBOX_ACCESS_TOKEN) {
      setMapError(t("loc.mapUnavailable"));
      return;
    }

    loadMapboxGl()
      .then((mapboxgl) => {
        if (cancelled || !mapEl.current) return;
        const map = new mapboxgl.Map({
          container: mapEl.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [coords.lng, coords.lat],
          zoom: 14,
          maxBounds: DUBAI_MAP_BOUNDS,
        });

        const marker = new mapboxgl.Marker({ draggable: true, color: "#00b4d8" })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map);

        mapRef.current = map;
        markerRef.current = marker;

        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          void pickPoint(lngLat.lat, lngLat.lng, false);
        });

        marker.getElement().addEventListener("click", (e: Event) => {
          e.stopPropagation();
          const lngLat = marker.getLngLat();
          void pickPoint(lngLat.lat, lngLat.lng, false);
        });

        map.on("click", (e: any) => {
          const { lat, lng } = e.lngLat;
          void pickPoint(lat, lng, true);
        });

        // Auto-fetch address for initial center on map load
        void pickPoint(coords.lat, coords.lng, false);
      })
      .catch(() => setMapError(t("loc.mapFailed")));

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function moveMarker(lat: number, lng: number) {
    setCoords({ lat, lng });
    if (markerRef.current) markerRef.current.setLngLat([lng, lat]);
    if (mapRef.current) mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
  }

  async function pickPoint(lat: number, lng: number, move: boolean) {
    if (move) moveMarker(lat, lng);
    else setCoords({ lat, lng });

    if (!isInDubai(null, lat, lng)) {
      rejectOutsideDubai();
      return;
    }

    setBusy(true);
    try {
      const found = await reverseGeocode(lat, lng);
      if (found && !isInDubai(found, lat, lng)) {
        rejectOutsideDubai();
        return;
      }
      setAreaError(null);
      if (found) {
        setAddress(found);
      }
    } catch {
      /* keep whatever the user typed */
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => void pickPoint(pos.coords.latitude, pos.coords.longitude, true),
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function runSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 3) {
      setResults([]);
      return;
    }
    try {
      setResults(await searchPlaces(value));
    } catch {
      setResults([]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("loc.title")}</DialogTitle>
          <DialogDescription>{t("loc.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search
              className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => void runSearch(e.target.value)}
              placeholder={t("home.searchArea")}
              className="ps-9"
              aria-label={t("loc.searchLabel")}
            />
          </div>

          {results.length ? (
            <ul className="max-h-40 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 px-3 py-2 text-start text-sm hover:bg-muted"
                    onClick={() => {
                      if (!isInDubai(r.address || r.name, r.lat, r.lng)) {
                        setResults([]);
                        setQuery("");
                        rejectOutsideDubai();
                        return;
                      }
                      setAreaError(null);
                      setAddress(r.address || r.name);
                      moveMarker(r.lat, r.lng);
                      setResults([]);
                      setQuery("");
                    }}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="block font-medium">{r.name}</span>
                      <span className="block text-xs text-muted-foreground">{r.address}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-border bg-muted">
            {mapError ? (
              <p className="p-6 text-center text-sm text-muted-foreground">{mapError}</p>
            ) : (
              <div ref={mapEl} className="h-56 w-full" role="application" aria-label="Map" />
            )}
          </div>

          <Button variant="outline" className="w-full" onClick={useMyLocation} disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Crosshair className="size-4" aria-hidden />
            )}
            {t("loc.useCurrent")}
          </Button>

          {areaError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {areaError}
            </p>
          ) : null}

          <div className="relative">
            <Input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setAreaError(null);
              }}
              placeholder={busy ? "Fetching address..." : t("loc.addressPlaceholder")}
              aria-label={t("loc.addressLabel")}
              className="pe-9"
            />
            {busy ? (
              <Loader2
                className="absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                aria-hidden
              />
            ) : null}
          </div>

          <Button
            className="w-full"
            disabled={!address.trim() || busy}
            onClick={() => {
              const value = address.trim();
              if (!isInDubai(value, coords.lat, coords.lng)) {
                rejectOutsideDubai();
                return;
              }
              onSelect({ address: value, lat: coords.lat, lng: coords.lng });
              onOpenChange(false);
            }}
          >
            {t("loc.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
