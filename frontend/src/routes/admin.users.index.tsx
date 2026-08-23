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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import {
  Calendar,
  Check,
  ChevronsUpDown,
  Download,
  Eye,
  Filter,
  KeyRound,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sliders,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/frontend/components/admin/shell";

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
  const [sortField, setSortField] = useState<string>("id");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

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
      const statusFilter = appliedFilters.status !== "all" ? appliedFilters.status : searchStatus;
      if (statusFilter !== "all") {
        if (u.status !== statusFilter) return false;
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
  }, [users, appliedFilters, searchName, searchEmail, searchPhone, searchStatus, startDate, endDate, sortField, sortAsc]);

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
    const nextStatus = targetUser?.status === "Activated" ? "Deactivated" : "Activated";
    await updateAdminUser(userId, { status: nextStatus });
    toast.success(`User ${targetUser?.fullName || targetUser?.email || "account"} is now ${nextStatus}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const handleDeleteUser = async (userOrId: AdminUser | string) => {
    const userId = typeof userOrId === "string" ? userOrId : userOrId.id;
    const targetUser = users.find((u) => u.id === userId);
    await deleteAdminUser(userId);
    toast.success(`User ${targetUser?.fullName || targetUser?.email || "account"} deleted successfully`);
    setActiveAction(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const handleUpdateUser = async (userId: string, updatedData: Partial<AdminUser>) => {
    await updateAdminUser(userId, updatedData);
    toast.success("User profile updated successfully");
    setActiveAction(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  return (
    <div className="space-y-5 text-slate-800">
      <PageHeader
  title="User Management"
  breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Users" }]}
  actions={
    <PageActions
      onSearchToggle={() => setIsSearchOpen((v) => !v)}
      isSearchOpen={isSearchOpen}
      onExport={() => downloadCsv("users-list.csv", filteredUsers.map((u, i) => ({ "#": i + 1, "Name": u.fullName || "", "E-mail": u.email || "", "Phone Number": u.phone || "", "Wallet Balance": (typeof u.walletBalance === "number" ? u.walletBalance : 0).toFixed(2), "Status": u.status || "Activated", "Registered On": u.registeredOn || u.createdAt?.slice(0, 10) || "" })))}
      addNewLabel="Add New User"
      addNewTo="/admin/users/create"
    />
  }
/>

      {/* Collapsible Search & Filter Card */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Search Name</Label>
                <Input
                  placeholder="Search Name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Search Email</Label>
                <Input
                  placeholder="Search Email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Search Phone Number</Label>
                <Input
                  placeholder="Search Phone Number"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Status</Label>
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">Select Status (All)</SelectItem>
                    <SelectItem value="Activated" className="text-xs text-emerald-600 font-bold">Activated</SelectItem>
                    <SelectItem value="Deactivated" className="text-xs text-rose-600 font-bold">Deactivated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Start Date</Label>
                <AdminDateInput
                  placeholder="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">End Date</Label>
                <AdminDateInput
                  placeholder="End Date"
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilter}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-9 px-4 rounded-lg"
              >
                <RotateCcw className="size-3.5 me-1.5" /> Reset
              </Button>
              <Button
                type="submit"
                size="sm"
                className="font-bold text-xs h-9 px-5 rounded-lg shadow-sm"
              >
                <Filter className="size-3.5 me-1.5" /> Filter
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Table Card */}
      <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs">
        {/* Table Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-20 text-xs bg-slate-50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Total {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("fullName")}
                >
                  <div className="flex items-center gap-1">
                    Name <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    E-mail <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("phone")}
                >
                  <div className="flex items-center gap-1">
                    Phone Number <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("walletBalance")}
                >
                  <div className="flex items-center gap-1">
                    <div>
                      <div>Wallet</div>
                      <div className="text-[11px] font-normal text-slate-400">Balance</div>
                    </div>
                    <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0 ms-1" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-center cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Status <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("registeredOn")}
                >
                  <div className="flex items-center gap-1">
                    <div>
                      <div>Registered</div>
                      <div className="text-[11px] font-normal text-slate-400">On</div>
                    </div>
                    <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0 ms-1" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-16">
                  <div className="flex items-center justify-center gap-1 text-slate-600 font-bold">
                    Action <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isPending ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading users directory...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No users found matching your search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = user.status === "Activated";
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
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3.5 text-center font-medium text-slate-500">{globalIdx}</td>
                      <td className="px-3 py-3.5 font-medium text-slate-800 truncate max-w-[150px]">
                        {displayName}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 truncate max-w-[180px]">
                        {user.email || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">
                        {user.phone || "—"}
                      </td>
                      <td className="px-3 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                        <div className="text-[11px] text-slate-500 font-semibold">AED</div>
                        <div className="font-bold text-slate-900">
                          {(typeof user.walletBalance === "number" ? user.walletBalance : 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            isActivated
                              ? "bg-emerald-100/70 text-emerald-600"
                              : "bg-rose-100/70 text-rose-600"
                          }`}
                        >
                          {user.status || "Activated"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-700 text-xs whitespace-nowrap">
                        <div>{registeredDate}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{registeredTime}</div>
                      </td>

                      {/* 6 Action Icons */}
                      <td className="px-2 py-3 text-center align-middle">
                        <div className="flex items-center gap-1">
                          <ActionIconButton icon={isActivated ? X : Check} label={isActivated ? "Deactivate" : "Activate"} action={isActivated ? "toggle_off" : "toggle_on"} onClick={() => handleOpenAction(user, "toggle_status")} />
                          <ActionIconButton icon={Sliders} label="Edit" action="edit" to="/admin/users/edit" search={{ id: user.id }} />
                          <ActionIconButton icon={Eye} label="View" action="view" onClick={() => handleOpenAction(user, "info")} />
                          <ActionIconButton icon={KeyRound} label="Password" action="password" onClick={() => handleOpenAction(user, "password")} />
                          <ActionIconButton icon={Trash2} label="Delete" action="delete" onClick={() => handleOpenAction(user, "delete")} />
                          <ActionIconButton icon={Send} label="Send" action="send" onClick={() => handleOpenAction(user, "send_credentials")} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} entries
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-8 px-2 text-xs rounded-lg"
            >
              ‹
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                type="button"
                variant={p === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(p)}
                className={`h-8 w-8 p-0 text-xs font-bold rounded-lg ${
                  p === currentPage ? "" : "text-slate-600"
                }`}
              >
                {p}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-8 px-2 text-xs rounded-lg"
            >
              ›
            </Button>
          </div>
        </div>
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
