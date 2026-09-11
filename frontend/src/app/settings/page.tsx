"use client";

import Link from "next/link";
import { ArrowLeft, Trash2, Globe } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/upload" className="text-muted-foreground hover:text-foreground p-2 -ml-2 rounded-md hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-medium">Settings</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        
        <section>
          <h2 className="text-xl font-medium tracking-tight mb-6">Preferences</h2>
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  Default Language
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose the default language for your document summaries.
                </p>
              </div>
              
              <select className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="en">English</option>
                <option value="es">Español (Spanish)</option>
                <option value="zh">中文 (Mandarin)</option>
              </select>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium tracking-tight text-destructive mb-6">Danger Zone</h2>
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 className="font-medium text-destructive flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete my data
                </h3>
                <p className="text-sm text-destructive/80 mt-1 max-w-md">
                  Permanently delete your account and all uploaded medical documents. This action cannot be undone.
                </p>
              </div>
              
              <button className="whitespace-nowrap bg-destructive/10 text-destructive px-4 py-2.5 rounded-md font-medium hover:bg-destructive hover:text-white transition-colors">
                Delete Account
              </button>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
