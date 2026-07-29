import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronDown, Check, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PetSwitcherProps {
  pets: any[];
  activePetIndex: number;
  onSelectPet: (index: number) => void;
}

export default function PetSwitcher({ pets, activePetIndex, onSelectPet }: PetSwitcherProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!pets || pets.length === 0) return null;

  const activePet = pets[activePetIndex] || pets[0];

  return (
    <div className="relative z-30">
      {/* Active Pet Pill Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-50 border border-gray-200/80 hover:border-black px-3 py-1.5 rounded-full transition-all active:scale-95 shadow-sm"
      >
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 border border-white shrink-0">
          <img
            src={activePet.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activePet.name}`}
            alt={activePet.name}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-xs font-black text-black max-w-[100px] truncate">{activePet.name}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-64 bg-white rounded-3xl p-3 shadow-2xl border border-gray-100 z-50 text-left space-y-2"
            >
              <div className="px-3 py-1 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Select Pet</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {pets.length} Registered
                </span>
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto">
                {pets.map((pet, index) => {
                  const isSelected = index === activePetIndex;
                  return (
                    <button
                      key={pet.id || index}
                      onClick={() => {
                        onSelectPet(index);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                        isSelected ? "bg-black text-white" : "hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border ${isSelected ? "border-white/40" : "border-gray-200"}`}>
                          <img
                            src={pet.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pet.name}`}
                            alt={pet.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-bold truncate">{pet.name}</p>
                          <p className={`text-[10px] truncate ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                            {pet.breed || pet.species || "Pet"} • {pet.weight ? `${pet.weight} kg` : "No weight"}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check size={16} className="text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/add-pet");
                  }}
                  className="w-full h-10 bg-gray-50 hover:bg-gray-100 text-black rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-gray-200/80"
                >
                  <Plus size={14} /> Add New Pet
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
