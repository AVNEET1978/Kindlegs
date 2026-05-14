import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Home, ClipboardList, PlusCircle, Bell, User } from "lucide-react";
import { motion } from "motion/react";

interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-white pb-24 flex flex-col items-center">
      <main className="w-full max-w-md px-6 py-8 flex-1 text-center">
        {children}
      </main>

      {/* Persistent Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white border-t border-grey-mid px-8 flex items-center justify-between z-50">
        <div className="flex-1 flex justify-between max-w-sm mx-auto items-center">
          <NavLink to="/" className="w-full">
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? "opacity-100" : "opacity-40"}`}>
                <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-[0.05em]">Home</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/records" className="w-full">
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? "opacity-100" : "opacity-40"}`}>
                <ClipboardList size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-[0.05em]">Records</span>
              </div>
            )}
          </NavLink>

          <div className="relative -top-8 flex-shrink-0">
            <NavLink
              to="/scan"
              className="flex items-center justify-center w-[70px] h-[70px] bg-black text-white rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.2)] transform transition-transform hover:scale-105 active:scale-95"
            >
              <PlusCircle size={28} strokeWidth={2.5} />
            </NavLink>
          </div>

          <NavLink to="/reminders" className="w-full">
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? "opacity-100" : "opacity-40"}`}>
                <Bell size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-[0.05em]">Plan</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/profile" className="w-full">
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? "opacity-100" : "opacity-40"}`}>
                <User size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-[0.05em]">Pet</span>
              </div>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
