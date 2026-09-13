"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowRight } from "lucide-react";

import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col text-foreground selection:bg-primary selection:text-white relative">
      {/* Subtle overlay for legibility */}
      <div className="fixed inset-0 bg-black/20 pointer-events-none z-0"></div>
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 text-center relative z-10">
        
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
          className="w-full max-w-3xl flex flex-col items-center bg-white/90 backdrop-blur-md border border-white/60 p-8 sm:p-10 md:p-12 rounded-3xl shadow-2xl my-auto"
        >
          {/* Main Headline */}
          <motion.h1 
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.2] mb-4 sm:mb-6"
          >
            Understand your healthcare paperwork, instantly.
          </motion.h1>

          {/* Clarifying Sub-headline */}
          <motion.p 
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            className="text-base sm:text-lg md:text-xl text-slate-700 max-w-2xl mb-8 sm:mb-10 leading-relaxed"
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
              className="group inline-flex justify-center items-center gap-3 bg-primary text-primary-foreground px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
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
