import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/team-leads")({
  component: () => <Outlet />,
});
