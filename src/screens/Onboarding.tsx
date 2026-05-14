import { motion } from "motion/react";
import { signInWithGoogle } from "../lib/firebase";
import { LogIn } from "lucide-react";

export default function Onboarding() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8 max-w-sm"
      >
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-12">
          <span className="text-white font-display text-xl font-bold">KL</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Never lose your pet’s medical history again.
          </h1>
          <p className="text-gray-500 text-lg">
            A premium digital companion for your pet's medical records and wellness.
          </p>
        </div>

        <div className="pt-8 w-full">
          <button
            onClick={signInWithGoogle}
            className="w-full h-16 bg-black text-white rounded-[20px] font-semibold flex items-center justify-center gap-3 hover:bg-gray-900 shadow-lg active:scale-[0.98] transition-all"
          >
            <LogIn size={20} />
            Connect Google Account
          </button>
          <p className="text-xs text-gray-400 mt-4 px-4 leading-relaxed">
            By continuing, you agree to Kindlegs’ Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
