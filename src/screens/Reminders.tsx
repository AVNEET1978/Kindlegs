import React, { useEffect, useState } from "react";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Clock, Beaker, Activity, Pill, Plus, X, ShieldCheck, Stethoscope, CheckCircle2 } from "lucide-react";

interface Pet {
  id: string;
  name: string;
  [key: string]: any;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("vaccine");
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [newRepeat, setNewRepeat] = useState("monthly");

  const fetchData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    try {
      const petsQ = query(collection(db, "pets"), where("ownerId", "==", uid));
      const petsSnap = await getDocs(petsQ);
      const petsData = petsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Pet[];
      setPets(petsData);
      if (petsData.length > 0 && !selectedPetId) {
        setSelectedPetId(petsData[0].id);
      }

      let allReminders: any[] = [];
      for (const pet of petsData) {
        const remQ = query(
          collection(db, "pets", pet.id, "reminders"), 
          where("ownerId", "==", uid),
          orderBy("dueDate", "asc")
        );
        const remSnap = await getDocs(remQ);
        const petReminders = remSnap.docs.map(doc => ({
          id: doc.id,
          petId: pet.id,
          petName: pet.name,
          ...doc.data()
        }));
        allReminders = [...allReminders, ...petReminders];
      }

      setReminders(allReminders);
      setError(null);
    } catch (err: any) {
      console.error("Reminders fetch error:", err);
      setError(err.message || "Failed to load reminders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timeout = setTimeout(() => {
      setLoading(prev => prev ? false : prev);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [auth.currentUser?.uid]);

  const toggleStatus = async (reminder: any) => {
    const path = `pets/${reminder.petId}/reminders/${reminder.id}`;
    try {
      const reminderRef = doc(db, path);
      const newStatus = reminder.status === 'pending' ? 'completed' : 'pending';
      await updateDoc(reminderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // If completing, also automatically log a record in pets/{petId}/records
      if (newStatus === 'completed') {
        await addDoc(collection(db, `pets/${reminder.petId}/records`), {
          title: reminder.title,
          type: reminder.type || 'vaccine',
          date: new Date().toISOString().split("T")[0],
          notes: `Completed reminder: ${reminder.title}`,
          ownerId: auth.currentUser?.uid,
          createdAt: serverTimestamp()
        });
      }

      setReminders(reminders.map(r => r.id === reminder.id ? { ...r, status: newStatus } : r));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !selectedPetId || !auth.currentUser) return;
    setSaving(true);
    try {
      await addDoc(collection(db, `pets/${selectedPetId}/reminders`), {
        title: newTitle,
        type: newType,
        dueDate: newDueDate,
        repeat: newRepeat,
        status: "pending",
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      setNewTitle("");
      setIsAddModalOpen(false);
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `pets/${selectedPetId}/reminders`);
    } finally {
      setSaving(false);
    }
  };

  const filteredReminders = reminders.filter(r => 
    activeTab === "Upcoming" ? r.status === "pending" : r.status === "completed"
  );

  const getRemindersBySection = () => {
    const now = new Date();
    const soonThreshold = new Date();
    soonThreshold.setDate(now.getDate() + 14); // 2 weeks

    const dueSoon = filteredReminders.filter(r => new Date(r.dueDate) <= soonThreshold);
    const upcoming = filteredReminders.filter(r => new Date(r.dueDate) > soonThreshold);

    return { dueSoon, upcoming };
  };

  const { dueSoon, upcoming } = getRemindersBySection();

  if (loading) return <div className="h-full flex items-center justify-center font-bold text-gray-400">Loading reminders...</div>;

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="text-red-500 font-bold">Error</div>
        <div className="text-sm text-gray-600">{error}</div>
        <button onClick={() => { setLoading(true); window.location.reload(); }} className="px-6 py-2 bg-black text-white rounded-xl text-sm font-bold">Retry</button>
      </div>
    );
  }

  return (
    <div className="pb-32 space-y-8 animate-in fade-in duration-500 relative min-h-full text-left">
      {/* Header */}
      <header className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-black">Care Reminders</h1>
          <p className="text-[11px] text-gray-400 font-medium">Vaccines, Treatments, & Medication Alerts</p>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black transition-colors border border-gray-100">
          <Bell size={20} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
          {["Upcoming", "Completed"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 h-10 rounded-xl text-[11px] font-bold transition-all ${activeTab === tab ? "bg-black text-white shadow-sm" : "hover:bg-gray-200 text-gray-400"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredReminders.length === 0 ? (
        <div className="py-20 text-center space-y-4">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300 border border-gray-200">
             <Bell size={32} />
           </div>
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No {activeTab.toLowerCase()} reminders</p>
        </div>
      ) : (
        <div className="space-y-8">
          {dueSoon.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Due Soon & Overdue</h3>
              <div className="space-y-3">
                {dueSoon.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} onToggle={() => toggleStatus(reminder)} variant="soon" />
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Scheduled Ahead</h3>
              <div className="space-y-3">
                {upcoming.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} onToggle={() => toggleStatus(reminder)} variant="upcoming" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Add Reminder Floating Button */}
      <div className="fixed bottom-28 left-0 right-0 px-6 flex justify-center z-40 pointer-events-none">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full max-w-sm h-14 bg-black text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl pointer-events-auto active:scale-[0.98] transition-transform"
        >
          <Plus size={20} />
          Add Care Reminder
        </button>
      </div>

      {/* Add Reminder Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-gray-100 my-8 space-y-6 relative text-left"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-5 right-5 w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-colors z-10"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-1 pt-2">
                <h2 className="text-xl font-black">Add Care Reminder</h2>
                <p className="text-[11px] text-gray-400 font-medium">Never miss a vaccine, flea/tick treatment, or dosage</p>
              </div>

              <form onSubmit={handleCreateReminder} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Select Pet</label>
                  <select
                    value={selectedPetId}
                    onChange={(e) => setSelectedPetId(e.target.value)}
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold outline-none"
                  >
                    {pets.map(pet => (
                      <option key={pet.id} value={pet.id}>{pet.name} ({pet.breed || pet.species})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Reminder Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Annual Rabies Booster"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Category</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold outline-none"
                    >
                      <option value="vaccine">Vaccine Booster</option>
                      <option value="flea">Flea & Tick</option>
                      <option value="deworming">Deworming</option>
                      <option value="prescription">Medication</option>
                      <option value="grooming">Grooming</option>
                      <option value="vet">Vet Checkup</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Due Date</label>
                    <input
                      required
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Repeat Interval</label>
                  <select
                    value={newRepeat}
                    onChange={(e) => setNewRepeat(e.target.value)}
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold outline-none"
                  >
                    <option value="none">One-time only</option>
                    <option value="monthly">Every Month</option>
                    <option value="quarterly">Every 3 Months</option>
                    <option value="yearly">Every Year (Annual)</option>
                  </select>
                </div>

                <button
                  disabled={saving}
                  type="submit"
                  className="w-full h-14 bg-black text-white font-bold rounded-2xl text-xs hover:bg-gray-900 transition-colors shadow-lg active:scale-95 mt-2"
                >
                  {saving ? "Saving..." : "Save Care Reminder"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReminderCard({ reminder, onToggle, variant }: any) {
  const isSoon = variant === "soon";
  const dueDate = new Date(reminder.dueDate);
  const diffTime = dueDate.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isCompleted = reminder.status === "completed";
  
  const getSummary = () => {
    if (isCompleted) return "Completed & Logged";
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `In ${diffDays} days`;
  };

  return (
    <div 
      className={`bg-white rounded-[24px] border p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        isCompleted ? "border-gray-200 opacity-60 bg-gray-50" : isSoon ? "border-amber-200/80" : "border-gray-100"
      }`} 
      onClick={onToggle}
    >
      <div className="flex items-center gap-4 text-left">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          isCompleted ? "bg-emerald-100 text-emerald-700" : isSoon ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-800"
        }`}>
           {getIconForType(reminder.type)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className={`text-[14px] font-bold leading-tight ${isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
              {reminder.title}
            </h4>
            <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md uppercase">
              {reminder.petName || "Pet"}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium pt-0.5">
            {dueDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <p className={`text-[10px] font-bold mt-0.5 ${isCompleted ? "text-emerald-600" : isSoon ? "text-amber-600" : "text-gray-400"}`}>
            {getSummary()}
          </p>
        </div>
      </div>

      <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
        isCompleted ? "bg-emerald-50 text-emerald-600" : isSoon ? "bg-amber-50/80 text-amber-600" : "bg-gray-50 text-gray-400 hover:text-black"
      }`}>
         {isCompleted ? <CheckCircle2 size={18} /> : <Clock size={16} />}
      </div>
    </div>
  );
}

function getIconForType(type: string) {
  switch (type?.toLowerCase()) {
    case 'vaccine': return <ShieldCheck size={20} />;
    case 'prescription': return <Pill size={20} />;
    case 'deworming': return <Activity size={20} />;
    case 'vet': return <Stethoscope size={20} />;
    default: return <Beaker size={20} />;
  }
}


