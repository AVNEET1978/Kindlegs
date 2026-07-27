import { useEffect, useState } from "react";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Clock, Beaker, Activity, Pill, Plus } from "lucide-react";

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

  useEffect(() => {
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
      setReminders(reminders.map(r => r.id === reminder.id ? { ...r, status: newStatus } : r));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
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
    <div className="pb-32 space-y-8 animate-in fade-in duration-500 relative min-h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-1">
        <div className="w-10"></div>
        <h1 className="text-base font-bold">Reminders</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black transition-colors">
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
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
             <Bell size={32} />
           </div>
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No {activeTab.toLowerCase()} reminders</p>
        </div>
      ) : (
        <div className="space-y-10">
          {dueSoon.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-left px-1">Due Soon</h3>
              <div className="space-y-3">
                {dueSoon.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} onToggle={() => toggleStatus(reminder)} variant="soon" />
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-left px-1">Upcoming</h3>
              <div className="space-y-3">
                {upcoming.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} onToggle={() => toggleStatus(reminder)} variant="upcoming" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Add Reminder Button */}
      <div className="fixed bottom-28 left-0 right-0 px-6 flex justify-center z-40 pointer-events-none">
        <button className="w-full max-w-sm h-14 bg-black text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl pointer-events-auto active:scale-[0.98] transition-transform">
          <Plus size={20} />
          Add Reminder
        </button>
      </div>
    </div>
  );
}

function ReminderCard({ reminder, onToggle, variant }: any) {
  const isSoon = variant === "soon";
  const dueDate = new Date(reminder.dueDate);
  const diffTime = dueDate.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const getSummary = () => {
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `In ${diffDays} days`;
  };

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={onToggle}>
      <div className="flex items-center gap-4 text-left">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSoon ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}>
           {getIconForType(reminder.type)}
        </div>
        <div>
          <h4 className="text-[14px] font-bold leading-tight">{reminder.title}</h4>
          <p className="text-[11px] text-gray-400 font-medium">
            {dueDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <p className={`text-[11px] font-bold mt-0.5 ${isSoon ? "text-orange-600" : "text-gray-400"}`}>
            {getSummary()}
          </p>
        </div>
      </div>
      <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${isSoon ? "bg-orange-50/50 text-orange-600" : "bg-green-50/50 text-green-600"}`}>
         <Clock size={16} />
      </div>
    </div>
  );
}

function getIconForType(type: string) {
  switch (type?.toLowerCase()) {
    case 'vaccine': return <Beaker size={20} />;
    case 'prescription': return <Pill size={20} />;
    case 'deworming': return <Activity size={20} />;
    default: return <Bell size={20} />;
  }
}

