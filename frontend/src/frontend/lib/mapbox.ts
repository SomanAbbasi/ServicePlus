/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    mapboxgl?: any;
  }
}

export const MAPBOX_ACCESS_TOKEN = import.meta.env["VITE_MAPBOX_ACCESS_TOKEN"] as
  | string
  | undefined;

export const DUBAI_CENTER = { lat: 25.2048, lng: 55.2708 };

let loader: Promise<any> | null = null;

/** Loads Mapbox GL JS and CSS dynamically once and resolves with window.mapboxgl */
export function loadMapboxGl(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("Mapbox needs a browser"));
  if (window.mapboxgl) {
    if (MAPBOX_ACCESS_TOKEN) window.mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    return Promise.resolve(window.mapboxgl);
  }
  if (!MAPBOX_ACCESS_TOKEN) return Promise.reject(new Error("Mapbox access token missing"));
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    // 1. Inject CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css";
    document.head.appendChild(link);

    // 2. Inject JS
    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.js";
    script.async = true;
    script.onload = () => {
      if (window.mapboxgl) {
        window.mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
        resolve(window.mapboxgl);
      } else {
        reject(new Error("Mapbox GL failed to initialize"));
      }
    };
    script.onerror = () => reject(new Error("Mapbox GL script failed to load"));
    document.head.appendChild(script);
  });

  return loader;
}
