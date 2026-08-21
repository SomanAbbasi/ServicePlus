import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/material-requests")({
  component: () => <Outlet />,
});
