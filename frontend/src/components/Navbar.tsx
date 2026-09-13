"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  FileText, 
  History, 
  UploadCloud, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X,
  Home
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Navbar() {
  const { user, loading: authLoading, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-xs">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="inline-flex items-center gap-2 sm:gap-2.5 group shrink-0">
          <div className="bg-primary p-1.5 sm:p-2 rounded-xl text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-foreground whitespace-nowrap">
            CareDoc <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden sm:flex items-center gap-1 sm:gap-3">
          {user ? (
            <>
              <Link
                href="/upload"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === "/upload"
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload</span>
              </Link>

              <Link
                href="/history"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === "/history"
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <History className="w-4 h-4" />
                <span>My Documents</span>
              </Link>

              {/* User Email & Logout */}
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border shrink-0">
                <div 
                  title={user.email} 
                  className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 shadow-xs"
                >
                  <UserIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="select-all">{user.email}</span>
                </div>

                <button
                  onClick={() => logout()}
                  title="Log out"
                  className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-destructive px-2.5 py-1.5 rounded-md hover:bg-red-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </>
          ) : !authLoading ? (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  pathname === "/login"
                    ? "text-primary font-semibold"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                Log in
              </Link>
              <Link
                href="/login?mode=signup"
                className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-sm hover:opacity-95 transition-opacity whitespace-nowrap"
              >
                Sign up
              </Link>
            </div>
          ) : null}
        </nav>

        {/* Mobile Quick Action & Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2 shrink-0">
          {!authLoading && !user ? (
            <>
              <Link
                href="/login?mode=signup"
                className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-full shadow-xs hover:opacity-95 transition-opacity whitespace-nowrap"
              >
                Sign up
              </Link>
            </>
          ) : user ? (
            <Link
              href="/upload"
              aria-label="Upload document"
              className="p-1.5 text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
            </Link>
          ) : null}

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="p-1.5 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Animated Dropdown Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="sm:hidden border-t border-border/80 bg-white/95 backdrop-blur-lg px-4 py-3 shadow-lg flex flex-col gap-1 overflow-hidden"
          >
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <Link
              href="/upload"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                pathname === "/upload"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </Link>

            {user ? (
              <>
                <Link
                  href="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    pathname === "/history"
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>My Documents</span>
                </Link>

                <div className="pt-2.5 mt-1 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 min-w-0">
                    <UserIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="break-all select-all font-semibold text-slate-800">{user.email}</span>
                  </div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="self-end sm:self-auto flex items-center gap-1 text-xs font-medium text-destructive px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </>
            ) : !authLoading ? (
              <div className="pt-2 mt-1 border-t border-border flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/login?mode=signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl shadow-xs hover:opacity-95 transition-opacity"
                >
                  Sign up free
                </Link>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
