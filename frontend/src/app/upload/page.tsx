"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, ArrowLeft, UploadCloud, CheckCircle2, Loader2 } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("discharge");
  const [language, setLanguage] = useState("english");
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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType);
      formData.append("user_id", "test_user"); 

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/upload`, {
        method: "POST",
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
      
      // Store summary temporarily
      localStorage.setItem(`doc_${data.document_id}`, JSON.stringify(data.summary));
      
      // Navigate to the real document
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
      <div className="fixed inset-0 bg-black/30 pointer-events-none z-[-1]"></div>
      
      {/* Header */}
      <header className="border-b border-white/40 bg-white/80 relative z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/" className="text-slate-600 hover:text-slate-900 p-2 -ml-2 rounded-full hover:bg-white/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold text-slate-800 tracking-tight">Upload new document</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 relative z-10 flex-grow w-full">
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
                className={`p-12 text-center border-b border-white/30 transition-all duration-300 ${file ? 'bg-primary/10' : 'hover:bg-white/50'}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {!file ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-5 bg-white/60 shadow-inner rounded-full">
                      <UploadCloud className="w-10 h-10 text-primary/80" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl text-slate-900">Drag and drop your PDF</h3>
                      <p className="text-sm text-slate-700 mt-1 mb-5">or click to browse files</p>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-semibold bg-white px-6 py-2 rounded-full text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"
                      >
                        Browse files
                      </button>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="p-5 bg-primary/20 rounded-full text-primary shadow-inner">
                      <FileText className="w-10 h-10" />
                    </div>
                    <h3 className="font-semibold text-xl text-slate-900">{file.name}</h3>
                    <p className="text-sm text-slate-700 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button 
                      onClick={() => setFile(null)}
                      className="text-sm font-medium text-slate-600 hover:text-destructive mt-3 transition-colors"
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
                    className="bg-red-50 border-l-4 border-red-500 p-4 m-6 rounded-r-xl"
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
              <div className="p-8 space-y-6">
                
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-800">Document Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setDocType("discharge")}
                      className={`p-4 rounded-xl border text-left transition-all ${docType === "discharge" ? "border-primary bg-primary/10 shadow-inner ring-1 ring-primary" : "border-white/50 bg-white/40 hover:bg-white/60 hover:border-white/70"}`}
                    >
                      <div className="font-semibold text-slate-900">Discharge Summary</div>
                      <div className="text-slate-600 text-xs mt-1 font-medium">Hospital instructions</div>
                    </button>
                    <button 
                      onClick={() => setDocType("prescription")}
                      className={`p-4 rounded-xl border text-left transition-all ${docType === "prescription" ? "border-primary bg-primary/10 shadow-inner ring-1 ring-primary" : "border-white/50 bg-white/40 hover:bg-white/60 hover:border-white/70"}`}
                    >
                      <div className="font-semibold text-slate-900">Prescription</div>
                      <div className="text-slate-600 text-xs mt-1 font-medium">Medication list</div>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-800">Output Language</label>
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-4 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                  >
                    <option value="english">English</option>
                    <option value="spanish">Español (Spanish)</option>
                    <option value="mandarin">中文 (Mandarin)</option>
                  </select>
                </div>

              </div>

              {/* Action Footer */}
              <div className="p-6 bg-white/30 border-t border-white/30 flex justify-end">
                <button 
                  onClick={handleUpload}
                  disabled={!file}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none transition-all"
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
