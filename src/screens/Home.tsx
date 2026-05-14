import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { motion } from "motion/react";
import { Plus, Camera, FileText, Calendar, Clock, ChevronRight, Activity, Beaker, Pill, Stethoscope, Upload } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePetIndex, setActivePetIndex] = useState(0);

  const [recentRecords, setRecentRecords] = useState<any[]>([]);

  const fetchPets = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, "pets"), where("ownerId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const petsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPets(petsData);

      if (petsData.length > 0) {
        const activePet = petsData[activePetIndex];
        const recPath = `pets/${activePet.id}/records`;
        const recQ = query(
          collection(db, recPath),
          orderBy("date", "desc"),
          limit(3)
        );
        const recSnap = await getDocs(recQ);
        setRecentRecords(recSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "pets");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPets();
  }, [activePetIndex]);

  const handleImageUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const activePet = pets[activePetIndex];
    if (file && activePet) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const petRef = doc(db, "pets", activePet.id);
        try {
          await updateDoc(petRef, {
            imageUrl: base64
          });
          // Update local state
          const newPets = [...pets];
          newPets[activePetIndex].imageUrl = base64;
          setPets(newPets);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `pets/${activePet.id}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  if (pets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 pt-12">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
             🐾
          </motion.div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold">No pets registered yet</h2>
          <p className="text-gray-500 max-w-xs mx-auto">Add your first pet to start tracking their medical history.</p>
        </div>
        <button
          onClick={() => navigate("/add-pet")}
          className="px-8 h-14 bg-black text-white rounded-xl font-semibold shadow-lg hover:bg-gray-900"
        >
          Add My Pet
        </button>
      </div>
    );
  }

  const activePet = pets[activePetIndex];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-8">
      <input 
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpdate}
      />
      {/* Header */}
      <header className="flex flex-col items-center gap-4">
        <div className="space-y-0.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Welcome back</p>
          <h2 className="text-xl font-display font-black">{auth.currentUser?.displayName?.split(' ')[0] || 'User'}’s Pack</h2>
        </div>
        <div className="flex -space-x-2">
          {pets.map((pet, idx) => (
            <button
              key={pet.id}
              onClick={() => setActivePetIndex(idx)}
              className={`w-10 h-10 rounded-full border-2 border-white overflow-hidden transition-transform ${activePetIndex === idx ? 'scale-110 z-10' : 'opacity-60'}`}
            >
              <img src={pet.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pet.name}`} alt={pet.name} className="w-full h-full object-cover" />
            </button>
          ))}
          <Link to="/add-pet" className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-colors">
            <Plus size={16} />
          </Link>
        </div>
      </header>

      {/* Hero Pet Card */}
      <motion.div
        layoutId={`pet-card-${activePet.id}`}
        className="bg-grey-soft rounded-[32px] p-8 flex flex-col gap-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all"
      >
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square bg-gray-200 rounded-[24px] overflow-hidden relative shadow-inner cursor-pointer group"
        >
          <img src={activePet.imageUrl || `https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000`} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/90 p-3 rounded-full shadow-lg">
              <Camera size={24} className="text-black" />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 text-[10px] uppercase font-bold tracking-[0.2em] text-white bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm">
            {activePet.name}
          </div>
        </div>

        <div className="flex flex-col items-center text-center gap-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{activePet.name}</h1>
            <p className="text-sm font-medium text-grey-text">{activePet.breed || 'Mixed Breed'} • {activePet.species}</p>
            <div className="inline-flex items-center gap-1.5 bg-black/5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2 mx-auto">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Healthy • Up to date
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-grey-mid text-[12px] font-bold shadow-sm inline-block">
            {activePet.weight || '0'} kg
          </div>
        </div>

        <div className="bg-black text-white p-6 rounded-[24px] space-y-4 text-center">
           <div className="space-y-1">
             <p className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-60">Next Milestone</p>
             <h4 className="text-lg font-medium">Rabies Vaccination Booster</h4>
           </div>
           <div className="flex flex-col items-center gap-3 text-[11px] opacity-80 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Calendar size={12} />
                <span>Aug 12, 2024</span>
              </div>
              <Link to="/reminders" className="flex items-center gap-1 hover:underline">
                Manage Details <ChevronRight size={12} />
              </Link>
           </div>
        </div>

        <button
          onClick={() => navigate("/scan")}
          className="w-full h-16 bg-white border border-grey-mid text-black rounded-[20px] font-bold flex items-center justify-center gap-3 transition-all hover:bg-grey-soft active:scale-[0.98] shadow-sm mt-2"
        >
          <Camera size={20} />
          Scan New Record
        </button>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-grey-soft p-6 rounded-[24px] space-y-2 border border-black/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-grey-text">Last Weight</p>
          <div className="flex items-end gap-1.5">
            <span className="text-2xl font-bold">{activePet.weight || '0'} kg</span>
          </div>
          <p className="text-[10px] text-green-600 font-bold">+0.1 kg since last scan</p>
        </div>
        <div className="bg-grey-soft p-6 rounded-[24px] space-y-2 border border-black/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-grey-text">Medical Care</p>
          <div className="flex items-end gap-1.5">
            <span className="text-2xl font-bold">Pending</span>
          </div>
          <p className="text-[10px] text-black/40 font-bold">1 Alert due soon</p>
        </div>
      </div>

      {/* Recent Activity */}
      <section className="space-y-6 px-2 text-center">
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-lg font-display font-black">Recent Records</h3>
          <Link to="/records" className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-black">View Timeline</Link>
        </div>

        <div className="space-y-4">
          {recentRecords.length > 0 ? (
            recentRecords.map(record => (
              <RecordPreviewCard
                key={record.id}
                type={record.type}
                title={record.title}
                date={new Date(record.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                icon={getIconForType(record.type)}
              />
            ))
          ) : (
            <div className="py-8 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No recent records found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function getIconForType(type: string) {
  switch (type) {
    case 'vaccine': return <Beaker size={18} />;
    case 'deworming': return <Activity size={18} />;
    case 'prescription': return <Pill size={18} />;
    case 'report': return <FileText size={18} />;
    default: return <Stethoscope size={18} />;
  }
}

function RecordPreviewCard({ type, title, date, icon }: any) {
  return (
    <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 transition-colors group-hover:bg-white group-hover:shadow-sm mx-auto">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{type}</p>
        <p className="font-bold">{title}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{date}</p>
      </div>
      <ChevronRight size={14} className="text-gray-300 mx-auto" />
    </div>
  );
}
