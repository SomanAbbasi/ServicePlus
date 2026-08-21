import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

@Injectable()
export class GeoService {
  private apiKey: string | undefined;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('MAPBOX_API_KEY');
  }

  private get configured(): boolean {
    return Boolean(this.apiKey);
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (!this.configured) return null;

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        features?: Array<{ place_name?: string }>;
      };
      return data.features?.[0]?.place_name ?? null;
    } catch {
      return null;
    }
  }

  async searchPlaces(query: string): Promise<PlaceResult[]> {
    const text = query.trim();
    if (text.length < 2) return [];

    if (this.configured) {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${this.apiKey}&country=ae`;
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as {
            features?: Array<{
              id?: string;
              text?: string;
              place_name?: string;
              center?: [number, number];
            }>;
          };
          const results = (data.features ?? []).slice(0, 6).map((f, i) => ({
            id: f.id ?? String(i),
            name: f.text ?? f.place_name ?? 'Unknown place',
            address: f.place_name ?? '',
            lat: f.center?.[1] ?? 0,
            lng: f.center?.[0] ?? 0,
          }));
          if (results.length > 0) return results;
        }
      } catch {
        /* fallback to Nominatim below */
      }
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ae&q=${encodeURIComponent(text)}&limit=6`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ServicePlusApp/1.0' },
      });
      if (!res.ok) return [];
      const data = (await res.json()) as Array<{
        place_id: number;
        display_name: string;
        lat: string;
        lon: string;
      }>;
      return data.map((item) => {
        const parts = item.display_name.split(',');
        const primaryName = parts[0]?.trim() || item.display_name;
        const secondary = parts.slice(1).join(',').trim();
        return {
          id: String(item.place_id),
          name: primaryName,
          address: secondary || item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        };
      });
    } catch {
      return [];
    }
  }
}

