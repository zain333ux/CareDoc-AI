"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/upload");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      
      {/* Minimal Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">CareDoc AI</span>
        </Link>
      </header>

      {/* Main Login Area */}
      <main className="flex-grow flex items-center justify-center px-6 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-card border border-border p-8 rounded-lg shadow-sm"
        >
          <h1 className="text-2xl font-medium tracking-tight mb-6">Log in</h1>
          
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required
                className="w-full px-4 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all" 
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5 mb-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required
                className="w-full px-4 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all" 
              />
            </div>

            <button 
              type="submit" 
              className="w-full group inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md font-medium shadow-sm hover:opacity-90 transition-opacity"
            >
              Continue
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account? <Link href="/login" className="text-primary hover:underline">Sign up</Link>
          </div>
        </motion.div>
      </main>

    </div>
  );
}
