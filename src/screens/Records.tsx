import { useEffect, useState } from "react";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { motion } from "motion/react";
import { FileText, Calendar } from "lucide-react";

interface Pet {
  id: string;
  name: string;
  [key: string]: any;
}

export default function Records() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        // Fetch pets
        const petsQ = query(collection(db, "pets"), where("ownerId", "==", auth.currentUser.uid));
        const petsSnap = await getDocs(petsQ);
        const petsData = petsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Pet[];
        setPets(petsData);

        // Fetch records for all pets (simplified for now)
        let allRecords: any[] = [];
        for (const pet of petsData) {
          const recQ = query(collection(db, "pets", pet.id, "records"), orderBy("date", "desc"));
          const recSnap = await getDocs(recQ);
          const petRecords = recSnap.docs.map(doc => ({
            id: doc.id,
            petName: pet.name,
            ...doc.data()
          }));
          allRecords = [...allRecords, ...petRecords];
        }

        // Sort by date descending
        allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecords(allRecords);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "records");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredRecords = selectedPetId === "all"
    ? records
    : records.filter(r => r.petId === selectedPetId);

  // Group by year and month
  const groupedRecords: { [key: string]: any[] } = {};
  filteredRecords.forEach(record => {
    const date = new Date(record.date);
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groupedRecords[key]) groupedRecords[key] = [];
    groupedRecords[key].push(record);
  });

  if (loading) return <div className="h-full flex items-center justify-center">Loading timeline...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="space-y-4 text-center">
        <h1 className="text-3xl font-display font-black tracking-tight">Health Timeline</h1>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
          <button
            onClick={() => setSelectedPetId("all")}
            className={`px-4 h-10 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap border ${selectedPetId === "all" ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100'}`}
          >
            All Pack
          </button>
          {pets.map(pet => (
            <button
              key={pet.id}
              onClick={() => setSelectedPetId(pet.id)}
              className={`px-4 h-10 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap border ${selectedPetId === pet.id ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100'}`}
            >
              {pet.name}’s
            </button>
          ))}
        </div>
      </header>

      {records.length === 0 ? (
        <div className="pt-12 text-center space-y-4">
           <div className="w-16 h-16 bg-grey-soft rounded-full flex items-center justify-center mx-auto text-grey-text">
             <FileText size={32} />
           </div>
           <p className="text-gray-500 font-medium">Your timeline is empty.<br/>Scan a record to get started.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedRecords).map(([group, groupRecords]) => (
            <div key={group} className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                 <h2 className="text-[12px] font-bold uppercase tracking-widest text-[#111]">{group}</h2>
                 <div className="w-8 h-0.5 bg-black rounded-full" />
              </div>

              <div className="space-y-4">
                {groupRecords.map((record) => (
                  <TimelineCard key={record.id} record={record} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineCard({ record }: { record: any, key?: any }) {
  const getIcon = () => {
    switch (record.type) {
      case 'vaccine': return "💉";
      case 'deworming': return "💊";
      case 'prescription': return "📋";
      case 'report': return "📝";
      default: return "🐾";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white border border-grey-mid rounded-[radius-record] p-6 flex flex-col items-center gap-4 transition-all hover:shadow-lg group cursor-pointer text-center"
    >
      <div className="w-16 h-16 bg-grey-soft rounded-2xl flex items-center justify-center text-3xl group-hover:bg-black group-hover:text-white transition-colors flex-shrink-0 mx-auto">
        {getIcon()}
      </div>

      <div className="space-y-1">
        <h3 className="text-[16px] font-bold text-black">{record.title}</h3>
        <p className="text-[13px] text-grey-text font-medium flex flex-col items-center gap-1">
          <span className="capitalize font-bold">{record.type}</span>
          <span className="opacity-50 text-[11px]">{record.clinicName || 'Home Administered'}</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        {record.stickersFound && (
          <div className="px-3 py-1 bg-white border border-dashed border-grey-mid rounded-lg text-[8px] font-black opacity-30">
             STICKER FOUND
          </div>
        )}
        {!record.stickersFound && record.imageUrl && (
           <div className="text-[10px] font-black text-grey-text/40 bg-grey-soft px-3 py-1 rounded-md">IMAGE</div>
        )}
      </div>
    </motion.div>
  );
}
