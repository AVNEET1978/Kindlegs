import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import { Search, Beaker, Pill, Activity, FileText, Stethoscope, ChevronRight, Bell, ShieldCheck, Download } from "lucide-react";
import VetLookupModal from "../components/VetLookupModal";

interface Pet {
  id: string;
  name: string;
  breed?: string;
  species?: string;
  imageUrl?: string;
  [key: string]: any;
}

export default function Records() {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isVetLookupOpen, setIsVetLookupOpen] = useState(false);

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

        let allRecords: any[] = [];
        for (const pet of petsData) {
          const recQ = query(
            collection(db, "pets", pet.id, "records"), 
            where("ownerId", "==", uid),
            orderBy("date", "desc")
          );
          const recSnap = await getDocs(recQ);
          const petRecords = recSnap.docs.map(doc => ({
            id: doc.id,
            petId: pet.id,
            petName: pet.name,
            petImageUrl: pet.imageUrl,
            ...doc.data()
          }));
          allRecords = [...allRecords, ...petRecords];
        }

        allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecords(allRecords);
        setError(null);
      } catch (err: any) {
        console.error("Records fetch error:", err);
        setError(err.message || "Failed to load timeline.");
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

  const filteredRecords = records.filter(record => {
    const matchesTab = activeTab === "All" || record.type?.toLowerCase() === activeTab.toLowerCase().replace(/s$/, "");
    const matchesSearch = record.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         record.clinicName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const groupedRecords: { [key: string]: any[] } = {};
  filteredRecords.forEach(record => {
    const date = new Date(record.date);
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
    if (!groupedRecords[key]) groupedRecords[key] = [];
    groupedRecords[key].push(record);
  });

  if (loading) return <div className="h-full flex items-center justify-center font-bold text-gray-400">Loading records...</div>;

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="text-red-500 font-bold">Error</div>
        <div className="text-sm text-gray-600">{error}</div>
        <button onClick={() => { setLoading(true); window.location.reload(); }} className="px-6 py-2 bg-black text-white rounded-xl text-sm font-bold">Retry</button>
      </div>
    );
  }

  const activePet = pets[0]; // For demo/initial screen focus

  // Find the most urgent upcoming reminder
  const nextReminders = records
    .filter(r => r.nextDueDate && new Date(r.nextDueDate) >= new Date())
    .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  
  const mostUrgent = nextReminders[0];
  const daysTillNext = mostUrgent 
    ? Math.ceil((new Date(mostUrgent.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="pb-24 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between px-1">
        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
          {auth.currentUser?.displayName?.substring(0, 2).toUpperCase() || "KL"}
        </div>
        <h1 className="text-base font-bold">Health Timeline</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black transition-colors">
          <Search size={20} />
        </button>
      </header>

      {/* Pet Summary Bar */}
      {activePet && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 text-left">
            <img src={activePet.imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100"} className="w-10 h-10 rounded-lg object-cover" alt="" />
            <div>
              <h4 className="text-[13px] font-bold">{activePet.name}</h4>
              <p className="text-[11px] text-gray-400 font-medium">
                {activePet.breed || activePet.species} • {activePet.gender || "Male"}
              </p>
            </div>
          </div>
          <div className="text-right">
            {mostUrgent ? (
              <>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Next Due</p>
                <p className="text-[11px] font-bold text-gray-900 leading-tight truncate max-w-[100px]">{mostUrgent.title}</p>
                <p className={`text-[11px] font-bold ${daysTillNext && daysTillNext <= 14 ? "text-orange-600" : "text-green-600"}`}>
                  {daysTillNext === 0 ? "Today" : daysTillNext === 1 ? "Tomorrow" : `in ${daysTillNext} days`}
                </p>
              </>
            ) : (
              <>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Status</p>
                <p className="text-[11px] font-bold text-green-600">Up to date</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search Input & Vet Lookup */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Search size={16} />
          </div>
          <input 
            type="text" 
            placeholder="Search records" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-1 focus:ring-black/5 placeholder:text-gray-400"
          />
        </div>
        <button
          onClick={() => setIsVetLookupOpen(true)}
          className="h-12 px-3.5 bg-black text-white rounded-2xl text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm hover:bg-stone-900 transition-colors"
        >
          <Stethoscope size={14} className="text-amber-400" />
          Pull Vet ID
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {["All", "Vaccines", "Reports", "Prescriptions", "Deworming"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 h-9 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              {tab}
            </button>
          ))}
        </div>
        {activeTab !== "All" && (
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
            {filteredRecords.length} {activeTab} Records Found
          </p>
        )}
      </div>

      {/* Records List */}
      <div className="space-y-8">
        {Object.entries(groupedRecords).length > 0 ? Object.entries(groupedRecords).map(([month, monthRecords]) => (
          <div key={month} className="space-y-4">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-left px-1">{month}</h3>
            <div className="space-y-3">
              {monthRecords.map(record => (
                <div 
                  key={record.id} 
                  onClick={() => navigate(`/pets/${record.petId}/records/${record.id}`)}
                  className="bg-white rounded-[24px] border border-gray-100 p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getBgForType(record.type)}`}>
                       {getIconForType(record.type)}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold leading-tight">{record.title}</h4>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {new Date(record.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} • {record.clinicName || "Clinic"}
                      </p>
                      {record.nextDueDate && (
                         <p className={`text-[10px] font-bold mt-0.5 ${new Date(record.nextDueDate) < new Date() ? "text-red-500" : "text-green-600"}`}>
                           Next Due: {new Date(record.nextDueDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                           {new Date(record.nextDueDate) < new Date() && " (Overdue)"}
                         </p>
                      )}
                    </div>
                  </div>
                  {record.imageUrl && (
                    <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                      <img src={record.imageUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="py-20 text-center space-y-4">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
               <FileText size={32} />
             </div>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No matching records</p>
          </div>
        )}
      </div>

      <VetLookupModal
        isOpen={isVetLookupOpen}
        onClose={() => setIsVetLookupOpen(false)}
        petId={activePet?.id}
        petName={activePet?.name}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}

function getBgForType(type: string) {
  switch (type?.toLowerCase()) {
    case 'vaccine': return "bg-blue-50 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]";
    case 'prescription': return "bg-red-50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
    case 'deworming': return "bg-orange-50 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]";
    default: return "bg-purple-50 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]";
  }
}

function getIconForType(type: string) {
  switch (type?.toLowerCase()) {
    case 'vaccine': return <ShieldCheck size={20} />;
    case 'prescription': return <Pill size={20} />;
    case 'deworming': return <Activity size={20} />;
    case 'report': return <FileText size={20} />;
    default: return <Stethoscope size={20} />;
  }
}
