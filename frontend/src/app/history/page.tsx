"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Pill,
  Building2,
  Calendar,
  ArrowRight,
  Trash2,
  UploadCloud,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  X
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

interface DocumentSummary {
  medications?: any[];
  follow_up?: any[];
  precautions?: any[];
  simplified_text?: string;
  verification_notes?: any[];
}

interface SavedDocument {
  id: string;
  file_path: string;
  doc_type: string;
  original_language: string;
  status: string;
  created_at: string;
  extracted_summaries?: DocumentSummary[];
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "discharge" | "prescription">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const handleNavigate = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNavigatingId(docId);
    router.push(`/document/${docId}`);
  };

  // Delete confirmation modal state
  const [docToDelete, setDocToDelete] = useState<SavedDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && docToDelete && !isDeleting) {
        setDocToDelete(null);
        setDeleteError(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [docToDelete, isDeleting]);

  // Require auth
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Fetch documents for the logged in user
  const fetchDocuments = async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/documents/user/${user.id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setErrorMsg(errorData?.detail || "Unable to fetch saved records at this moment. Please click Retry.");
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      console.warn("fetchDocuments error:", err);
      setErrorMsg("Network error contacting server. Please ensure the backend is running and click Retry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDocuments();
    }
  }, [user?.id]);

  const openDeleteModal = (doc: SavedDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteError(null);
    setDocToDelete(doc);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDocToDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/documents/${docToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Delete failed");
      }

      // Remove from state & localStorage
      setDocuments(prev => prev.filter(d => d.id !== docToDelete.id));
      localStorage.removeItem(`doc_${docToDelete.id}`);
      setDocToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete document. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const isDischarge = doc.doc_type === "discharge_summary" || doc.doc_type === "discharge";
      const isPrescription = doc.doc_type === "prescription";

      if (activeFilter === "discharge" && !isDischarge) return false;
      if (activeFilter === "prescription" && !isPrescription) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const filename = (doc.file_path || "").toLowerCase();
        const summaryText = doc.extracted_summaries?.[0]?.simplified_text?.toLowerCase() || "";
        return filename.includes(q) || summaryText.includes(q);
      }

      return true;
    });
  }, [documents, activeFilter, searchQuery]);

  const dischargeCount = documents.filter(d => d.doc_type === "discharge_summary" || d.doc_type === "discharge").length;
  const prescriptionCount = documents.filter(d => d.doc_type === "prescription").length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-foreground selection:bg-primary selection:text-white relative">
      {/* Dark overlay for better legibility */}
      <div className="fixed inset-0 bg-black/25 pointer-events-none z-0"></div>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10 w-full flex-grow relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              My Medical Records
            </h1>

          </div>

          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md hover:opacity-95 transition-all self-start md:self-auto"
          >
            <UploadCloud className="w-4 h-4" />
            Upload New Document
          </Link>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          {/* Tabs */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              All Records ({documents.length})
            </button>
            <button
              onClick={() => setActiveFilter("discharge")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeFilter === "discharge"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Discharge Summaries ({dischargeCount})
            </button>
            <button
              onClick={() => setActiveFilter("prescription")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeFilter === "prescription"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <Pill className="w-3.5 h-3.5" />
              Prescriptions ({prescriptionCount})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary transition-all text-slate-900"
            />
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
            <button
              onClick={fetchDocuments}
              className="text-xs font-semibold underline text-red-800 hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading your medical records...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {documents.length === 0
                ? "No medical documents saved yet"
                : "No matching documents found"}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              {documents.length === 0
                ? "Upload your Hospital Discharge Summaries or Prescriptions to generate instant plain-language summaries and store them securely in your profile."
                : "Try adjusting your filter or search query."}
            </p>
            {documents.length === 0 && (
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm shadow-md hover:opacity-95 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Your First Document
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredDocs.map((doc) => {
                const isDischarge = doc.doc_type === "discharge_summary" || doc.doc_type === "discharge";
                const summary = doc.extracted_summaries?.[0];
                const medCount = summary?.medications?.length || 0;
                const followUpCount = summary?.follow_up?.length || 0;
                const precautionsCount = summary?.precautions?.length || 0;
                const formattedDate = doc.created_at
                  ? new Date(doc.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                  : "Recently";

                return (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`bg-white border rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden ${
                      navigatingId === doc.id
                        ? "border-primary/60 ring-2 ring-primary/10"
                        : "border-slate-200 hover:border-primary/40"
                    }`}
                  >
                    {/* Top navigation progress bar */}
                    {navigatingId === doc.id && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 overflow-hidden">
                        <div className="h-full bg-primary animate-pulse w-full" />
                      </div>
                    )}
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isDischarge
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                        >
                          {isDischarge ? (
                            <>
                              <Building2 className="w-3.5 h-3.5" />
                              Discharge Summary · Hospital instructions
                            </>
                          ) : (
                            <>
                              <Pill className="w-3.5 h-3.5" />
                              Prescription · Medication list
                            </>
                          )}
                        </span>

                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formattedDate}
                        </span>
                      </div>

                      {/* File Title */}
                      <h3 className="font-bold text-base text-slate-900 mb-2 truncate group-hover:text-primary transition-colors">
                        {doc.file_path || "Medical Document"}
                      </h3>

                      {/* Extraction Stats */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {medCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                            <Pill className="w-3 h-3 text-slate-500" />
                            {medCount} {medCount === 1 ? "Medicine" : "Medicines"}
                          </span>
                        )}
                        {followUpCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {followUpCount} {followUpCount === 1 ? "Follow-up" : "Follow-ups"}
                          </span>
                        )}
                        {precautionsCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3 text-slate-500" />
                            {precautionsCount} Precautions
                          </span>
                        )}
                      </div>

                      {/* Simplified Text Preview */}
                      {summary?.simplified_text && (
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {summary.simplified_text.replace(/[#*`_]/g, "").slice(0, 180)}...
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => openDeleteModal(doc, e)}
                        className="text-xs font-medium text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1.5 group/del"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5 group-hover/del:scale-110 transition-transform" />
                        <span>Delete</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleNavigate(doc.id, e)}
                        disabled={navigatingId === doc.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 group-hover:translate-x-0.5 transition-all cursor-pointer disabled:opacity-80"
                      >
                        {navigatingId === doc.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                            <span>Opening Summary...</span>
                          </>
                        ) : (
                          <>
                            <span>View Summary & Chat</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {docToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            onClick={closeDeleteModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close X button */}
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-red-600 shadow-xs">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Delete Medical Record?
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Are you sure you want to remove <span className="font-semibold text-slate-900 break-all">{docToDelete.file_path || "this document"}</span> and its AI summary from your profile?
                  </p>
                  <p className="text-xs text-red-600 font-medium mt-2 bg-red-50/60 border border-red-100 p-2 rounded-lg">
                    ⚠️ This action is permanent and cannot be undone.
                  </p>

                  {deleteError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                      {deleteError}
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeDeleteModal}
                      disabled={isDeleting}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={isDeleting}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Document</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
