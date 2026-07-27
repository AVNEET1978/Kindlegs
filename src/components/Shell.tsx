import { ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, ClipboardList, PlusCircle, Bell, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const [highlightPlus, setHighlightPlus] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkHighlight = () => {
      const shouldHighlight = localStorage.getItem("highlight_plus") === "true";
      setHighlightPlus(shouldHighlight);
    };

    checkHighlight();
    // Also check on location change in case user navigates back
    window.addEventListener('storage', checkHighlight);
    return () => window.removeEventListener('storage', checkHighlight);
  }, [location]);

  const handlePlusClick = () => {
    localStorage.removeItem("highlight_plus");
    setHighlightPlus(false);
  };

  return (
    <div className="min-h-screen bg-white pb-24 flex flex-col items-center font-sans">
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
              onClick={handlePlusClick}
              className={`relative flex items-center justify-center w-[70px] h-[70px] bg-black text-white rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.2)] transform transition-transform hover:scale-105 active:scale-95`}
            >
              <PlusCircle size={28} strokeWidth={2.5} />
              <AnimatePresence>
                {highlightPlus && (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-black rounded-full -z-10"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1.5 rounded-xl whitespace-nowrap text-[10px] font-bold uppercase tracking-widest shadow-lg"
                    >
                      Add Records Next
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45" />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </NavLink>
          </div>

          <NavLink to="/reminders" className="w-full">
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? "opacity-100" : "opacity-40"}`}>
                <Bell size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-[0.05em]">Reminders</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/profile" className="w-full">
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? "opacity-100" : "opacity-40"}`}>
                <User size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-[0.05em]">Profile</span>
              </div>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
