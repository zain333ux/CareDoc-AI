import { Loader2, FileText } from "lucide-react";

export default function DocumentLoading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white flex flex-col items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl max-w-sm w-full flex flex-col items-center text-center">
        <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping" />
          <div className="relative w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <FileText className="w-7 h-7 animate-pulse" />
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
          Loading Document Analysis
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
          Preparing medical summary, medications, and AI chat...
        </p>

        <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Opening...</span>
        </div>
      </div>
    </div>
  );
}
