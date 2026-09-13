"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, ArrowLeft, UploadCloud, CheckCircle2, Loader2, AlertCircle, ChevronDown, Check, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

export default function UploadPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("discharge"); // "discharge" | "prescription"
  const [language, setLanguage] = useState("english");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("caredoc_language");
    if (saved === "urdu" || saved === "english") setLanguage(saved);
  }, []);

  // Login is optional: users can upload as guest or logged in

  const [isProcessing, setIsProcessing] = useState(false);
  
  // Progress states to show the real steps happening
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    "Extracting text from PDF...",
    "Chunking and securely storing document...",
    "Agents analyzing medications & follow-ups...",
    "Simplifying medical jargon...",
    "Verifying claims against source document..."
  ];

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    
    // Simulate the 5 steps taking time in the UI
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < steps.length - 1) {
        setCurrentStep(step);
      }
    }, 2000); 

    try {
      const normalizedDocType = docType === "discharge" ? "discharge_summary" : "prescription";
      const userId = user ? user.id : "guest";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", normalizedDocType);
      formData.append("user_id", userId); 
      formData.append("language", language);

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/documents/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      clearInterval(interval);
      setCurrentStep(steps.length);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const detail = errorData?.detail || "Failed to process document. Please try again.";
        setErrorMsg(detail);
        setIsProcessing(false);
        return;
      }
      
      const data = await res.json();
      
      // Store summary in localStorage for quick rendering
      localStorage.setItem(`doc_${data.document_id}`, JSON.stringify({
        ...data.summary,
        doc_type: normalizedDocType,
        language: data.summary.language || language,
        filename: file.name
      }));
      localStorage.setItem("caredoc_language", language);
      
      // Navigate to document review
      router.push(`/document/${data.document_id}`);
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setErrorMsg(err.message || "Error processing document. Ensure backend is running on port 8000.");
      setIsProcessing(false);
    }
  };


  return (
    <div className="min-h-screen text-foreground relative flex flex-col">
      {/* Dark overlay for better legibility */}
      <div className="fixed inset-0 bg-black/25 pointer-events-none z-0"></div>
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-10 relative z-10 flex-grow w-full">
        {!authLoading && !user && (
          <div className="mb-4 bg-white/80 backdrop-blur-md border border-white/60 text-slate-700 px-4 py-2.5 rounded-2xl text-xs flex items-center justify-between shadow-xs">
            <span>💡 <strong>Guest mode:</strong> Upload and analyze documents freely. <Link href="/login" className="text-primary font-semibold underline hover:opacity-80">Log in</Link> or <Link href="/login?mode=signup" className="text-primary font-semibold underline hover:opacity-80">Sign up</Link> to permanently save records to your profile.</span>
          </div>
        )}
        <AnimatePresence mode="wait">
          
          {!isProcessing ? (
            <motion.div 
              key="upload-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white/85 border border-white/50 rounded-3xl shadow-2xl overflow-hidden"
            >
              
              {/* Drag and Drop Zone */}
              <div 
                className={`p-6 sm:p-10 text-center border-b border-white/30 transition-all duration-300 ${file ? 'bg-primary/10' : 'hover:bg-white/50'}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {!file ? (
                  <div className="flex flex-col items-center gap-3 sm:gap-4">
                    <div className="p-4 sm:p-5 bg-white/60 shadow-inner rounded-full">
                      <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-primary/80" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg sm:text-xl text-slate-900">Drag and drop your PDF</h3>
                      <p className="text-xs sm:text-sm text-slate-700 mt-1 mb-4">or click to browse files</p>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs sm:text-sm font-semibold bg-white px-6 py-2 rounded-full text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        Browse files
                      </button>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-2 sm:gap-3"
                  >
                    <div className="p-4 sm:p-5 bg-primary/20 rounded-full text-primary shadow-inner">
                      <FileText className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-xl text-slate-900 break-all max-w-full px-2">{file.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button 
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-xs sm:text-sm font-medium text-slate-600 hover:text-destructive mt-2 transition-colors cursor-pointer"
                    >
                      Remove file
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border-l-4 border-red-500 p-4 m-4 sm:m-6 rounded-r-xl"
                  >
                    <div className="flex items-start">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          {errorMsg}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Options */}
              <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
                
                {/* Document Type Selection */}
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-slate-800">Document Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setDocType("discharge")}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        docType === "discharge" 
                          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary" 
                          : "border-white/60 bg-white/60 hover:bg-white/80"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 text-sm sm:text-base leading-snug break-words">Discharge Summary</div>
                        <div className="text-slate-600 text-xs mt-0.5 leading-normal">Hospital instructions & care</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        docType === "discharge" ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                      }`}>
                        {docType === "discharge" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setDocType("prescription")}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        docType === "prescription" 
                          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary" 
                          : "border-white/60 bg-white/60 hover:bg-white/80"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 text-sm sm:text-base leading-snug break-words">Prescription</div>
                        <div className="text-slate-600 text-xs mt-0.5 leading-normal">Medication list & dosages</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        docType === "prescription" ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                      }`}>
                        {docType === "prescription" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Custom Output Language Dropdown */}
                <div className="space-y-2.5 relative" ref={langDropdownRef}>
                  <label id="output-language-label" className="text-sm font-semibold text-slate-800">Output Language</label>
                  
                  <div className="relative">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={langDropdownOpen}
                      onClick={() => setLangDropdownOpen((prev) => !prev)}
                      className="w-full p-3.5 sm:p-4 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl text-sm font-medium text-slate-800 flex items-center justify-between shadow-xs hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium text-slate-900">
                          {language === "urdu" ? "اردو (Urdu)" : "English"}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${langDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {langDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 4 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          role="listbox"
                          aria-labelledby="output-language-label"
                          className="absolute left-0 right-0 top-full z-50 mt-1 bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl shadow-xl overflow-hidden p-1.5 flex flex-col gap-1"
                        >
                          <button
                            type="button"
                            role="option"
                            aria-selected={language === "english"}
                            onClick={() => {
                              setLanguage("english");
                              setLangDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer ${
                              language === "english"
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 text-center text-xs font-bold text-slate-400">EN</span>
                              <span>English</span>
                            </div>
                            {language === "english" && <Check className="w-4 h-4 text-primary" />}
                          </button>

                          <button
                            type="button"
                            role="option"
                            aria-selected={language === "urdu"}
                            onClick={() => {
                              setLanguage("urdu");
                              setLangDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer ${
                              language === "urdu"
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 text-center text-xs font-bold text-slate-400">UR</span>
                              <span lang="ur">اردو (Urdu)</span>
                            </div>
                            {language === "urdu" && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Applies to your summary and chat. Medicine names, doses, dates, and source quotes stay as written.
                  </p>
                </div>

              </div>

              {/* Action Footer */}
              <div className="p-4 sm:p-6 bg-white/30 border-t border-white/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600 order-2 sm:order-1 text-center sm:text-left">
                  {file ? `Selected: ${file.name}` : "Upload a PDF document to continue"}
                </div>
                <button 
                  type="button"
                  onClick={handleUpload}
                  disabled={!file}
                  className="w-full sm:w-auto order-1 sm:order-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none transition-all cursor-pointer"
                >
                  Analyze Document
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="processing-state"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="bg-white/90 border border-white/60 rounded-3xl shadow-2xl p-12 flex flex-col items-center justify-center min-h-[450px]"
            >
              <div className="relative w-20 h-20 mb-8">
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                   className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold mb-10 text-slate-900">Processing your document</h2>
              
              <div className="w-full max-w-md space-y-5">
                {steps.map((step, index) => {
                  const isCompleted = index < currentStep;
                  const isActive = index === currentStep;
                  
                  return (
                    <motion.div 
                      key={index}
                      initial={false}
                      animate={{ 
                        opacity: isCompleted || isActive ? 1 : 0.4,
                        x: isActive ? 10 : 0
                      }}
                      className="flex items-center gap-4 text-sm font-medium"
                    >
                      {isCompleted ? (
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      ) : isActive ? (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-slate-300 flex-shrink-0" />
                      )}
                      <span className={isActive ? 'text-primary' : isCompleted ? 'text-slate-700' : 'text-slate-500'}>
                        {step}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
