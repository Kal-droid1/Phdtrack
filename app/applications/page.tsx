"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Application } from "@/types";
import { daysUntil, deadlineColor, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import Drawer from "@/components/ui/Drawer";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState from "@/components/ui/EmptyState";
import ApplicationForm from "@/components/applications/ApplicationForm";
import {
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Search,
  Wand2,
} from "lucide-react";
import QuickAddModal from "@/components/ui/QuickAddModal";

const statusFilters = ["All", "Applied", "Accepted", "Rejected", "Waitlisted"];

const dotColorClass: Record<"red" | "amber" | "green", string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
};

const countryFlags: Record<string, string> = {
  Norway: "🇳🇴",
  Finland: "🇫🇮",
  Germany: "🇩🇪",
  Switzerland: "🇨🇭",
  Netherlands: "🇳🇱",
  Denmark: "🇩🇰",
  Sweden: "🇸🇪",
  Portugal: "🇵🇹",
  Luxembourg: "🇱🇺",
};

const statusStyles: Record<string, string> = {
  Watching: "bg-gray-100 text-gray-700",
  Sent: "bg-gray-100 text-gray-700",
  Applied: "bg-blue-100 text-blue-700",
  Replied: "bg-blue-100 text-blue-700",
  "Under Review": "bg-purple-100 text-purple-700",
  Accepted: "bg-green-100 text-green-700",
  Interested: "bg-green-100 text-green-700",
  Awarded: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Declined: "bg-red-100 text-red-700",
  Waitlisted: "bg-amber-100 text-amber-700",
  "No Response": "bg-amber-100 text-amber-700",
};

function isOpeningSoon(openDate: string | null): boolean {
  if (!openDate) return false;
  const days = daysUntil(openDate);
  return days >= 0 && days <= 30;
}

