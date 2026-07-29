import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Printer, ShieldCheck, QrCode, Phone, MapPin, Award, CheckCircle2, Copy, Check, FileText } from "lucide-react";

interface PetPassportModalProps {
  pet: any;
  isOpen: boolean;
  onClose: () => void;
  recentRecords?: any[];
}

export default function PetPassportModal({ pet, isOpen, onClose, recentRecords = [] }: PetPassportModalProps) {
  const [copied, setCopied] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  if (!isOpen || !pet) return null;

  const passportId = `KL-PASSPORT-${pet.id ? pet.id.substring(0, 6).toUpperCase() : "882910"}`;
  const getAge = (dob: string) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} yr${age !== 1 ? 's' : ''}`;
  };

  const handleShare = () => {
    const summaryText = `🐾 DIGITAL PET PASSPORT: ${pet.name.toUpperCase()}
Passport ID: ${passportId}
Species/Breed: ${pet.species?.toUpperCase() || "DOG"} • ${pet.breed || "Mix"}
Age/Gender: ${getAge(pet.dob)} • ${pet.gender || "Male"} (${pet.spayedNeutered ? "Neutered" : "Intact"})
Microchip: ${pet.microchip || "Recorded"} (${pet.microchipProvider || "Standard Registry"})
Insurance: ${pet.insuranceProvider || "N/A"} (Policy: ${pet.insurancePolicy || "N/A"})
Primary Vet: ${pet.vetName || "Main Vet Clinic"} (${pet.vetPhone || "+1 555-0192"})
Last Vaccines: ${recentRecords.filter(r => r.type === "vaccine").map(v => v.title).join(", ") || "Up to date"}
Share Link: ${window.location.origin}`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setShowShareSuccess(true);
    setTimeout(() => {
      setCopied(false);
      setShowShareSuccess(false);
    }, 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-gray-100 my-8 space-y-6 relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-colors z-10"
          >
            <X size={18} />
          </button>

          {/* Modal Header */}
          <div className="text-center space-y-1 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
              <Award size={12} className="text-amber-400" />
              Digital Pet Passport
            </div>
            <h2 className="text-xl font-black">{pet.name}'s Official Pass</h2>
            <p className="text-[11px] text-gray-400 font-mono font-bold tracking-wider">{passportId}</p>
          </div>

          {/* Passport ID Card Visual */}
          <div className="bg-gradient-to-br from-neutral-900 via-zinc-800 to-black text-white rounded-[28px] p-6 shadow-xl relative overflow-hidden border border-white/10 space-y-5">
            {/* Background Decorative Pattern */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <QrCode size={120} />
            </div>

            {/* Top Bar inside Card */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-black font-black text-[10px]">
                  KL
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300">KINDLEGS VERIFIED</span>
              </div>
              <span className="text-[9px] font-mono text-gray-400">{new Date().getFullYear()} EXP: LIFETIME</span>
            </div>

            {/* Profile Row */}
            <div className="flex gap-4 items-center">
              <div className="w-20 h-24 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-white/20 shrink-0 shadow-md">
                <img
                  src={pet.imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1 text-left flex-1 min-w-0">
                <h3 className="text-2xl font-black text-white truncate">{pet.name}</h3>
                <p className="text-xs text-amber-200 font-bold uppercase tracking-wider truncate">
                  {pet.breed || pet.species || "Pet"}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-0.5 rounded-md">
                    {getAge(pet.dob)}
                  </span>
                  <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-0.5 rounded-md capitalize">
                    {pet.gender || "Male"}
                  </span>
                  {pet.spayedNeutered && (
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md">
                      Neutered
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Identification Matrix */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-left text-[11px]">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Microchip No.</p>
                <p className="font-mono font-bold text-white truncate">{pet.microchip || "985141002938102"}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Insurance</p>
                <p className="font-bold text-white truncate">{pet.insuranceProvider || "Petplan Direct"}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Primary Vet Clinic</p>
                <p className="font-bold text-white truncate">{pet.vetName || "Valley Pet Hospital"}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Vaccine Status</p>
                <p className="font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={12} /> Up to Date
                </p>
              </div>
            </div>
          </div>

          {/* Quick Details List */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Emergency & Care Directory</h4>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Primary Vet Phone:</span>
              <a href={`tel:${pet.vetPhone || "+15550192"}`} className="font-bold text-black flex items-center gap-1 hover:underline">
                <Phone size={12} className="text-emerald-600" /> {pet.vetPhone || "+1 (555) 0192"}
              </a>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">24/7 Emergency Clinic:</span>
              <a href={`tel:${pet.emergencyPhone || "+15559911"}`} className="font-bold text-red-600 flex items-center gap-1 hover:underline">
                <Phone size={12} /> {pet.emergencyPhone || "+1 (555) 9911 ER"}
              </a>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Policy #:</span>
              <span className="font-mono font-bold text-gray-800">{pet.insurancePolicy || "POL-981245"}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleShare}
              className="h-12 bg-black text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-95 transition-all shadow-md"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
              {copied ? "Passport Copied!" : "Share Digital Passport"}
            </button>

            <button
              onClick={handlePrint}
              className="h-12 bg-gray-100 text-black rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 active:scale-95 transition-all border border-gray-200"
            >
              <Printer size={16} />
              Print / Save PDF
            </button>
          </div>

          {showShareSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-[11px] font-bold text-center flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={14} className="text-emerald-600" />
              Passport text & summary copied to clipboard!
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
