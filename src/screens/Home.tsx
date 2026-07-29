import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { compressImage } from "../lib/imageUtils";
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Plus, Camera, FileText, Calendar, Clock, ChevronRight, Activity, Beaker, Pill, Stethoscope, Upload, Bell, Search, Info, ShieldCheck, Weight, Award, Scale, Share2, Phone, QrCode, Sparkles } from "lucide-react";
import PetSwitcher from "../components/PetSwitcher";
import PetPassportModal from "../components/PetPassportModal";
import WeightTrackerModal from "../components/WeightTrackerModal";
import VetLookupModal from "../components/VetLookupModal";
import { Droplets } from "lucide-react";

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

  // Boop Modal States
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isWeightOpen, setIsWeightOpen] = useState(false);
  const [isVetLookupOpen, setIsVetLookupOpen] = useState(false);

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
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Digital Records...</p>
      </div>
    );
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
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-3xl">🐾</motion.div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Welcome to Kindlegs</h2>
          <p className="text-gray-500 text-xs leading-relaxed max-w-xs mx-auto">
            Create your pet’s digital passport, track weight, log medical history, and set care reminders.
          </p>
        </div>
        <button onClick={() => navigate("/add-pet")} className="w-full h-14 bg-black text-white rounded-2xl font-bold shadow-lg hover:bg-gray-900 transition-colors">
          Add First Pet Passport
        </button>
      </div>
    );
  }

  const activePet = pets[activePetIndex];

  return (
    <div className="pb-24 space-y-7 animate-in fade-in duration-500 text-left">
      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpdate} />
      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleImageUpdate} />

      {/* Header with Pet Switcher */}
      <header className="flex items-center justify-between px-1 pt-1">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Digital Passport</p>
          <PetSwitcher pets={pets} activePetIndex={activePetIndex} onSelectPet={(idx) => setActivePetIndex(idx)} />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPassportOpen(true)} 
            className="h-9 px-3 bg-black text-white rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
          >
            <Award size={14} className="text-amber-400" />
            Passport Card
          </button>
          <button onClick={() => navigate("/reminders")} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black transition-colors border border-gray-100">
            <Bell size={18} />
          </button>
        </div>
      </header>

      {/* Pet Hero Passport Card Section */}
      <section className="relative">
        <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-black text-white rounded-[32px] p-6 shadow-xl border border-white/10 relative overflow-hidden space-y-5">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row inside Card */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">OFFICIAL PET PASSPORT</span>
            </div>
            <button 
              onClick={() => setIsPassportOpen(true)}
              className="text-[10px] font-mono text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <QrCode size={12} /> #KL-{activePet.id?.substring(0, 5).toUpperCase() || "PASS"}
            </button>
          </div>

          <div className="flex gap-5 items-center">
            {/* Pet Photo */}
            <div 
              className="w-[110px] h-[130px] rounded-[20px] overflow-hidden bg-zinc-800 border-2 border-white/20 relative group cursor-pointer shrink-0 shadow-md"
              onClick={() => galleryInputRef.current?.click()}
            >
              <img 
                src={activePet.imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"} 
                alt={activePet.name} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                Change Photo
              </div>
            </div>

            {/* Pet Quick Info */}
            <div className="flex-1 space-y-2 min-w-0">
              <div>
                <h1 className="text-2xl font-black text-white truncate">{activePet.name}</h1>
                <p className="text-xs text-amber-200/90 font-bold uppercase tracking-wider truncate">
                  {activePet.breed || activePet.species || "Dog"}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {getAge(activePet.dob)} • <span className="capitalize">{activePet.gender || "Male"}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => setIsWeightOpen(true)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 border border-white/10 transition-colors"
                >
                  <Weight size={12} className="text-amber-400" />
                  {activePet.weight ? `${activePet.weight} kg` : "Log Weight"}
                </button>

                <button
                  onClick={() => setIsPassportOpen(true)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 border border-white/10 transition-colors"
                >
                  <ShieldCheck size={12} className="text-emerald-400" />
                  Passport
                </button>
              </div>
            </div>
          </div>

          {/* Quick Notice Banner inside Hero */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-[11px] font-medium text-gray-300">
                {upcomingReminders.length > 0 
                  ? `Next due: ${upcomingReminders[0].title} (${new Date(upcomingReminders[0].dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})` 
                  : "All medical care & vaccines up to date!"}
              </span>
            </div>
            <button onClick={() => navigate("/reminders")} className="text-[10px] font-bold text-amber-300 hover:underline">
              View
            </button>
          </div>
        </div>

        {/* Feature Grid Shortcuts */}
        <div className="mt-4 grid grid-cols-4 gap-2.5">
          <button 
            onClick={() => navigate("/scan")} 
            className="flex flex-col items-center justify-center gap-2 bg-black text-white h-[85px] rounded-2xl shadow-md active:scale-95 transition-transform"
          >
            <Camera size={20} className="text-amber-400" />
            <span className="text-[10px] font-bold">AI Scan</span>
          </button>

          <button 
            onClick={() => setIsPassportOpen(true)} 
            className="flex flex-col items-center justify-center gap-2 bg-gray-50 border border-gray-100 hover:bg-gray-100 h-[85px] rounded-2xl text-gray-800 transition-colors"
          >
            <Award size={20} className="text-black" />
            <span className="text-[10px] font-bold">Passport</span>
          </button>

          <button 
            onClick={() => setIsWeightOpen(true)} 
            className="flex flex-col items-center justify-center gap-2 bg-gray-50 border border-gray-100 hover:bg-gray-100 h-[85px] rounded-2xl text-gray-800 transition-colors"
          >
            <Scale size={20} className="text-black" />
            <span className="text-[10px] font-bold">Weight Log</span>
          </button>

          <button 
            onClick={() => navigate("/blood-match")} 
            className="flex flex-col items-center justify-center gap-2 bg-amber-50 border border-amber-200/80 hover:bg-amber-100 h-[85px] rounded-2xl text-amber-950 transition-colors relative overflow-hidden"
          >
            <Droplets size={20} className="text-amber-800" />
            <span className="text-[10px] font-bold text-amber-900">Blood Match</span>
          </button>
        </div>

        {/* Emergency Blood Match Banner Card */}
        <div className="mt-4 bg-gradient-to-r from-stone-900 to-amber-950 text-white p-5 rounded-3xl shadow-lg border border-amber-900/40 flex items-center justify-between">
          <div className="space-y-1 pr-3 text-left">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[9px] font-bold tracking-widest uppercase text-amber-300">RAINBOW CROSSING NETWORK</span>
            </div>
            <h3 className="text-base font-black text-white leading-tight">Emergency Blood Match</h3>
            <p className="text-[11px] text-gray-300 font-medium">Find compatible canine blood donors nearby in minutes.</p>
          </div>
          <button
            onClick={() => navigate("/blood-match")}
            className="px-4 py-2.5 bg-amber-800 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold whitespace-nowrap shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Droplets size={14} />
            Find Donors
          </button>
        </div>

        {/* Vet ID Lookup Banner Card */}
        <div className="mt-3 bg-gray-50 border border-gray-200/80 p-4 rounded-3xl flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center shrink-0">
              <Stethoscope size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Vet History Sync</h4>
              <p className="text-[10px] text-gray-500 font-medium">Pull full clinic records with your Unique Vet ID.</p>
            </div>
          </div>
          <button
            onClick={() => setIsVetLookupOpen(true)}
            className="px-3 py-2 bg-black text-white rounded-xl text-[11px] font-bold hover:bg-stone-900 transition-colors shrink-0"
          >
            Lookup Vet ID
          </button>
        </div>
      </section>

      {/* Care Reminders */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Care & Reminders</h3>
          <Link to="/reminders" className="text-[11px] font-bold text-gray-400 hover:text-black">Manage All</Link>
        </div>
        <div className="space-y-2.5">
          {upcomingReminders.length > 0 ? upcomingReminders.map(reminder => {
            const dueDate = new Date(reminder.dueDate);
            const diffDays = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const status = diffDays < 0 ? "Overdue" : diffDays <= 14 ? "Due Soon" : "Upcoming";
            
            return (
              <div key={reminder.id} onClick={() => navigate("/reminders")} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${status === "Overdue" ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"} rounded-xl flex items-center justify-center shrink-0`}>
                    {getLargeIconForType(reminder.type || "vaccine")}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-gray-900">{reminder.title}</h4>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {diffDays < 0 ? "Past due" : diffDays === 0 ? "Due today" : `Due in ${diffDays} days`} • {dueDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold ${status === "Overdue" ? "text-red-500 bg-red-50" : "text-orange-500 bg-orange-50"} px-2.5 py-1 rounded-full`}>
                  {status}
                </span>
              </div>
            );
          }) : (
            <div className="p-6 text-center bg-gray-50 rounded-[24px] border border-gray-100 space-y-1">
               <p className="text-xs font-bold text-gray-700">All Reminders Up To Date 🐾</p>
               <p className="text-[11px] text-gray-400">No overdue vaccines, flea/tick, or medication treatments.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Medical Records */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Medical Timeline</h3>
          <Link to="/records" className="text-[11px] font-bold text-gray-400 hover:text-black">View All Records</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {recentRecords.length > 0 ? recentRecords.map(record => (
            <div 
              key={record.id} 
              onClick={() => navigate(`/pets/${activePet.id}/records/${record.id}`)}
              className="flex-shrink-0 w-[130px] space-y-2 cursor-pointer group"
            >
              <div className="aspect-[3/4] bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden relative shadow-sm">
                <img src={record.imageUrl || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                <div className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-black shadow-sm">
                  {getIconForType(record.type)}
                </div>
              </div>
              <div className="px-0.5">
                <h4 className="text-[12px] font-bold truncate text-gray-900">{record.title || record.recordType || "Medical Log"}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {new Date(record.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          )) : (
             <div className="w-full py-10 text-center bg-gray-50 rounded-[28px] border-2 border-dashed border-gray-200/80 space-y-2">
               <p className="text-xs font-bold text-gray-600">No records uploaded yet</p>
               <button onClick={() => navigate("/scan")} className="px-4 py-1.5 bg-black text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                 Scan First Record
               </button>
             </div>
          )}
        </div>
      </section>

      {/* Emergency Directory Card */}
      <section className="bg-gray-50 p-5 rounded-[28px] border border-gray-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Care & Emergency Directory</h3>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">24/7 Contacts</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-gray-100 space-y-1">
            <p className="text-[9px] font-bold text-gray-400 uppercase">Primary Vet Clinic</p>
            <p className="font-bold text-gray-900 truncate">{activePet.vetName || "Main Vet Hospital"}</p>
            <a href={`tel:${activePet.vetPhone || "+15550192"}`} className="text-[11px] font-bold text-black flex items-center gap-1 pt-1 hover:underline">
              <Phone size={12} className="text-emerald-600" /> {activePet.vetPhone || "Call Clinic"}
            </a>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-gray-100 space-y-1">
            <p className="text-[9px] font-bold text-red-500 uppercase">24/7 ER Vet</p>
            <p className="font-bold text-gray-900 truncate">{activePet.emergencyVet || "Emergency Pet Hospital"}</p>
            <a href={`tel:${activePet.emergencyPhone || "+15559911"}`} className="text-[11px] font-bold text-red-600 flex items-center gap-1 pt-1 hover:underline">
              <Phone size={12} /> {activePet.emergencyPhone || "Call Emergency"}
            </a>
          </div>
        </div>
      </section>

      {/* Modals */}
      <PetPassportModal
        pet={activePet}
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
        recentRecords={recentRecords}
      />

      <WeightTrackerModal
        pet={activePet}
        isOpen={isWeightOpen}
        onClose={() => setIsWeightOpen(false)}
        onWeightUpdated={(newW) => {
          const newPets = [...pets];
          newPets[activePetIndex].weight = newW;
          setPets(newPets);
        }}
      />

      <VetLookupModal
        isOpen={isVetLookupOpen}
        onClose={() => setIsVetLookupOpen(false)}
        petId={activePet?.id}
        petName={activePet?.name}
        onSuccess={() => fetchPets()}
      />
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


