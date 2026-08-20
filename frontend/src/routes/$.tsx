import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-slate-50/50 px-4 py-16 text-center">
      <div className="mx-auto max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <img
          src="/serviceplus-logo.webp"
          alt="ServicePlus"
          className="mx-auto h-12 w-auto object-contain"
        />
        <div className="space-y-2">
          <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-extrabold text-cyan-800">
            404 Error
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Sorry! The page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        <div>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-6 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-cyan-700"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
