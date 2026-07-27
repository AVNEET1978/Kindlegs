import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ChevronLeft, Share2, MoreVertical, CheckCircle2, ShieldCheck, Calendar, MapPin, Info, Beaker, Pill, Activity, FileText, Stethoscope, Clock } from "lucide-react";

export default function RecordDetails() {
  const { petId, recordId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Details");
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!petId || !recordId) return;
      try {
        const docRef = doc(db, "pets", petId, "records", recordId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRecord({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching record:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [petId, recordId]);

  if (loading) return <div className="h-full flex items-center justify-center font-bold text-gray-400">Loading details...</div>;
  if (!record) return <div className="h-full flex items-center justify-center font-bold text-gray-400">Record not found.</div>;

  return (
    <div className="pb-12 animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between px-1">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black">
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-1">
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black">
            <Share2 size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Title Section */}
      <div className="space-y-4 px-1 text-left">
        <div className="space-y-1">
          <h1 className="text-2xl font-black">{record.title}</h1>
          <div className="flex items-center gap-4 text-[13px] text-gray-500 font-medium">
             <div className="flex items-center gap-1.5">
               <Calendar size={14} className="text-gray-300" />
               {new Date(record.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
             </div>
             <div className="flex items-center gap-1.5">
               <MapPin size={14} className="text-gray-300" />
               {record.clinicName || "Clinic"}
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-green-600 font-bold text-[11px] bg-green-50 px-3 py-1.5 rounded-full w-fit">
          <CheckCircle2 size={14} />
          Completed Record
        </div>
      </div>

      {/* Document Image */}
      <div 
        onClick={() => setShowFullImage(true)}
        className="aspect-[4/3] rounded-[32px] overflow-hidden bg-gray-100 border border-gray-100 relative group cursor-zoom-in"
      >
        <img 
          src={record.imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"} 
          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
          alt="" 
        />
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/20 to-transparent">
           <p className="text-white text-[10px] font-bold uppercase tracking-widest opacity-80">Tap to view full scan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-2xl flex gap-1 w-full max-w-[320px]">
          {["Details", "Notes"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 h-10 rounded-xl text-[11px] font-bold transition-all ${activeTab === tab ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Full Image Overlay */}
      {showFullImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
          onClick={() => setShowFullImage(false)}
        >
          <button className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <MoreVertical size={24} />
          </button>
          <img 
            src={record.imageUrl} 
            className="max-w-full max-h-full object-contain rounded-lg" 
            alt="Full scan" 
          />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-[11px] font-bold uppercase tracking-widest">
            Tap anywhere to close
          </div>
        </div>
      )}

      {/* Tab Content: Details */}
      {activeTab === "Details" ? (
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 gap-6 px-1">
            <DetailItem label="Type" value={record.type || "Other"} icon={<Info size={16} />} />
            <DetailItem label="Batch Number" value={record.batchNumber || "Not recorded"} icon={<ShieldCheck size={16} />} />
            <DetailItem label="Date of Extraction" value={new Date(record.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} icon={<Calendar size={16} />} />
            <DetailItem label="Next Due" value={record.nextDueDate ? new Date(record.nextDueDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : "None"} icon={<Clock size={16} />} />
            <DetailItem label="Clinic Name" value={record.clinicName || "Unknown"} icon={<MapPin size={16} />} />
          </div>

          {/* AI Banner */}
          <div className="bg-orange-50/50 border border-orange-100 rounded-[24px] p-6 flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                  <Activity size={16} />
                </div>
                <h4 className="text-[14px] font-bold">AI Health Extract</h4>
              </div>
              <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] bg-white px-2 py-1 rounded-full border border-green-100">
                <CheckCircle2 size={12} /> Verified
              </div>
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed font-medium">
              This record was analyzed by Gemini. We recommend comparing with the physical book during your next visit.
            </p>
          </div>
        </div>
      ) : (
        <div className="py-12 px-4 text-center">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">No additional notes for this record</p>
          <button className="mt-4 px-6 py-2 border border-gray-200 rounded-full text-[11px] font-bold hover:bg-gray-50 transition-colors">Add Note</button>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
        {icon}
      </div>
      <div className="space-y-0.5 pt-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-[15px] font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
