"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Supervisor } from "@/types";
import { formatDate } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import Drawer from "@/components/ui/Drawer";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState from "@/components/ui/EmptyState";
import SupervisorForm from "@/components/supervisors/SupervisorForm";
import QuickAddModal from "@/components/ui/QuickAddModal";
import { MoreVertical, ChevronDown, ChevronUp, Search, Wand2 } from "lucide-react";

const statusFilters = [
  "All",
  "Sent",
  "Replied",
  "Interested",
  "Declined",
  "No Response",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<
    Supervisor | undefined
  >();

  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveSupervisor, setArchiveSupervisor] = useState<Supervisor | null>(
    null
  );
  const [archiveLessons, setArchiveLessons] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSupervisor, setDeleteSupervisor] = useState<Supervisor | null>(
    null
  );

  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false);
  const [unarchiveSupervisor, setUnarchiveSupervisor] =
    useState<Supervisor | null>(null);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<Supervisor> | undefined>();

  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  async function fetchSupervisors() {
    setLoading(true);
    const { data, error } = await supabase
      .from("supervisors")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSupervisors(data as Supervisor[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSupervisors();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu]")) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeSupervisors = supervisors.filter((s) => !s.archived);
  const archivedSupervisors = supervisors.filter((s) => s.archived);

  const filteredSupervisors = activeSupervisors.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.university.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSupervisors.length / 10);
  const paginatedSupervisors = filteredSupervisors.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  function handleAdd() {
    setEditingSupervisor(undefined);
    setDrawerOpen(true);
  }

  function handleEdit(supervisor: Supervisor) {
    setEditingSupervisor(supervisor);
    setDrawerOpen(true);
    setOpenMenuId(null);
  }

  function handleArchiveClick(supervisor: Supervisor) {
    setArchiveSupervisor(supervisor);
    setArchiveLessons("");
    setArchiveModalOpen(true);
    setOpenMenuId(null);
  }

  async function handleArchiveConfirm() {
    if (!archiveSupervisor) return;

    await supabase
      .from("supervisors")
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        lessons: archiveLessons,
      })
      .eq("id", archiveSupervisor.id);

    setArchiveModalOpen(false);
    setArchiveSupervisor(null);
    fetchSupervisors();
  }

  function handleDeleteClick(supervisor: Supervisor) {
    setDeleteSupervisor(supervisor);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteSupervisor) return;

    await supabase.from("supervisors").delete().eq("id", deleteSupervisor.id);

    setDeleteModalOpen(false);
    setDeleteSupervisor(null);
    fetchSupervisors();
  }

  function handleUnarchiveClick(supervisor: Supervisor) {
    setUnarchiveSupervisor(supervisor);
    setUnarchiveModalOpen(true);
  }

  async function handleUnarchiveConfirm() {
    if (!unarchiveSupervisor) return;

    await supabase
      .from("supervisors")
      .update({
        archived: false,
        archived_at: null,
      })
      .eq("id", unarchiveSupervisor.id);

    setUnarchiveModalOpen(false);
    setUnarchiveSupervisor(null);
    fetchSupervisors();
  }

  function handleSave() {
    setDrawerOpen(false);
    setEditingSupervisor(undefined);
    setPrefillData(undefined);
    fetchSupervisors();
  }

  function handleQuickAdd() {
    setQuickAddError(null);
    setPrefillData(undefined);
    setQuickAddOpen(true);
  }

  async function handleParseQuickAdd(text: string) {
    setQuickAddLoading(true);
    setQuickAddError(null);

    try {
      const response = await fetch("/api/parse-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type: "supervisor" }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Parsing failed");
      }

      setQuickAddOpen(false);
      setEditingSupervisor(undefined);
      setPrefillData(data as Partial<Supervisor>);
      setDrawerOpen(true);
    } catch {
      setQuickAddError("Could not parse — please fill the form manually");
    } finally {
      setQuickAddLoading(false);
    }
  }

  function renderActions(supervisor: Supervisor) {
    const isOpen = openMenuId === supervisor.id;

    return (
      <div className="relative" data-menu="true">
        <button
          onClick={() => setOpenMenuId(isOpen ? null : supervisor.id)}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          aria-label="Open actions"
        >
          <MoreVertical size={18} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
            <button
              onClick={() => {
                handleEdit(supervisor);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={() => {
                handleArchiveClick(supervisor);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Archive
            </button>
            <button
              onClick={() => {
                handleDeleteClick(supervisor);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderAvatar(supervisor: Supervisor) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#4a7c59] text-white flex items-center justify-center text-sm font-semibold shrink-0">
        {getInitials(supervisor.name)}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2d3436]">
          Supervisor Outreach
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Professors you have contacted about PhD positions.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search name or university..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59] focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#4a7c59] bg-white border border-[#4a7c59] rounded-md hover:bg-[#4a7c59]/5 transition-colors"
          >
            <Wand2 size={18} />
            Quick Add
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 text-sm font-medium text-white bg-[#4a7c59] rounded-md hover:bg-[#3e6b4b] transition-colors"
          >
            + Add Professor
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              statusFilter === s
                ? "bg-[#4a7c59] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading supervisors...</div>
      ) : filteredSupervisors.length === 0 ? (
        <EmptyState
          message="No supervisors found."
          actionLabel="Add Professor"
          onAction={handleAdd}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-visible">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Name + Title
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    University
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Date Contacted
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase w-16">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedSupervisors.map((supervisor) => (
                  <tr key={supervisor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {renderAvatar(supervisor)}
                        <div>
                          <p className="text-sm font-medium text-[#2d3436]">
                            {supervisor.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {supervisor.title || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#2d3436]">
                      {supervisor.university}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {supervisor.date_contacted
                        ? formatDate(supervisor.date_contacted)
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {supervisor.email || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={supervisor.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {supervisor.notes || "—"}
                    </td>
                    <td className="px-6 py-4 text-right relative overflow-visible">
                      {renderActions(supervisor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {paginatedSupervisors.map((supervisor) => (
              <div
                key={supervisor.id}
                className="bg-white rounded-xl shadow-sm p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {renderAvatar(supervisor)}
                    <div>
                      <p className="text-sm font-medium text-[#2d3436]">
                        {supervisor.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {supervisor.title && `${supervisor.title} • `}
                        {supervisor.university}
                      </p>
                    </div>
                  </div>
                  {renderActions(supervisor)}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-700">
                      {supervisor.email || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Contacted</span>
                    <span className="text-gray-700">
                      {supervisor.date_contacted
                        ? formatDate(supervisor.date_contacted)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Status</span>
                    <StatusBadge status={supervisor.status} />
                  </div>
                  {supervisor.notes && (
                    <p className="text-sm text-gray-600">{supervisor.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Archived supervisors */}
      {archivedSupervisors.length > 0 && (
        <div className="mt-10">
          <button
            onClick={() => setArchivedExpanded(!archivedExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {archivedExpanded ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
            Archived Supervisors ({archivedSupervisors.length})
          </button>

          {archivedExpanded && (
            <div className="mt-4 space-y-4">
              {archivedSupervisors.map((supervisor) => (
                <div
                  key={supervisor.id}
                  className="bg-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {supervisor.name} — {supervisor.university}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Archived on {formatDate(supervisor.archived_at || "")}
                    </p>
                    {supervisor.lessons && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Lessons:</span>{" "}
                        {supervisor.lessons}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <button
                      onClick={() => handleUnarchiveClick(supervisor)}
                      className="px-3 py-1.5 text-sm font-medium text-green-700 border border-green-200 rounded-md hover:bg-green-50 transition-colors"
                    >
                      Unarchive
                    </button>
                    <button
                      onClick={() => handleDeleteClick(supervisor)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Drawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingSupervisor(undefined);
          setPrefillData(undefined);
        }}
        title={
          editingSupervisor
            ? "Edit Professor"
            : prefillData
            ? "Quick Add Professor"
            : "Add Professor"
        }
      >
        <SupervisorForm
          initialData={editingSupervisor}
          prefillData={prefillData}
          onSave={handleSave}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>

      <ConfirmModal
        isOpen={archiveModalOpen}
        onClose={() => {
          setArchiveModalOpen(false);
          setArchiveSupervisor(null);
        }}
        onConfirm={handleArchiveConfirm}
        message="What did you learn from this?"
      >
        <textarea
          rows={4}
          value={archiveLessons}
          onChange={(e) => setArchiveLessons(e.target.value)}
          placeholder="Write your lessons learned..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59] focus:border-transparent resize-none"
        />
      </ConfirmModal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteSupervisor(null);
        }}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this supervisor?"
      />

      <ConfirmModal
        isOpen={unarchiveModalOpen}
        onClose={() => {
          setUnarchiveModalOpen(false);
          setUnarchiveSupervisor(null);
        }}
        onConfirm={handleUnarchiveConfirm}
        message="Move this back to your active list?"
      />

      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onParse={handleParseQuickAdd}
        loading={quickAddLoading}
        error={quickAddError}
      />
    </div>
  );
}
