"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col text-foreground selection:bg-primary selection:text-white">
      {/* Dark overlay for better legibility */}
      <div className="fixed inset-0 bg-black/30 pointer-events-none z-[-1]"></div>

      {/* Minimal Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-2xl shadow-sm border border-white/40">
          <div className="bg-primary p-2 rounded-xl shadow-inner">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-800">CareDoc AI</span>
        </div>
        <nav>
          <Link 
            href="/login" 
            className="text-sm font-semibold bg-white/80 px-6 py-2.5 rounded-full text-slate-700 hover:text-slate-900 hover:bg-white/95 shadow-sm border border-white/40 transition-all"
          >
            Log in
          </Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 pb-24 text-center relative z-10">
        
        {/* Animated Staggered Container */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1, 
              transition: { staggerChildren: 0.15 }
            }
          }}
          className="max-w-4xl flex flex-col items-center bg-white/85 border border-white/50 p-12 md:p-16 rounded-3xl shadow-2xl"
        >
          {/* Main Headline */}
          <motion.h1 
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 leading-[1.15] mb-6"
          >
            Understand your healthcare paperwork, instantly.
          </motion.h1>

          {/* Clarifying Sub-headline */}
          <motion.p 
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            className="text-lg md:text-xl text-slate-700 max-w-2xl mb-12 leading-relaxed"
          >
            Upload your discharge summary or prescription. We pull out the medications, follow-up steps, and warnings, then rewrite it all in plain language.
          </motion.p>

          {/* Primary CTA */}
          <motion.div 
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.5, type: "spring", bounce: 0.4 } }
            }}
          >
            <Link 
              href="/upload" 
              className="group inline-flex justify-center items-center gap-3 bg-primary text-primary-foreground px-10 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Upload Document
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
