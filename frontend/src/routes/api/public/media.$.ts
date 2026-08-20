import { createFileRoute } from "@tanstack/react-router";

const API_BASE = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:3001";

/** Public read-through proxy for media stored in the backend. */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as Record<string, string>)["_splat"] ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const upstream = `${API_BASE}/media/${path}`;
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
