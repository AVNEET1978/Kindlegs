import { useEffect, useState } from "react";
import { db, auth, logOut, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { motion } from "motion/react";
import { LogOut, Plus, Trash2, Shield, Settings, Heart, Bell, ChevronRight, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(collection(db, "pets"), where("ownerId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        setPets(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "pets");
      }
      setLoading(false);
    };

    fetchPets();
  }, []);

  const handleDeletePet = async (petId: string) => {
    if (window.confirm("Are you sure you want to remove this pet profile? All records will be deleted.")) {
      const path = `pets/${petId}`;
      try {
        await deleteDoc(doc(db, path));
        setPets(pets.filter(p => p.id !== petId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center">Loading pet profiles...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-8">
      {/* User Header */}
      <header className="flex flex-col items-center text-center space-y-4 pt-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100">
            <img src={auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.email}`} alt="" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center border-2 border-white">
            <Shield size={14} />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-display font-black">{auth.currentUser?.displayName || "Kindlegs Member"}</h2>
          <div className="flex items-center gap-1.5 justify-center text-gray-400 text-sm font-medium">
            <Mail size={14} />
            {auth.currentUser?.email}
          </div>
        </div>
      </header>

      {/* Pet Profiles Section */}
      <section className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-3 px-2">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">My Pack</h3>
          <button onClick={() => navigate("/add-pet")} className="text-black hover:opacity-70 p-2 bg-grey-soft rounded-full">
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {pets.map(pet => (
            <div key={pet.id} className="bg-grey-soft rounded-[32px] p-8 border border-grey-mid flex flex-col items-center gap-4 group hover:bg-white hover:shadow-xl transition-all text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-inner flex-shrink-0 border border-grey-mid mx-auto">
                <img src={pet.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pet.name}`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg">{pet.name}</h4>
                <p className="text-xs font-bold text-grey-text uppercase tracking-widest">{pet.breed || pet.species} • {pet.gender}</p>
              </div>
              <button
                onClick={() => handleDeletePet(pet.id)}
                className="px-4 py-2 text-red-500 bg-white rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-50 shadow-sm mt-2 flex items-center gap-2"
              >
                <Trash2 size={14} /> Remove Profile
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* App Settings Section */}
      <section className="space-y-4 text-center">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 px-2">Settings</h3>
        <div className="bg-white rounded-[32px] border border-grey-mid divide-y divide-grey-soft overflow-hidden">
           <ProfileMenuItem icon={<Bell size={18} />} label="Care Reminders" toggle />
           <ProfileMenuItem icon={<Heart size={18} />} label="Medical Preferences" />
           <ProfileMenuItem icon={<Settings size={18} />} label="Security & Privacy" />
        </div>
      </section>

      <button
        onClick={() => logOut()}
        className="w-full h-16 bg-white border-2 border-gray-100 text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
      >
        <LogOut size={20} />
        Log Out
      </button>

      <div className="text-center">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Kindlegs v1.0.0 (Premium Companion)</p>
      </div>
    </div>
  );
}

function ProfileMenuItem({ icon, label, toggle }: any) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 hover:bg-gray-50/50 transition-colors cursor-pointer text-center">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-black">
        {icon}
      </div>
      <span className="font-bold text-sm tracking-tight">{label}</span>
      {toggle ? (
        <div className="w-12 h-6 bg-black rounded-full relative">
           <div className="absolute right-1 top-1 bottom-1 aspect-square bg-white rounded-full" />
        </div>
      ) : (
        <ChevronRight size={16} className="text-gray-300" />
      )}
    </div>
  );
}