function extractStipend(notes: string | null): string | null {
  if (!notes) return null;
  const match =
    notes.match(/(?:€|CHF)\s*[\d.,]+/i) ||
    notes.match(/[\d.,]+\s*(?:€|CHF)/i);
  return match ? match[0].trim() : null;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<
    Application | undefined
  >();

  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveApplication, setArchiveApplication] =
    useState<Application | null>(null);
  const [archiveLessons, setArchiveLessons] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteApplication, setDeleteApplication] =
    useState<Application | null>(null);

  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false);
  const [unarchiveApplication, setUnarchiveApplication] =
    useState<Application | null>(null);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<Application> | undefined>();

  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  async function fetchApplications() {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("deadline", { ascending: true });

    if (!error && data) {
      setApplications(data as Application[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchApplications();
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

  const activeApplications = applications.filter((a) => !a.archived);
  const archivedApplications = applications.filter((a) => a.archived);

  const filteredApplications = activeApplications.filter((a) => {
    const query = search.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(query) ||
      (a.university ?? "").toLowerCase().includes(query) ||
      (a.funding_body ?? "").toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredApplications.length / 10);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  function handleAdd() {
    setEditingApplication(undefined);
    setDrawerOpen(true);
  }

  function handleEdit(application: Application) {
    setEditingApplication(application);
    setDrawerOpen(true);
    setOpenMenuId(null);
  }

  function handleArchiveClick(application: Application) {
    setArchiveApplication(application);
    setArchiveLessons("");
    setArchiveModalOpen(true);
    setOpenMenuId(null);
  }

  async function handleArchiveConfirm() {
    if (!archiveApplication) return;

    await supabase
      .from("applications")
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        lessons: archiveLessons,
      })
      .eq("id", archiveApplication.id);

    setArchiveModalOpen(false);
    setArchiveApplication(null);
    fetchApplications();
  }

  function handleDeleteClick(application: Application) {
    setDeleteApplication(application);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteApplication) return;

    await supabase
      .from("applications")
      .delete()
      .eq("id", deleteApplication.id);

    setDeleteModalOpen(false);
    setDeleteApplication(null);
    fetchApplications();
  }

  function handleUnarchiveClick(application: Application) {
    setUnarchiveApplication(application);
    setUnarchiveModalOpen(true);
  }

  async function handleUnarchiveConfirm() {
    if (!unarchiveApplication) return;

    await supabase
      .from("applications")
      .update({
        archived: false,
        archived_at: null,
      })
      .eq("id", unarchiveApplication.id);

    setUnarchiveModalOpen(false);
    setUnarchiveApplication(null);
    fetchApplications();
  }

  function handleSave() {
    setDrawerOpen(false);
    setEditingApplication(undefined);
    setPrefillData(undefined);
    fetchApplications();
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
        body: JSON.stringify({ text, type: "application" }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Parsing failed");
      }

      setQuickAddOpen(false);
      setEditingApplication(undefined);
      setPrefillData(data as Partial<Application>);
      setDrawerOpen(true);
    } catch {
      setQuickAddError("Could not parse — please fill the form manually");
    } finally {
      setQuickAddLoading(false);
    }
  }

  async function handleAnalyzePriorities() {
    setAnalysisLoading(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("archived", false);

      if (error) throw error;

      const applications = (data ?? []) as Application[];
      const list = applications
        .map(
          (a) =>
            `${a.name} (status: ${a.status}, deadline: ${a.deadline || "none"}, notes: ${a.notes || "none"})`
        )
        .join("; ");

      const prompt = `You are a PhD application advisor. Analyze these applications and tell the user in plain text (max 100 words) which ones need immediate action, which are on track, and which can be deprioritized. Be specific with names and deadlines. No markdown, no bullet points.

Applications: ${list || "none"}`;

      const response = await fetch("/api/groq-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Analysis failed");

      setAnalysisText(result.text);
      setAnalysisOpen(true);
    } catch (err) {
      setAnalysisText(
        err instanceof Error ? err.message : "Could not analyze priorities"
      );
      setAnalysisOpen(true);
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function handleGenerateReport() {
    setReportLoading(true);
    try {
      const list = activeApplications
        .map(
          (a) =>
            `${a.name} (country: ${a.country || "unknown"}, status: ${a.status}, deadline: ${a.deadline || "none"})`
        )
        .join("; ");

      const prompt = `You are a PhD application assistant. Generate a short application report (max 150 words) based on this data. Plain text only, no markdown, no bullet points.

Cover these points:
1. How many applications per country
2. How many deadlines have already passed
3. How many deadlines are coming up in the next 30 days
4. Which applications are rejected
5. One sentence on what to focus on now

Applications: ${list || "none"}`;

      const response = await fetch("/api/groq-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Report failed");

      setReportText(result.text);
      setReportOpen(true);
    } catch (err) {
      setReportText(
        err instanceof Error ? err.message : "Could not generate report"
      );
      setReportOpen(true);
    } finally {
      setReportLoading(false);
    }
  }

  function renderDeadline(deadline: string | null) {
    if (!deadline) return <span className="text-sm text-gray-400">—</span>;

    const days = daysUntil(deadline);
    const color = deadlineColor(days);

    return (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColorClass[color]}`} />
        <div className="flex flex-col">
          <span className="text-sm text-gray-700">{formatDate(deadline)}</span>
          <span className="text-xs text-gray-500">
            {days < 0 ? `${Math.abs(days)} days ago` : `${days} days left`}
          </span>
        </div>
      </div>
    );
  }

  function renderActions(application: Application) {
    const isOpen = openMenuId === application.id;

    return (
      <div className="relative" data-menu="true">
        <button
          onClick={() => setOpenMenuId(isOpen ? null : application.id)}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          aria-label="Open actions"
        >
          <MoreVertical size={18} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
            <button
              onClick={() => {
                handleEdit(application);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={() => {
                handleArchiveClick(application);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Archive
            </button>
            <button
              onClick={() => {
                handleDeleteClick(application);
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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2d3436]">
          Applications
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          PhD programs and funding opportunities you are tracking.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search name, university, or funding body..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59] focus:border-transparent"
            />
          </div>

          <button
            onClick={handleAnalyzePriorities}
            disabled={analysisLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {analysisLoading && (
              <span className="w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
            )}
            Analyze Priorities
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={reportLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#4a7c59] bg-white border border-[#4a7c59] rounded-md hover:bg-[#4a7c59]/5 transition-colors disabled:opacity-50"
          >
            {reportLoading && (
              <span className="w-4 h-4 border-2 border-[#4a7c59] border-t-transparent rounded-full animate-spin" />
            )}
            Generate Report
          </button>
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
            + Add Application
          </button>
        </div>
      </div>

      {(() => {
        const statusCounts = activeApplications.reduce<Record<string, number>>(
          (acc, a) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
          },
          {}
        );
        const allCount = activeApplications.length;

        return (
          <div className="flex flex-wrap gap-2 mb-6">
            {statusFilters
              .filter((s) => {
                if (s === "All") return true;
                if (s === "Applied") return true;
                return (statusCounts[s] || 0) > 0;
              })
              .map((s) => {
                const count = s === "All" ? allCount : statusCounts[s] || 0;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      statusFilter === s
                        ? "bg-[#4a7c59] text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {s} ({count})
                  </button>
                );
              })}
          </div>
        );
      })()}

      {/* Stats summary */}
      {!loading && activeApplications.length > 0 && (
        <div className="mb-6 space-y-3">
          {/* By Country */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {Object.entries(
              activeApplications.reduce<Record<string, number>>((acc, a) => {
                const c = a.country || "Unknown";
                acc[c] = (acc[c] || 0) + 1;
                return acc;
              }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .map(([country, count]) => (
                <span
                  key={country}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-[#4a7c59] text-white whitespace-nowrap"
                >
                  {countryFlags[country] || "🌍"} {country} {count}
                </span>
              ))}
          </div>

          {/* By Status */}
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(
              activeApplications.reduce<Record<string, number>>((acc, a) => {
                acc[a.status] = (acc[a.status] || 0) + 1;
                return acc;
              }, {})
            )
              .filter(([status, count]) => status === "Applied" || count > 0)
              .map(([status, count]) => (
                <span
                  key={status}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                    statusStyles[status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {status} {count}
                </span>
              ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading applications...</div>
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          message="No applications found."
          actionLabel="Add Application"
          onAction={handleAdd}
        />
      ) : (
        <>
          {analysisOpen && analysisText && (
            <div className="mb-6 bg-white rounded-xl shadow-sm border-l-4 border-amber-500 p-5 relative">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-[#2d3436] whitespace-pre-line">
                  {analysisText}
                </p>
                <button
                  onClick={() => setAnalysisOpen(false)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                  aria-label="Dismiss analysis"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {reportOpen && reportText && (
            <div className="mb-6 bg-white rounded-xl shadow-sm border-l-4 border-[#4a7c59] p-5 relative">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-[#2d3436] whitespace-pre-line">
                  {reportText}
                </p>
                <button
                  onClick={() => setReportOpen(false)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                  aria-label="Dismiss report"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-visible">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Country
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Program
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Stipend
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase w-16">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#2d3436]">
                        {application.name}
                      </p>
                      {application.university && (
                        <p className="text-xs text-gray-500">
                          {application.university}
                        </p>
                      )}
                      {isOpeningSoon(application.open_date) && (
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          Opening soon
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#2d3436]">
                      {application.country || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#2d3436]">
                      {application.program || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {renderDeadline(application.deadline)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-[#2d3436]">
                      {extractStipend(application.notes) || "—"}
                    </td>
                    <td className="px-6 py-4 text-right relative overflow-visible">
                      {renderActions(application)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {paginatedApplications.map((application) => (
              <div
                key={application.id}
                className="bg-white rounded-xl shadow-sm p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#2d3436]">
                      {application.name}
                    </p>
                    {application.university && (
                      <p className="text-xs text-gray-500">
                        {application.university}
                      </p>
                    )}
                    {isOpeningSoon(application.open_date) && (
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Opening soon
                      </span>
                    )}
                  </div>
                  {renderActions(application)}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Country</span>
                    <span className="text-gray-700">
                      {application.country || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Program</span>
                    <span className="text-gray-700">
                      {application.program || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Deadline</span>
                    {renderDeadline(application.deadline)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Status</span>
                    <StatusBadge status={application.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Stipend</span>
                    <span className="text-gray-700">
                      {extractStipend(application.notes) || "—"}
                    </span>
                  </div>
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

      {/* Archived applications */}
      {archivedApplications.length > 0 && (
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
            Archived ({archivedApplications.length})
          </button>

          {archivedExpanded && (
            <div className="mt-4 space-y-4">
              {archivedApplications.map((application) => (
                <div
                  key={application.id}
                  className="bg-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {application.name} — {application.university || "—"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Archived on {formatDate(application.archived_at || "")}
                    </p>
                    {application.lessons && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Lessons:</span>{" "}
                        {application.lessons}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <button
                      onClick={() => handleUnarchiveClick(application)}
                      className="px-3 py-1.5 text-sm font-medium text-green-700 border border-green-200 rounded-md hover:bg-green-50 transition-colors"
                    >
                      Unarchive
                    </button>
                    <button
                      onClick={() => handleDeleteClick(application)}
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
          setEditingApplication(undefined);
          setPrefillData(undefined);
        }}
        title={
          editingApplication
            ? "Edit Application"
            : prefillData
            ? "Quick Add Application"
            : "Add Application"
        }
      >
        <ApplicationForm
          initialData={editingApplication}
          prefillData={prefillData}
          onSave={handleSave}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>

      <ConfirmModal
        isOpen={archiveModalOpen}
        onClose={() => {
          setArchiveModalOpen(false);
          setArchiveApplication(null);
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
          setDeleteApplication(null);
        }}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this application?"
      />

      <ConfirmModal
        isOpen={unarchiveModalOpen}
        onClose={() => {
          setUnarchiveModalOpen(false);
          setUnarchiveApplication(null);
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
