import { useEffect, useState } from "react";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { motion } from "motion/react";
import { Bell, CheckCircle2, Circle, Clock, Calendar, Check, AlertCircle } from "lucide-react";

interface Pet {
  id: string;
  name: string;
  [key: string]: any;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        const petsQ = query(collection(db, "pets"), where("ownerId", "==", auth.currentUser.uid));
        const petsSnap = await getDocs(petsQ);
        const petsData = petsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Pet[];
        setPets(petsData);

        let allReminders: any[] = [];
        for (const pet of petsData) {
          const remQ = query(collection(db, "pets", pet.id, "reminders"), orderBy("dueDate", "asc"));
          const remSnap = await getDocs(remQ);
          const petReminders = remSnap.docs.map(doc => ({
            id: doc.id,
            petId: pet.id,
            petName: pet.name,
            ...doc.data()
          }));
          allReminders = [...allReminders, ...petReminders];
        }

        setReminders(allReminders.filter(r => r.status === 'pending'));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "reminders");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const toggleStatus = async (reminder: any) => {
    const path = `pets/${reminder.petId}/reminders/${reminder.id}`;
    try {
      const reminderRef = doc(db, path);
      await updateDoc(reminderRef, {
        status: reminder.status === 'pending' ? 'completed' : 'pending',
        updatedAt: serverTimestamp(),
      });
      setReminders(reminders.filter(r => r.id !== reminder.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const isOverdue = (date: string) => new Date(date) < new Date();

  if (loading) return <div className="h-full flex items-center justify-center">Loading reminders...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-center">
      <div className="space-y-4">
        <h1 className="text-3xl font-display font-black tracking-tight">Upcoming Care</h1>
        <p className="text-gray-500 font-medium">Keep your pack’s health on track with gentle nudges.</p>
      </div>

      {reminders.length === 0 ? (
        <div className="pt-12 text-center space-y-6">
           <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-black">
             <CheckCircle2 size={32} />
           </div>
           <div className="space-y-2">
             <h2 className="text-xl font-display font-black text-black">All Done!</h2>
             <p className="text-gray-400 text-sm max-w-xs mx-auto">
               You are all caught up with your pet’s care. Rest easy knowing they are in good hands.
             </p>
           </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Overdue Section */}
          {reminders.some(r => isOverdue(r.dueDate)) && (
            <section className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 flex items-center justify-center gap-2">
                 <AlertCircle size={12} /> Priority Attention
               </h3>
               <div className="space-y-4">
                 {reminders.filter(r => isOverdue(r.dueDate)).map(reminder => (
                    <ReminderCard key={reminder.id} reminder={reminder} onToggle={() => toggleStatus(reminder)} overdue />
                 ))}
               </div>
            </section>
          )}

          {/* Upcoming Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Scheduled</h3>
            <div className="space-y-4">
              {reminders.filter(r => !isOverdue(r.dueDate)).map(reminder => (
                <ReminderCard key={reminder.id} reminder={reminder} onToggle={() => toggleStatus(reminder)} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ReminderCard({ reminder, onToggle, overdue }: any) {
  const [completing, setCompleting] = useState(false);

  const handleToggle = () => {
    setCompleting(true);
    setTimeout(() => {
      onToggle();
    }, 400);
  };

  return (
    <motion.div
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={`group flex flex-col items-center gap-4 p-8 rounded-[32px] bg-white border border-grey-mid shadow-sm transition-all hover:shadow-lg ${completing ? 'opacity-50 scale-95' : ''} text-center`}
    >
      <button
        onClick={handleToggle}
        className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
          overdue
            ? "border-red-100 text-red-500 hover:border-red-500"
            : "border-grey-soft text-gray-300 hover:border-black hover:text-black"
        }`}
      >
        {completing ? <Check size={28} className="animate-in zoom-in duration-300" /> : <div className="w-2 h-2 rounded-full bg-current opacity-20" />}
      </button>

      <div className="space-y-2">
        <h4 className={`font-bold text-lg transition-colors ${overdue ? "text-red-900" : "text-black"}`}>
          {reminder.title}
        </h4>
        <div className="flex flex-col items-center gap-2">
           <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-widest">
             {reminder.petName}
           </span>
           <div className={`flex items-center gap-1.5 text-[11px] font-bold ${overdue ? "text-red-500" : "text-gray-400"}`}>
             <Calendar size={14} />
             {new Date(reminder.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
           </div>
        </div>
      </div>

      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
         <Clock size={18} />
      </div>
    </motion.div>
  );
}
