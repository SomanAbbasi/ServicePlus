import { createFileRoute } from "@tanstack/react-router";

const PROD_API_ORIGIN = "https://service-plus-henna.vercel.app";
const RAW_API_BASE = import.meta.env["VITE_API_BASE_URL"] ?? "https://service-plus-henna.vercel.app/api";
const API_ORIGIN = RAW_API_BASE.replace(/\/api\/?$/, "") || PROD_API_ORIGIN;

/** Public read-through proxy for media stored in the backend. */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as Record<string, string>)["_splat"] ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const upstream = `${API_ORIGIN}/api/media/${path}`;
        const res = await fetch(upstream);
        if (!res.ok) return new Response("Not found", { status: 404 });

        const contentType = res.headers.get("Content-Type") ?? "image/jpeg";
        const body = await res.arrayBuffer();

        return new Response(body, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
