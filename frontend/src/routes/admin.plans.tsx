import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/plans")({
  component: () => <Outlet />,
});
