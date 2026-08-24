import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminUser } from "@/frontend/lib/admin-mock-data";
import {
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { UserActionModals } from "@/frontend/components/admin/UserActionModal";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";
import {
  Check,
  ChevronsUpDown,
  Eye,
  KeyRound,
  RotateCcw,
  Search,
  Send,
  Sliders,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  PageActions,
  StatusBadge,
  ActionIconButton,
  TablePagination,
  downloadCsv,
} from "@/frontend/components/admin/shell";
import { TYPOGRAPHY } from "@/frontend/lib/design-tokens";

export const Route = createFileRoute("/admin/users/")({ component: AdminUsersPage });

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data, isPending } = useAdminQuery("users", getAdminUsers);
  const users: AdminUser[] = (data as AdminUser[]) ?? [];

  // Controls for Search & Filters Panel
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchStatus, setSearchStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Applied Filter State
  const [appliedFilters, setAppliedFilters] = useState({
    name: "",
    email: "",
    phone: "",
    status: "all",
    startDate: "",
    endDate: "",
  });

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting state
  const [sortField, setSortField] = useState<string>("registeredOn");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Optimistic Status overrides
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>({});

  // Action modals state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [activeAction, setActiveAction] = useState<
    "edit" | "info" | "password" | "delete" | "send_credentials" | "toggle_status" | null
  >(null);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      name: searchName.trim().toLowerCase(),
      email: searchEmail.trim().toLowerCase(),
      phone: searchPhone.trim().toLowerCase(),
      status: searchStatus,
      startDate: startDate,
      endDate: endDate,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchName("");
    setSearchEmail("");
    setSearchPhone("");
    setSearchStatus("all");
    setStartDate("");
    setEndDate("");
    setAppliedFilters({
      name: "",
      email: "",
      phone: "",
      status: "all",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredUsers = useMemo(() => {
    const list = users.filter((u) => {
      const qName = (appliedFilters.name || searchName).trim().toLowerCase();
      if (qName) {
        const matchName = (u.fullName || "").toLowerCase().includes(qName);
        if (!matchName) return false;
      }
      const qEmail = (appliedFilters.email || searchEmail).trim().toLowerCase();
      if (qEmail) {
        const matchEmail = (u.email || "").toLowerCase().includes(qEmail);
        if (!matchEmail) return false;
      }
      const qPhone = (appliedFilters.phone || searchPhone).trim().toLowerCase();
      if (qPhone) {
        const matchPhone = (u.phone || "").toLowerCase().includes(qPhone);
        if (!matchPhone) return false;
      }
      const isAct = statusOverrides[u.id] !== undefined ? statusOverrides[u.id] : u.status === "Activated";
      const currentStatus = isAct ? "Activated" : "Deactivated";
      const statusFilter = appliedFilters.status !== "all" ? appliedFilters.status : searchStatus;
      if (statusFilter !== "all" && currentStatus !== statusFilter) {
        return false;
      }
      const start = appliedFilters.startDate || startDate;
      if (start) {
        const regDate = u.registeredOn || u.createdAt?.slice(0, 10) || "";
        if (regDate && regDate < start) return false;
      }
      const end = appliedFilters.endDate || endDate;
      if (end) {
        const regDate = u.registeredOn || u.createdAt?.slice(0, 10) || "";
        if (regDate && regDate > end) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let valA: any = (a as any)[sortField] ?? "";
      let valB: any = (b as any)[sortField] ?? "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [users, appliedFilters, searchName, searchEmail, searchPhone, searchStatus, startDate, endDate, sortField, sortAsc, statusOverrides]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleOpenAction = (
    user: AdminUser,
    action: "edit" | "info" | "password" | "delete" | "send_credentials" | "toggle_status",
  ) => {
    setSelectedUser(user);
    if (action === "toggle_status") {
      handleToggleUserStatus(user);
      return;
    }
    setActiveAction(action);
  };

  const handleToggleUserStatus = async (userOrId: AdminUser | string) => {
    const userId = typeof userOrId === "string" ? userOrId : userOrId.id;
    const targetUser = users.find((u) => u.id === userId);
    const isCurrentlyActive = statusOverrides[userId] !== undefined
      ? statusOverrides[userId]
      : targetUser?.status === "Activated";
    const nextIsActive = !isCurrentlyActive;
    const nextStatus = nextIsActive ? "Activated" : "Deactivated";

    // Immediate optimistic update
    setStatusOverrides((prev) => ({ ...prev, [userId]: nextIsActive }));

    try {
      await updateAdminUser(userId, { status: nextStatus });
      toast.success(`User ${targetUser?.fullName || targetUser?.email || "account"} is now ${nextStatus}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch {
      setStatusOverrides((prev) => ({ ...prev, [userId]: isCurrentlyActive }));
      toast.error("Failed to update status");
    }
  };

  const handleDeleteUser = async (userOrId: AdminUser | string) => {
    const userId = typeof userOrId === "string" ? userOrId : userOrId.id;
    await deleteAdminUser(userId);
    toast.success("User account deleted successfully");
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const handleUpdateUser = async (userId: string, updated: Partial<AdminUser>) => {
    await updateAdminUser(userId, updated);
    toast.success("User profile updated successfully");
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const handleExportCsv = () => {
    const exportData = filteredUsers.map((u, index) => {
      const isAct = statusOverrides[u.id] !== undefined ? statusOverrides[u.id] : u.status === "Activated";
      return {
        "#": index + 1,
        "Name": u.fullName || "—",
        "Email": u.email || "—",
        "Phone Number": u.phone || "—",
        "Wallet Balance (AED)": (typeof u.walletBalance === "number" ? u.walletBalance : 0).toFixed(2),
        "Status": isAct ? "Activated" : "Deactivated",
        "Registered On": u.registeredOn || u.createdAt?.slice(0, 10) || "—",
      };
    });
    downloadCsv(`users_export_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
    toast.success(`Exported ${exportData.length} records to CSV`);
  };

  return (
    <div className="space-y-5 text-slate-800">
      <PageHeader
        title="Users Management"
        description="Search, view profiles, manage wallet balances, and configure user statuses"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Users Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setIsSearchOpen((v) => !v)}
            isSearchOpen={isSearchOpen}
            onExport={handleExportCsv}
            addNewLabel="Add New User"
            addNewTo="/admin/users/create"
          />
        }
      />

      {/* Expandable Search & Filter Bar */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in-50 duration-150">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Filter Users Directory
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(false)}
                className="h-7 text-xs text-slate-400 hover:text-slate-700"
              >
                <X className="size-3.5 me-1" /> Close
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Name</Label>
                <Input
                  placeholder="Filter by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Email</Label>
                <Input
                  placeholder="Filter by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Phone</Label>
                <Input
                  placeholder="Filter by phone..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Status</Label>
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">
                      All Statuses
                    </SelectItem>
                    <SelectItem value="Activated" className="text-xs font-semibold">
                      Activated
                    </SelectItem>
                    <SelectItem value="Deactivated" className="text-xs font-semibold">
                      Deactivated
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Registered From</Label>
                <AdminDateInput value={startDate} onChange={setStartDate} placeholder="Start date" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Registered To</Label>
                <AdminDateInput value={endDate} onChange={setEndDate} placeholder="End date" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilter}
                className="h-10 px-4 text-xs font-bold border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                <RotateCcw className="size-3.5 me-1.5" /> Reset
              </Button>
              <Button
                type="submit"
                className="h-10 px-5 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-xs"
              >
                <Search className="size-3.5 me-1.5" /> Apply Filters
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Users Table Card with Sticky Actions Column */}
      <Card className="bg-white border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-semibold text-[13px]">
                <th className="px-3.5 py-3.5 text-center w-12">#</th>
                <th
                  className="px-3.5 py-3.5 text-start cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("fullName")}
                >
                  <div className="flex items-center gap-1">
                    Name <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3.5 py-3.5 text-start cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    E-mail <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3.5 py-3.5 text-start cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("phone")}
                >
                  <div className="flex items-center gap-1">
                    Phone Number <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3.5 py-3.5 text-start cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("walletBalance")}
                >
                  <div className="flex items-center gap-1">
                    Wallet Balance <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3.5 py-3.5 text-center cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Status <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3.5 py-3.5 text-start cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("registeredOn")}
                >
                  <div className="flex items-center gap-1">
                    Registered On <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>

                {/* Sticky Action Column on Right */}
                <th className="sticky end-0 bg-slate-50 z-10 px-4 py-3.5 text-center min-w-[210px] border-s border-slate-200">
                  <div className="flex items-center justify-center gap-1 text-slate-700 font-bold">
                    Action
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[14px] text-slate-800">
              {isPending ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Loading users directory...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No users found matching your search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = statusOverrides[user.id] !== undefined
                    ? statusOverrides[user.id]
                    : user.status === "Activated";
                  const displayName = user.fullName || user.email?.split("@")[0] || user.phone || "User";
                  const rawDate = user.registeredOn || user.createdAt;
                  let registeredDate = "—";
                  let registeredTime = "";
                  if (rawDate) {
                    if (rawDate.includes(" ")) {
                      const parts = rawDate.split(" ");
                      registeredDate = parts[0] || "—";
                      registeredTime = parts.slice(1).join(" ");
                    } else {
                      try {
                        const d = new Date(rawDate);
                        if (!isNaN(d.getTime())) {
                          registeredDate = d.toISOString().slice(0, 10);
                          registeredTime = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        } else {
                          registeredDate = rawDate;
                        }
                      } catch {
                        registeredDate = rawDate;
                      }
                    }
                  }

                  return (
                    <tr key={user.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>
                      <td className="px-3.5 py-3.5 font-medium text-slate-900 truncate max-w-[150px]">
                        {displayName}
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-600 truncate max-w-[180px]">
                        {user.email || "—"}
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-600 font-mono whitespace-nowrap">
                        {user.phone || "—"}
                      </td>
                      <td className="px-3.5 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                        <span className="font-extrabold text-slate-900">
                          AED {(typeof user.walletBalance === "number" ? user.walletBalance : 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={isActivated ? "Activated" : "Deactivated"} />
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-700 text-xs whitespace-nowrap font-mono">
                        <div>{registeredDate}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{registeredTime}</div>
                      </td>

                      {/* Sticky 6 Action Icons */}
                      <td className="sticky end-0 bg-white group-hover:bg-slate-50/90 z-10 px-3 py-3 text-center align-middle border-s border-slate-200/80 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-center gap-1">
                          <ActionIconButton
                            icon={isActivated ? X : Check}
                            label={isActivated ? "Deactivate" : "Activate"}
                            action={isActivated ? "toggle_off" : "toggle_on"}
                            onClick={() => handleToggleUserStatus(user)}
                          />
                          <ActionIconButton
                            icon={Sliders}
                            label="Edit"
                            action="edit"
                            to="/admin/users/edit"
                            search={{ id: user.id }}
                          />
                          <ActionIconButton
                            icon={Eye}
                            label="View Info"
                            action="view"
                            onClick={() => handleOpenAction(user, "info")}
                          />
                          <ActionIconButton
                            icon={KeyRound}
                            label="Change Password"
                            action="password"
                            onClick={() => handleOpenAction(user, "password")}
                          />
                          <ActionIconButton
                            icon={Trash2}
                            label="Delete"
                            action="delete"
                            onClick={() => handleOpenAction(user, "delete")}
                          />
                          <ActionIconButton
                            icon={Send}
                            label="Send Credentials"
                            action="send"
                            onClick={() => handleOpenAction(user, "send_credentials")}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredUsers.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Action Modals */}
      <UserActionModals
        user={selectedUser}
        activeAction={activeAction}
        onClose={() => {
          setActiveAction(null);
          setSelectedUser(null);
        }}
        onSaveEdit={handleUpdateUser}
        onDelete={handleDeleteUser}
        onToggleStatus={handleToggleUserStatus}
      />
    </div>
  );
}
