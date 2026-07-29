import { useState } from "react";
import { motion } from "motion/react";
import { signInWithGoogle, signInWithGuest } from "../lib/firebase";
import { LogIn, User, AlertCircle, ExternalLink, Copy, Check, Shield } from "lucide-react";

export default function Onboarding() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [isAdminRestricted, setIsAdminRestricted] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentDomain = typeof window !== "undefined" ? window.location.hostname : "kindlegs-eosin.vercel.app";

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setIsUnauthorizedDomain(false);
    setIsAdminRestricted(false);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google auth error:", err);
      setLoading(false);
      const message = err?.message || String(err);
      if (message.includes("auth/unauthorized-domain") || message.includes("unauthorized-domain")) {
        setIsUnauthorizedDomain(true);
      } else if (message.includes("auth/admin-restricted-operation") || message.includes("admin-restricted-operation")) {
        setIsAdminRestricted(true);
      } else {
        setErrorMsg(message || "Sign in failed. Please try again or continue as guest.");
      }
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setIsAdminRestricted(false);
    try {
      await signInWithGuest();
    } catch (err: any) {
      console.error("Guest auth error:", err);
      setLoading(false);
      const message = err?.message || String(err);
      if (message.includes("auth/admin-restricted-operation") || message.includes("admin-restricted-operation")) {
        setIsAdminRestricted(true);
      } else {
        setErrorMsg(err?.message || "Failed to start guest session.");
      }
    }
  };

  const copyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 text-center relative overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8 max-w-md w-full"
      >
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-md">
          <span className="text-white font-display text-xl font-bold">KL</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Never lose your pet’s medical history again.
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            A premium digital companion for storing, scanning, and managing medical records & wellness.
          </p>
        </div>

        {/* Generic Error Message */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-semibold text-left flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Authentication Error</p>
              <p className="text-red-500 font-normal">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Unauthorized Domain Help Card */}
        {isUnauthorizedDomain && (
          <div className="p-5 bg-amber-50/90 border border-amber-200/80 rounded-3xl text-left space-y-3 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <AlertCircle size={18} className="text-amber-600" />
              <span>Firebase Domain Authorization Required</span>
            </div>
            <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
              Google Sign-In requires your current deployment domain to be whitelisted in the Firebase Console.
            </p>

            <div className="bg-white/80 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-gray-800 truncate">{currentDomain}</span>
              <button
                onClick={copyDomain}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors shrink-0"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy Domain"}
              </button>
            </div>

            <div className="text-[11px] text-amber-900/70 space-y-1 pt-1">
              <p className="font-bold">To fix this in Firebase Console:</p>
              <ol className="list-decimal list-inside space-y-0.5 pl-1 font-medium">
                <li>Go to Firebase Console &rarr; Authentication &rarr; Settings</li>
                <li>Click <strong>Authorized domains</strong> tab</li>
                <li>Click <strong>Add domain</strong> and paste <code className="bg-amber-100 px-1 rounded">{currentDomain}</code></li>
              </ol>
            </div>

            <div className="pt-2 border-t border-amber-200/60">
              <button
                onClick={handleGuestSignIn}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Shield size={14} />
                Continue as Guest (Demo Mode)
              </button>
            </div>
          </div>
        )}

        {/* Admin Restricted Operation Help Card */}
        {isAdminRestricted && (
          <div className="p-5 bg-red-50/90 border border-red-200/80 rounded-3xl text-left space-y-3 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
            <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
              <AlertCircle size={18} className="text-red-600 shrink-0" />
              <span>Authentication Provider Disabled</span>
            </div>
            <p className="text-xs text-red-900/80 leading-relaxed font-medium">
              Firebase returned <code className="bg-red-100 px-1 py-0.5 rounded font-mono text-[10px]">auth/admin-restricted-operation</code>. This error happens because <strong>Google Sign-In</strong> or <strong>Anonymous Sign-In</strong> is disabled in your Firebase project configuration.
            </p>

            <div className="text-[11px] text-red-900/80 space-y-1 bg-white/80 border border-red-200 p-3 rounded-2xl">
              <p className="font-bold text-black">To enable in Firebase Console:</p>
              <ol className="list-decimal list-inside space-y-1 pt-1 font-medium text-gray-700">
                <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">Firebase Console</a></li>
                <li>Select project <code className="bg-gray-100 px-1 font-mono text-[10px]">ai-studio-4090d8e2-33b6-496b-85fe-09039490be40</code></li>
                <li>Go to <strong>Authentication</strong> &rarr; <strong>Sign-in method</strong> tab</li>
                <li>Click <strong>Google</strong> &rarr; Enable &rarr; Save</li>
                <li>Click <strong>Anonymous</strong> &rarr; Enable &rarr; Save</li>
              </ol>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="pt-4 space-y-3 w-full">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-14 bg-black text-white rounded-[20px] font-semibold flex items-center justify-center gap-3 hover:bg-gray-900 shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                Connect Google Account
              </>
            )}
          </button>

          <button
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-[20px] font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <User size={16} />
            Continue as Guest / Demo Mode
          </button>

          <p className="text-[11px] text-gray-400 mt-4 px-4 leading-relaxed">
            By continuing, you agree to Kindlegs’ Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
