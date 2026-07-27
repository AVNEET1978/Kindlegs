import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { compressImage } from "../lib/imageUtils";
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Plus, Camera, FileText, Calendar, Clock, ChevronRight, Activity, Beaker, Pill, Stethoscope, Upload, Bell, Search, Info, ShieldCheck, Weight } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePetIndex, setActivePetIndex] = useState(0);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, "pets"), where("ownerId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const petsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPets(petsData);

      if (petsData.length > 0) {
        const activePetIndexToFetch = activePetIndex < petsData.length ? activePetIndex : 0;
        const activePet = petsData[activePetIndexToFetch];
        
        // Fetch records
        const recPath = `pets/${activePet.id}/records`;
        const recQ = query(
          collection(db, recPath),
          where("ownerId", "==", auth.currentUser.uid),
          orderBy("date", "desc"),
          limit(5)
        );
        const recSnap = await getDocs(recQ);
        setRecentRecords(recSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch upcoming reminders
        const remPath = `pets/${activePet.id}/reminders`;
        const remQ = query(
          collection(db, remPath),
          where("ownerId", "==", auth.currentUser.uid),
          where("status", "==", "pending"),
          orderBy("dueDate", "asc"),
          limit(3)
        );
        const remSnap = await getDocs(remQ);
        setUpcomingReminders(remSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      setError(null);
    } catch (err: any) {
      console.error("Home fetch error:", err);
      setError(err.message || "An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      fetchPets();
    } else {
      const checkInterval = setInterval(() => {
        if (auth.currentUser?.uid) {
          fetchPets();
          clearInterval(checkInterval);
        }
      }, 500);
      return () => clearInterval(checkInterval);
    }
    
    const timeout = setTimeout(() => {
      setLoading(prev => prev ? false : prev);
    }, 4000);
    
    return () => clearTimeout(timeout);
  }, [activePetIndex, auth.currentUser?.uid]);

  const handleImageUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const activePet = pets[activePetIndex];
    if (file && activePet) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const petRef = doc(db, "pets", activePet.id);
        setLoading(true);
        try {
          const compressed = await compressImage(base64);
          await updateDoc(petRef, { imageUrl: compressed });
          const newPets = [...pets];
          newPets[activePetIndex].imageUrl = compressed;
          setPets(newPets);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `pets/${activePet.id}`);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getAge = (dob: string) => {
    if (!dob) return "Unknown age";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} year${age !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="text-red-500 font-bold">Error</div>
        <div className="text-sm text-gray-600 break-words max-w-full">{error}</div>
        <button onClick={() => { setLoading(true); fetchPets(); }} className="px-6 py-2 bg-black text-white rounded-xl text-sm font-bold">Retry</button>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 pt-12 p-6">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>🐾</motion.div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">No pets registered yet</h2>
          <p className="text-gray-500 max-w-xs mx-auto">Add your first pet to start tracking their medical history.</p>
        </div>
        <button onClick={() => navigate("/add-pet")} className="w-full h-14 bg-black text-white rounded-2xl font-semibold shadow-lg hover:bg-gray-900 transition-colors">Add My Pet</button>
      </div>
    );
  }

  const activePet = pets[activePetIndex];

  return (
    <div className="pb-24 space-y-8 animate-in fade-in duration-500">
      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpdate} />
      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleImageUpdate} />

      {/* Header */}
      <header className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
            {auth.currentUser?.displayName?.substring(0, 2).toUpperCase() || "KL"}
          </div>
          <div className="text-left">
            <p className="text-[11px] text-gray-500 font-medium">Good morning,</p>
            <h2 className="text-sm font-bold">{auth.currentUser?.displayName || "Avneet"}</h2>
          </div>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black transition-colors">
          <Bell size={20} />
        </button>
      </header>

      {/* Pet Card Section */}
      <section className="relative">
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex gap-6 overflow-hidden relative">
          {/* Pet Photo */}
          <div className="w-[140px] h-[190px] rounded-[24px] overflow-hidden bg-gray-100 relative group cursor-pointer" onClick={() => galleryInputRef.current?.click()}>
            <img 
              src={activePet.imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"} 
              alt={activePet.name} 
              className="w-full h-full object-cover transition-transform group-hover:scale-105" 
            />
          </div>

          {/* Pet Info */}
          <div className="flex-1 text-left space-y-4 pt-1">
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-tight">{activePet.name}</h1>
              <p className="text-[13px] text-gray-500 font-medium leading-tight">
                {activePet.breed || activePet.species}<br/>
                {getAge(activePet.dob)} • {activePet.gender || "Male"}
              </p>
            </div>

            <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-100/50 space-y-1">
              <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">Next reminder</p>
              <div className="flex items-start gap-2">
                 <div className="pt-0.5 text-orange-600"><Beaker size={14} /></div>
                 <div>
                    <p className="text-[11px] font-bold text-gray-900 leading-tight">Rabies vaccine</p>
                    <p className="text-[11px] text-gray-500">due in 12 days</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-3">
          <button 
            onClick={() => navigate("/scan")}
            className="w-full h-[60px] bg-black text-white rounded-2xl flex items-center justify-center gap-3 font-bold transition-transform active:scale-95 shadow-lg shadow-black/10"
          >
            <Camera size={20} />
            Scan New Record
          </button>

          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: <Camera size={18} />, label: "Scan" },
              { icon: <Upload size={18} />, label: "Upload" },
              { icon: <FileText size={18} />, label: "Timeline" },
              { icon: <Bell size={18} />, label: "Reminder" }
            ].map((btn, i) => (
              <button key={i} className="flex flex-col items-center justify-center gap-2 bg-gray-50 h-[80px] rounded-2xl text-gray-400 hover:text-black hover:bg-gray-100 transition-colors">
                {btn.icon}
                <span className="text-[10px] font-bold">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Care */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Upcoming Care</h3>
          <Link to="/reminders" className="text-[11px] font-bold text-gray-400 hover:text-black">See all</Link>
        </div>
        <div className="space-y-3">
          {upcomingReminders.length > 0 ? upcomingReminders.map(reminder => {
            const dueDate = new Date(reminder.dueDate);
            const diffDays = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const status = diffDays < 0 ? "Overdue" : diffDays <= 14 ? "Due Soon" : "Upcoming";
            
            return (
              <div key={reminder.id} onClick={() => navigate("/reminders")} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${status === "Overdue" ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"} rounded-xl flex items-center justify-center`}>
                    {getLargeIconForType(reminder.type || "vaccine")}
                  </div>
                  <div className="text-left">
                    <h4 className="text-[13px] font-bold">{reminder.title}</h4>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {diffDays < 0 ? "Past due" : `Due in ${diffDays} days`} • {dueDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold ${status === "Overdue" ? "text-red-500 bg-red-50" : "text-orange-500 bg-orange-50"} px-2.5 py-1 rounded-full`}>
                  {status}
                </span>
              </div>
            );
          }) : (
            <div className="p-8 text-center bg-gray-50 rounded-[24px] border border-gray-100">
               <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-loose">No pending reminders<br/>All caught up!</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Records */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Recent Records</h3>
          <Link to="/records" className="text-[11px] font-bold text-gray-400 hover:text-black">See all</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {recentRecords.length > 0 ? recentRecords.map(record => (
            <div key={record.id} className="flex-shrink-0 w-[120px] space-y-2">
              <div className="aspect-[3/4] bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden relative group">
                <img src={record.imageUrl || "https://placehold.co/120x160?text=Scan"} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                <div className="absolute top-2 right-2 w-6 h-6 bg-white/80 backdrop-blur rounded-lg flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                  {getIconForType(record.type)}
                </div>
              </div>
              <div className="text-left px-1">
                <h4 className="text-[11px] font-bold truncate">{record.title || "Record"}</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{new Date(record.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</p>
              </div>
            </div>
          )) : (
             <div className="w-full py-12 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
               <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-loose">No records found<br/>Tap scan to add your first</p>
             </div>
          )}
        </div>
      </section>

      {/* Health Summary */}
      <section className="space-y-4">
         <h3 className="text-base font-bold text-left">Health Summary</h3>
         <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Vaccines", value: "Up to date", icon: <ShieldCheck size={16} className="text-green-500" /> },
              { label: "Last Deworming", value: "2 months ago", icon: <Activity size={16} className="text-gray-400" /> },
              { label: "Weight", value: `${activePet.weight || 0} kg`, icon: <Weight size={16} className="text-gray-400" /> }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-3 text-center">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                  {stat.icon}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-[11px] font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
}

function getLargeIconForType(type: string) {
  switch (type?.toLowerCase()) {
    case 'vaccine': return <ShieldCheck size={20} />;
    case 'deworming': return <Activity size={20} />;
    case 'prescription': return <Pill size={20} />;
    case 'report': return <FileText size={20} />;
    default: return <Stethoscope size={20} />;
  }
}

function getIconForType(type: string) {
  switch (type?.toLowerCase()) {
    case 'vaccine': return <Beaker size={14} />;
    case 'deworming': return <Activity size={14} />;
    case 'prescription': return <Pill size={14} />;
    case 'report': return <FileText size={14} />;
    default: return <Stethoscope size={14} />;
  }
}

