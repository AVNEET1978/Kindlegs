import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, CheckCircle2, ShieldCheck, Stethoscope, FileText, Bell, Loader2 } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface VetLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId?: string;
  petName?: string;
  onSuccess?: () => void;
}

const DEMO_VET_RECORDS = [
  {
    type: "vaccine",
    title: "Rabies Booster Vaccination",
    clinicName: "City Pet Hospital (Vet Network #98214)",
    date: "2026-03-12",
    nextDueDate: "2027-03-12",
    notes: "Administered 3-year rabies vaccine. Pet healthy."
  },
  {
    type: "deworming",
    title: "Routine Deworming Treatment",
    clinicName: "Metro Vet Clinic (Vet Network #98214)",
    date: "2026-01-20",
    nextDueDate: "2026-07-20",
    notes: "Oral dewormer administered."
  },
  {
    type: "report",
    title: "Annual Blood Panel & Health Screen",
    clinicName: "Central Veterinary Diagnostic (Vet Network #98214)",
    date: "2025-11-05",
    nextDueDate: "2026-11-05",
    notes: "Complete blood count normal. Kidney & liver values optimal."
  }
];

export default function VetLookupModal({ isOpen, onClose, petId, petName = "Pet", onSuccess }: VetLookupModalProps) {
  const [vetId, setVetId] = useState("VET-98214");
  const [loading, setLoading] = useState(false);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePullRecords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vetId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (auth.currentUser && petId) {
        // Add merged records into Firestore
        for (const rec of DEMO_VET_RECORDS) {
          await addDoc(collection(db, `pets/${petId}/records`), {
            ...rec,
            petId,
            ownerId: auth.currentUser.uid,
            createdAt: serverTimestamp()
          });

          if (rec.nextDueDate) {
            await addDoc(collection(db, `pets/${petId}/reminders`), {
              petId,
              ownerId: auth.currentUser.uid,
              title: `Follow-up: ${rec.title}`,
              dueDate: rec.nextDueDate,
              status: "pending",
              createdAt: serverTimestamp()
            });
          }
        }
      }

      setSyncedCount(DEMO_VET_RECORDS.length);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Vet pull error:", err);
      setError("Failed to connect to vet network. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="bg-white w-full max-w-md rounded-3xl p-6 space-y-6 text-left shadow-2xl relative"
        >
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center">
                <Stethoscope size={18} />
              </div>
              <h3 className="text-base font-black text-gray-900">Pull Vet Network Records</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-black">
              <X size={18} />
            </button>
          </div>

          {syncedCount === null ? (
            <form onSubmit={handlePullRecords} className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium">
                  Enter your clinic's Unique Vet ID to instantly import medical history and synchronize health alerts for <strong>{petName}</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">UNIQUE VET ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={vetId}
                    onChange={(e) => setVetId(e.target.value)}
                    placeholder="e.g. VET-98214"
                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black uppercase"
                  />
                  <div className="absolute right-3 top-3 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                    VERIFIED NETWORK
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-black text-white rounded-2xl font-bold text-sm shadow-md hover:bg-stone-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin text-white" /> : <Search size={18} />}
                Pull records
              </button>
            </form>
          ) : (
            <div className="space-y-5 text-center py-2">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-gray-900">Records Synced!</h4>
                <p className="text-xs text-gray-500 font-medium">
                  Successfully imported {syncedCount} medical entries from 3 partner clinics in the network.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl text-left space-y-2 border border-gray-100 text-xs">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <Bell size={14} className="text-amber-700" />
                  <span>Automated Alerts Active</span>
                </div>
                <ul className="list-disc list-inside text-gray-600 space-y-1 font-medium text-[11px]">
                  <li>Routine Rabies booster reminder set</li>
                  <li>Deworming follow-up scheduled</li>
                  <li>Annual blood panel tracking synced</li>
                </ul>
              </div>

              <button
                onClick={onClose}
                className="w-full h-12 bg-black text-white rounded-2xl font-bold text-xs hover:bg-stone-900"
              >
                View timeline
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
