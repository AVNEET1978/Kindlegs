import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Scale, Plus, TrendingUp, TrendingDown, Check, Calendar, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";

interface WeightTrackerModalProps {
  pet: any;
  isOpen: boolean;
  onClose: () => void;
  onWeightUpdated?: (newWeight: number) => void;
}

export default function WeightTrackerModal({ pet, isOpen, onClose, onWeightUpdated }: WeightTrackerModalProps) {
  const [weights, setWeights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [newWeight, setNewWeight] = useState("");
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split("T")[0]);
  const [weightNotes, setWeightNotes] = useState("");

  const fetchWeights = async () => {
    if (!pet?.id || !auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, `pets/${pet.id}/weights`),
        orderBy("date", "asc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // If no weight history exists yet, construct initial entry from pet.weight
      if (list.length === 0 && pet.weight) {
        setWeights([{
          id: "initial",
          weight: Number(pet.weight),
          date: pet.createdAt?.toDate ? pet.createdAt.toDate().toISOString().split("T")[0] : "2026-01-01",
          notes: "Initial weight"
        }]);
      } else {
        setWeights(list);
      }
    } catch (err) {
      console.error("Error fetching weight history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && pet) {
      fetchWeights();
    }
  }, [isOpen, pet]);

  if (!isOpen || !pet) return null;

  const currentWeight = weights.length > 0 ? weights[weights.length - 1].weight : (pet.weight || 0);
  const prevWeight = weights.length > 1 ? weights[weights.length - 2].weight : currentWeight;
  const weightDiff = (currentWeight - prevWeight).toFixed(1);
  const isGain = Number(weightDiff) > 0;
  const isLoss = Number(weightDiff) < 0;

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || !pet?.id || !auth.currentUser) return;
    setSaving(true);
    try {
      const weightNum = parseFloat(newWeight);
      
      // Add to subcollection
      await addDoc(collection(db, `pets/${pet.id}/weights`), {
        weight: weightNum,
        date: weightDate,
        notes: weightNotes,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      // Update main pet profile weight
      await updateDoc(doc(db, "pets", pet.id), {
        weight: weightNum
      });

      if (onWeightUpdated) {
        onWeightUpdated(weightNum);
      }

      setNewWeight("");
      setWeightNotes("");
      setShowAddForm(false);
      await fetchWeights();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `pets/${pet.id}/weights`);
    } finally {
      setSaving(false);
    }
  };

  // Format data for Recharts
  const chartData = weights.map(item => ({
    date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: Number(item.weight)
  }));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-gray-100 my-8 space-y-6 relative"
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
              <Scale size={12} className="text-amber-400" />
              Weight & Growth Log
            </div>
            <h2 className="text-xl font-black">{pet.name}'s Weight History</h2>
            <p className="text-[11px] text-gray-400 font-medium">Track growth, ideal targets, and health progress</p>
          </div>

          {/* Stats Summary Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-center space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Current</p>
              <p className="text-base font-black text-gray-900">{currentWeight} <span className="text-xs font-normal">kg</span></p>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-center space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Target Ideal</p>
              <p className="text-base font-black text-gray-900">{pet.targetWeight || (currentWeight ? (currentWeight * 0.98).toFixed(1) : "12.0")} <span className="text-xs font-normal">kg</span></p>
            </div>

            <div className={`p-3.5 rounded-2xl border text-center space-y-1 ${isGain ? "bg-amber-50 border-amber-100 text-amber-800" : isLoss ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-gray-50 border-gray-100 text-gray-800"}`}>
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Trend</p>
              <p className="text-base font-black flex items-center justify-center gap-1">
                {isGain ? <TrendingUp size={14} /> : isLoss ? <TrendingDown size={14} /> : <Activity size={14} />}
                {isGain ? `+${weightDiff}` : weightDiff} <span className="text-xs font-normal">kg</span>
              </p>
            </div>
          </div>

          {/* Recharts Weight Graph */}
          <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-gray-700">Weight Progression</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{chartData.length} Logs</span>
            </div>

            <div className="h-44 w-full pt-2">
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading chart...</div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000000" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#000000" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      formatter={(val: any) => [`${val} kg`, 'Weight']}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#weightGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">No weight entries yet</div>
              )}
            </div>
          </div>

          {/* Log New Weight Form */}
          {showAddForm ? (
            <form onSubmit={handleAddWeight} className="bg-black text-white p-5 rounded-3xl space-y-4 text-left animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-amber-300">Log New Weigh-In</h4>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Weight (kg)</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    placeholder="e.g. 12.5"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full h-11 px-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-amber-400 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Date</label>
                  <input
                    required
                    type="date"
                    value={weightDate}
                    onChange={(e) => setWeightDate(e.target.value)}
                    className="w-full h-11 px-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-amber-400 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. After vet diet checkup"
                  value={weightNotes}
                  onChange={(e) => setWeightNotes(e.target.value)}
                  className="w-full h-11 px-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none text-xs"
                />
              </div>

              <button
                disabled={saving}
                type="submit"
                className="w-full h-12 bg-amber-400 text-black font-black rounded-xl text-xs hover:bg-amber-300 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? "Saving..." : "Save Weight Entry"}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full h-13 bg-black text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-95 transition-all shadow-md"
            >
              <Plus size={16} />
              Log New Weigh-In
            </button>
          )}

          {/* Historic Weight List */}
          <div className="space-y-2 text-left pt-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Recent Weigh-Ins</h4>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {weights.slice().reverse().map((item, idx) => (
                <div key={item.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-white rounded-lg border border-gray-200 flex items-center justify-center font-bold text-gray-600">
                      <Scale size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{item.weight} kg</p>
                      {item.notes && <p className="text-[10px] text-gray-400 truncate max-w-[180px]">{item.notes}</p>}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 font-bold">
                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
