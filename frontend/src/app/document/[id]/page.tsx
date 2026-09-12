"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Volume2, AlertTriangle, Send, FileText, CornerDownRight, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const mockChatHistory: any[] = [];
// Clean chat history on load

export default function DocumentViewPage() {
  const params = useParams();
  const documentId = params.id as string;
  
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>(mockChatHistory);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    // Load summary from localStorage
    const saved = localStorage.getItem(`doc_${documentId}`);
    if (saved) {
      try {
        setSummaryData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse summary");
      }
    }
  }, [documentId]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userQuery = chatInput;
    setChatInput("");
    
    // Add user message
    const newMsg = { id: Date.now(), role: "user", content: userQuery };
    setChatHistory(prev => [...prev, newMsg]);
    setIsChatLoading(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${documentId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: userQuery })
      });
      
      if (!res.ok) throw new Error("Chat failed");
      
      const data = await res.json();
      
      setChatHistory(prev => [...prev, {
        id: Date.now() + 1,
        role: "assistant",
        content: data.answer,
        citations: data.citations || [],
        isRefusal: data.answer.includes("doesn't cover this")
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (!summaryData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen">
      
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground p-2 -ml-2 rounded-md hover:bg-muted/50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="font-medium">Discharge_Summary_John_Hopkins.pdf</span>
            </div>
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-1 rounded">
            Status · Ready
          </span>
        </div>
      </header>

      {/* Main Layout: 2 Columns */}
      <main className="flex-grow overflow-hidden max-w-7xl mx-auto w-full flex flex-col lg:flex-row">
        
        {/* Left Column: Summary Cards (Scrollable) */}
        <div className="w-full lg:w-3/5 p-6 overflow-y-auto">
          <motion.div 
            className="max-w-3xl mx-auto space-y-6 pb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            
            {/* Plain Language Summary */}
            <motion.section variants={itemVariants} className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Plain-language Summary</h2>
                <button className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/5" title="Read aloud">
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              <div className="text-foreground leading-relaxed">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-semibold mt-6 mb-4 text-slate-900" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-5 mb-3 text-slate-900" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-4 mb-2 text-slate-800" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-slate-700" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-700" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-slate-700" {...props} />,
                    table: ({node, ...props}) => <div className="overflow-x-auto mb-6 border border-slate-200 rounded-lg"><table className="min-w-full text-sm divide-y divide-slate-200" {...props} /></div>,
                    thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
                    th: ({node, ...props}) => <th className="px-4 py-3 text-left font-medium text-slate-600 uppercase tracking-wider" {...props} />,
                    td: ({node, ...props}) => <td className="px-4 py-3 border-t border-slate-200 text-slate-800" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                  }}
                >
                  {summaryData.simplified_text || summaryData.simplifiedText}
                </ReactMarkdown>
              </div>
            </motion.section>

            {/* Medications */}
            <motion.section variants={itemVariants} className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Medications</h2>
              <div className="divide-y divide-border border border-border rounded-md overflow-hidden">
                {summaryData.medications.map((med: any, idx: number) => (
                  <div key={idx} className="p-4 bg-background">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{med.name} — {med.dosage}</span>
                      {med.verified === false && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {med.frequency} · {med.duration}
                    </div>
                    {med.verified === false && (
                      <div className="text-xs text-amber-700/80 mt-2 flex items-center gap-1.5">
                        <CornerDownRight className="w-3 h-3" />
                        Couldn&apos;t confirm this dosage against your document. Check with your provider.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Follow-up */}
            <motion.section variants={itemVariants} className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Follow-up Plan</h2>
              <ul className="space-y-3">
                {summaryData.follow_up.map((item: any, idx: number) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <span className="block text-foreground">{item.action}</span>
                      <span className="block text-sm text-muted-foreground mt-0.5">{item.date}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* Precautions */}
            <motion.section variants={itemVariants} className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Precautions & Warnings</h2>
              <ul className="space-y-3">
                {summaryData.precautions.map((item: any, idx: number) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground leading-snug">{item.warning}</span>
                  </li>
                ))}
              </ul>
            </motion.section>

          </motion.div>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="w-full lg:w-2/5 border-t lg:border-t-0 lg:border-l border-border bg-background flex flex-col h-[500px] lg:h-auto">
          
          <div className="p-4 border-b border-border bg-card">
            <h3 className="font-medium">Ask questions</h3>
            <p className="text-xs text-muted-foreground mt-1">Answers are strictly based on your document.</p>
          </div>
          
          <div className="flex-grow p-6 overflow-y-auto space-y-6">
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : msg.isRefusal 
                        ? 'bg-muted text-muted-foreground border border-border'
                        : 'bg-card border border-border text-foreground shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
                
                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 pl-2 border-l-2 border-border">
                    <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1 tracking-wider">Source</div>
                    {msg.citations.map((cit, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground italic leading-snug">&quot;{cit}&quot;</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-start">
                 <div className="bg-card border border-border text-foreground shadow-sm rounded-lg p-3 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                 </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-card border-t border-border">
            <form onSubmit={handleChatSubmit} className="relative">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your medications..."
                className="w-full pl-4 pr-12 py-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all shadow-sm"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition-all"
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
