"use client";

import { useState, useEffect, Children, Fragment, cloneElement, isValidElement, type ReactNode } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Volume2, AlertTriangle, Send, FileText, CornerDownRight, Loader2, Download } from "lucide-react";
import { downloadMedicalSummaryPDF } from "@/lib/pdf-export";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = { id: number; role: "user" | "assistant"; content: string; citations?: string[]; isRefusal?: boolean };
const mockChatHistory: ChatMessage[] = [];
// Clean chat history on load

function isolateSourceValues(children: ReactNode): ReactNode {
  return Children.map(children, child => {
    if (typeof child === "string") {
      return child.split(/([A-Za-z0-9][A-Za-z0-9 \t.,:/%()+-]*)/g).map((part, index) =>
        index % 2 ? <Fragment key={index}><bdi dir="ltr">{part.trimEnd()}</bdi>{part.slice(part.trimEnd().length)}</Fragment> : part);
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children) {
      return cloneElement(child, {}, isolateSourceValues(child.props.children));
    }
    return child;
  });
}

export default function DocumentViewPage() {
  const params = useParams();
  const documentId = params.id as string;
  
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(mockChatHistory);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [docType, setDocType] = useState<string>("discharge_summary");
  const isUrdu = summaryData?.language === "urdu";
  const language = isUrdu ? "urdu" : "english";
  const t = (english: string, urdu: string) => isUrdu ? urdu : english;

  useEffect(() => {
    // 1. Try to load from localStorage first
    const saved = localStorage.getItem(`doc_${documentId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSummaryData(parsed);
        if (parsed.doc_type) setDocType(parsed.doc_type);
        return;
      } catch (e) {
        console.error("Failed to parse cached summary", e);
      }
    }

    // 2. Fetch from backend API if not in localStorage
    const fetchDoc = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/documents/${documentId}`);
        if (!res.ok) {
          setLoadFailed(true);
          return;
        }
        const data = await res.json();
        if (data.summary) {
          const fullSummary = {
            ...data.summary,
            filename: data.document?.file_path,
            doc_type: data.document?.doc_type,
            language: data.document?.original_language || "english",
          };
          setSummaryData(fullSummary);
          setDocType(data.document?.doc_type || "discharge_summary");
          localStorage.setItem(`doc_${documentId}`, JSON.stringify(fullSummary));
        } else {
          setLoadFailed(true);
        }

        if (data.chat_history && data.chat_history.length > 0) {
          setChatHistory(data.chat_history.map((m: any) => ({
            id: m.id || Date.now(),
            role: m.role,
            content: m.content,
            citations: m.citations || [],
            isRefusal: m.content?.includes("doesn't cover this")
          })));
        }
      } catch (err) {
        console.error("Failed to fetch document from API", err);
        setLoadFailed(true);
      }
    };

    fetchDoc();
  }, [documentId]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userQuery = chatInput;
    setChatInput("");
    
    // Add user message
    const newMsg: ChatMessage = { id: Date.now(), role: "user", content: userQuery };
    setChatHistory(prev => [...prev, newMsg]);
    setIsChatLoading(true);
    setChatError(null);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/documents/${documentId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: userQuery, language, protected_terms: [
          ...(summaryData.medications || []).flatMap((med: { name: string; dosage: string }) => [med.name, med.dosage]),
          ...(summaryData.follow_up || []).flatMap((item: { when?: string; who?: string }) => [item.when, item.who]),
        ].filter(Boolean).slice(0, 100) })
      });
      
      if (!res.ok) throw new Error("Chat failed");
      
      const data = await res.json();
      
      setChatHistory(prev => [...prev, {
        id: Date.now() + 1,
        role: "assistant",
        content: data.answer,
        citations: data.citations || [],
        isRefusal: data.is_refusal ?? data.answer.includes("doesn't cover this")
      }]);
    } catch (err) {
      console.error(err);
      setChatError(t("Could not get an answer. Please try again.", "جواب حاصل نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔"));
      setChatInput(userQuery);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (!summaryData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4 p-6">
        {loadFailed ? (
          <div className="text-center space-y-3">
            <p className="text-slate-600 font-medium">This document could not be found or loaded.</p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/history" className="text-primary font-semibold underline">View My Documents</Link>
              <Link href="/upload" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">Upload New Document</Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-slate-500">Loading document summary...</p>
          </div>
        )}
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const isDischarge = docType === "discharge_summary" || docType === "discharge";

  return (
    <div lang={isUrdu ? "ur" : "en"} dir={isUrdu ? "rtl" : "ltr"} className={`min-h-screen bg-background text-foreground flex flex-col lg:h-screen ${isUrdu ? "urdu-content" : ""}`}>
      
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0 print:border-none">
        <div className="max-w-7xl mx-auto px-6 min-h-16 py-2 gap-3 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/history" aria-label={t("Back to documents", "دستاویزات کی طرف واپس")} className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted/50 transition-colors print:hidden">
              <ArrowLeft className={`w-5 h-5 ${isUrdu ? "rotate-180" : ""}`} />
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <bdi className="font-medium break-all source-text text-sm sm:text-base">{summaryData.filename || t("Medical document", "طبی دستاویز")}</bdi>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              isDischarge 
                ? "bg-blue-50 text-blue-700 border-blue-200" 
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              {isDischarge 
                ? t("Discharge Summary · Hospital instructions", "ڈسچارج خلاصہ · ہسپتال کی ہدایات")
                : t("Prescription · Medication list", "نسخہ · ادویات کی فہرست")
              }
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              {t("Ready · English", "تیار · اردو")}
            </span>
            <button
              onClick={() => {
                try {
                  downloadMedicalSummaryPDF(summaryData, docType);
                } catch (e) {
                  console.error("PDF export error", e);
                  window.print();
                }
              }}
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:opacity-95 transition-all cursor-pointer print:hidden"
              title={t("Download PDF Summary", "پی ڈی ایف سمری ڈاؤن لوڈ کریں")}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t("Download PDF", "پی ڈی ایف ڈاؤن لوڈ")}</span>
            </button>
            <Link 
              href="/upload" 
              className="text-xs font-medium text-primary hover:underline px-2 py-1 print:hidden"
            >
              {t("+ Upload new", "+ نیا اپ لوڈ کریں")}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout: 2 Columns */}
      <main className="flex-grow lg:overflow-hidden max-w-7xl mx-auto w-full flex flex-col lg:flex-row">
        
        {/* Left Column: Summary Cards (Scrollable) */}
        <div className="w-full min-w-0 lg:w-3/5 p-6 lg:overflow-y-auto print:w-full print:p-0 print:overflow-visible">
          <motion.div 
            className="max-w-3xl mx-auto space-y-6 pb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            
            {/* Plain Language Summary */}
            <motion.section variants={itemVariants} className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">{t("Plain-language Summary", "آسان زبان میں خلاصہ")}</h2>
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={() => {
                      try {
                        downloadMedicalSummaryPDF(summaryData, docType);
                      } catch (e) {
                        console.error("PDF export error", e);
                        window.print();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    title={t("Download PDF Summary", "پی ڈی ایف سمری ڈاؤن لوڈ کریں")}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t("Download PDF", "پی ڈی ایف ڈاؤن لوڈ")}</span>
                  </button>
                  <button disabled className="text-muted-foreground opacity-50 p-2 rounded-full" title={t("Read aloud is not available yet", "آواز میں سننے کی سہولت ابھی دستیاب نہیں")} aria-label={t("Read aloud is not available yet", "آواز میں سننے کی سہولت ابھی دستیاب نہیں")}>
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="text-foreground leading-relaxed">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-semibold mt-6 mb-4 text-slate-900" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-5 mb-3 text-slate-900" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-4 mb-2 text-slate-800" {...props} />,
                    p: ({node, children, ...props}) => <p className="mb-4 text-slate-700" {...props}>{isUrdu ? isolateSourceValues(children) : children}</p>,
                    li: ({node, children, ...props}) => <li {...props}>{isUrdu ? isolateSourceValues(children) : children}</li>,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-700" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-slate-700" {...props} />,
                    table: ({node, ...props}) => <div className="overflow-x-auto mb-6 border border-slate-200 rounded-lg"><table className="min-w-full text-sm divide-y divide-slate-200" {...props} /></div>,
                    thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
                    th: ({node, ...props}) => <th className="px-4 py-3 text-left font-medium text-slate-600 uppercase tracking-wider" {...props} />,
                    td: ({node, children, ...props}) => <td className="px-4 py-3 border-t border-slate-200 text-slate-800" {...props}>{isUrdu ? isolateSourceValues(children) : children}</td>,
                    strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                  }}
                >
                  {summaryData.simplified_text || summaryData.simplifiedText}
                </ReactMarkdown>
              </div>
            </motion.section>

            {isUrdu && summaryData.original_simplified_text && (
              <details className="bg-card border border-border rounded-lg p-6">
                <summary className="cursor-pointer">اصل انگریزی خلاصہ دیکھیں</summary>
                <div dir="ltr" lang="en" className="source-text mt-4 whitespace-pre-wrap">{summaryData.original_simplified_text}</div>
              </details>
            )}
            {summaryData.verification_flags?.length > 0 && (
              <section role="note" className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h2>{t("Claims needing review", "ان باتوں کی تصدیق ضروری ہے")}</h2>
                <p>{t("These statements could not be confirmed against the document. Check the original instructions with your provider.", "ان باتوں کی دستاویز سے تصدیق نہیں ہو سکی۔ اصل ہدایات اپنے معالج سے چیک کریں۔")}</p>
                {summaryData.verification_flags.map((flag: { claim: string; issue: string }, index: number) => <p key={index} dir="auto" className="source-text mt-2">{flag.claim}: {flag.issue}</p>)}
              </section>
            )}

            {/* Medications */}
            <motion.section variants={itemVariants} className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">{t("Medications", "ادویات")}</h2>
              <div className="divide-y divide-border border border-border rounded-md overflow-hidden">
                {summaryData.medications.map((med: any, idx: number) => (
                  <div key={idx} className="p-4 bg-background">
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-2 mb-1">
                      <span className="font-medium"><bdi className="source-text">{med.name}</bdi> — <bdi className="source-text whitespace-nowrap">{med.dosage}</bdi></span>
                      {med.verified === false && (
                        <span className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" /> {t("Unverified", "غیر تصدیق شدہ")}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isUrdu ? isolateSourceValues(med.frequency_urdu || med.frequency) : med.frequency} · {isUrdu ? isolateSourceValues(med.duration_urdu || med.duration) : med.duration}
                    </div>
                    {isUrdu && <p dir="auto" lang="en" className="source-text mt-2">{med.frequency} · {med.duration}</p>}
                    {med.verified === false && (
                      <div className="text-xs text-amber-700/80 mt-2 flex items-center gap-1.5">
                        <CornerDownRight className="w-3 h-3" />
                        {t("Couldn't confirm this dosage against your document. Check with your provider.", "اس خوراک کی دستاویز سے تصدیق نہیں ہو سکی۔ اپنے معالج سے تصدیق کریں۔")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Follow-up */}
            <motion.section variants={itemVariants} className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">{t("Follow-up Plan", "اگلے معائنے کی ہدایات")}</h2>
              <ul className="space-y-3">
                {summaryData.follow_up.map((item: any, idx: number) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <span className="block text-foreground">{isUrdu ? isolateSourceValues(item.action_urdu || item.action) : item.action}</span>
                      <bdi className="block source-text text-muted-foreground mt-0.5">{item.when || item.date} {item.who ? `· ${item.who}` : ""}</bdi>
                      {isUrdu && <p dir="auto" lang="en" className="source-text mt-2">{item.action}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* Precautions */}
            <motion.section variants={itemVariants} className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">{t("Precautions & Warnings", "احتیاطی تدابیر اور انتباہات")}</h2>
              <ul className="space-y-3">
                {summaryData.precautions.map((item: any, idx: number) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div><span className="text-foreground leading-snug">{isUrdu ? isolateSourceValues(item.warning_urdu || item.warning) : item.warning}</span>
                    {isUrdu && <p dir="auto" lang="en" className="source-text mt-2">{item.warning}</p>}</div>
                  </li>
                ))}
              </ul>
            </motion.section>

          </motion.div>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="w-full min-w-0 shrink-0 lg:shrink lg:w-2/5 border-t lg:border-t-0 lg:border-s border-border bg-background flex flex-col h-[500px] lg:h-auto print:hidden">
          
          <div className="p-4 border-b border-border bg-card">
            <h3 className="font-medium">{t("Ask questions", "سوال پوچھیں")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("Answers are strictly based on your document.", "جوابات صرف آپ کی دستاویز پر مبنی ہیں۔")}</p>
          </div>
          
          <div role="log" aria-live="polite" className="flex-grow p-6 overflow-y-auto space-y-6">
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  dir="auto"
                  className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : msg.isRefusal 
                        ? 'bg-muted text-muted-foreground border border-border'
                        : 'bg-card border border-border text-foreground shadow-sm'
                  }`}
                >
                  {isUrdu ? isolateSourceValues(msg.content) : msg.content}
                </div>
                
                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 ps-2 border-s border-border">
                    <div className="text-sm text-muted-foreground mb-1">{t("Source (original text)", "ماخذ (اصل عبارت)")}</div>
                    {msg.citations.map((cit: string, idx: number) => (
                      <p key={idx} dir="auto" className="source-text text-muted-foreground leading-snug">&quot;{cit}&quot;</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-start">
                 <div className="bg-card border border-border text-foreground shadow-sm rounded-lg p-3 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t("Thinking...", "جواب تیار ہو رہا ہے…")}
                 </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-card border-t border-border">
            {chatError && <p role="alert" className="text-red-700 mb-3">{chatError}</p>}
            <form onSubmit={handleChatSubmit} className="relative">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                dir="auto"
                aria-label={t("Your question", "آپ کا سوال")}
                placeholder={t("Ask about your medications...", "اپنی ادویات کے بارے میں پوچھیں…")}
                className="w-full ps-4 pe-14 py-3 bg-background border border-border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all shadow-sm"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                aria-label={t("Send question", "سوال بھیجیں")}
                className="absolute end-2 top-1/2 -translate-y-1/2 p-3 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
          
        </div>

      </main>
    </div>
  );
}
