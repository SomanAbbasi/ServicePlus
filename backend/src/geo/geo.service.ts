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
    if (text.length < 3 || !this.configured) return [];

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${this.apiKey}&country=ae&bbox=54.8,24.72,55.75,25.45`;

      const res = await fetch(url);
      if (!res.ok) return [];
      const data = (await res.json()) as {
        features?: Array<{
          id?: string;
          text?: string;
          place_name?: string;
          center?: [number, number];
        }>;
      };
      return (data.features ?? []).slice(0, 6).map((f, i) => ({
        id: f.id ?? String(i),
        name: f.text ?? f.place_name ?? 'Unknown place',
        address: f.place_name ?? '',
        lat: f.center?.[1] ?? 0,
        lng: f.center?.[0] ?? 0,
      }));
    } catch {
      return [];
    }
  }
}

