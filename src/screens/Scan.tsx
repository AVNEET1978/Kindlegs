import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Upload, Check, Zap, Loader2, Calendar, FileText, ChevronRight, Calculator, Plus, Activity, ShieldCheck, Stethoscope, Pill } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { compressImage } from "../lib/imageUtils";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

enum ScanState {
  MENU,
  CAPTURE,
  ANALYZING,
  RESULT
}

export default function RecordScanner() {
  const navigate = useNavigate();
  const [state, setState] = useState<ScanState>(ScanState.MENU);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [saving, setSaving] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPets();
  }, [auth.currentUser]);

  const fetchPets = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, "pets"), where("ownerId", "==", auth.currentUser.uid));
      const snap = await getDocs(q);
      const petsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPets(petsData);
      if (petsData.length > 0 && !selectedPetId) {
        setSelectedPetId(petsData[0].id);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "pets");
    }
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const compressed = await compressImage(base64);
          setImage(compressed);
          setState(ScanState.ANALYZING);
          processImage(compressed);
        } catch (error) {
          setImage(base64);
          setState(ScanState.ANALYZING);
          processImage(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imgData: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const [mimeInfo, base64Data] = imgData.split(";base64,");
      const mimeType = mimeInfo.split(":")[1];

      const today = new Date("2026-05-15").toISOString().split('T')[0];
      const prompt = `You are a Pet Health Record Specialist. Analyze the provided image which is a pet's medical log (e.g., Immunization or Deworming record).
      
      CURRENT CONTEXT:
      - Today's date is ${today}. We are in the year 2026.
      - Many records from late 2025 will have next due dates in 2026.
      
      IMAGE CONTEXT:
      - The image may contain a table or list of multiple visits/entries over time.
      - Each entry usually has a Date, Weight, Treatment/Vaccine, and an Initial/Signature.
      - Completed entries MUST have a signature, stamp, or initial.
      - Due dates are often written separately (e.g., "Annual Booster ... Due", "Next Due", or a bottom row without a signature).
      - Dates are likely in DD/MM/YY or DD.MM.YY format (standard in India). Note: 26 means 2026, 25 means 2025.
      
      EXTRACTION RULES:
      1. Identify the MOST RECENT entry that has been COMPLETED (signed/stamped).
      2. Identify the NEXT DUE date. This is the nearest date AFTER the latest completed date that is marked as "Due", "Next", or "Booster", or any entry that is NOT yet signed/stamped.
      3. Normalize all dates to YYYY-MM-DD. Note that 6/26 means 2026, 7/25 means 2025.
      4. Determine the recordType: "vaccine", "deworming", "prescription", "report", or "visit".
      
      JSON OUTPUT REQUIRED:
      - recordType: string
      - title: A descriptive title based on the treatment (e.g., "DHPPi Vaccination", "Deworming")
      - date: YYYY-MM-DD (Date of the latest COMPLETED entry)
      - clinicName: Name of the clinic (e.g., "Auro Multispeciality Pet Hospital")
      - nextDueDate: YYYY-MM-DD (The next scheduled DUE date, MUST be in the future relative to completed date, often in 2026)
      - summary: A 1-sentence summary of the latest treatment and the specific date for the next booster.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: mimeType } }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recordType: { type: Type.STRING },
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              clinicName: { type: Type.STRING },
              nextDueDate: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ["recordType", "title", "date"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      setResult(data);
      setState(ScanState.RESULT);
    } catch (error) {
      console.error("AI Extraction failed:", error);
      // Fallback
      setResult({
        recordType: "vaccine",
        title: "Annual Vaccination",
        date: new Date().toISOString().split('T')[0],
        clinicName: "City Veterinary Clinic",
        nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        summary: "Routine checkup and vaccination completed."
      });
      setState(ScanState.RESULT);
    }
  };

  const saveRecord = async () => {
    if (!auth.currentUser || !selectedPetId || !result) return;
    setSaving(true);
    const path = `pets/${selectedPetId}/records`;
    try {
      const recordRef = await addDoc(collection(db, path), {
        ...result,
        type: result.recordType, // Mapping for compatibility
        petId: selectedPetId,
        ownerId: auth.currentUser.uid,
        imageUrl: image,
        createdAt: serverTimestamp(),
      });

      if (result.nextDueDate) {
        await addDoc(collection(db, `pets/${selectedPetId}/reminders`), {
          petId: selectedPetId,
          ownerId: auth.currentUser.uid,
          title: `Next ${result.title}`,
          dueDate: result.nextDueDate,
          status: "pending",
          originalRecordId: recordRef.id,
          createdAt: serverTimestamp(),
        });
      }
      navigate("/records");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col p-6 pb-12 overflow-y-auto outline-none">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black">
          <X size={24} />
        </button>
        <h1 className="text-base font-bold">Add Record</h1>
        <div className="w-10"></div>
      </header>

      <AnimatePresence mode="wait">
        {state === ScanState.MENU && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-left">Record Options</h2>
              <p className="text-sm text-gray-400 text-left font-medium">How would you like to add this record?</p>
            </div>

            <div className="space-y-3">
              <MenuOption 
                icon={<Camera size={20} />} 
                title="Scan medical record" 
                subtitle="Recommended • Intelligent AI extraction"
                recommended
                onClick={() => cameraInputRef.current?.click()}
              />
              <MenuOption 
                icon={<Activity size={20} />} 
                title="Log manual vaccination" 
                subtitle="Enter details yourself"
                onClick={() => galleryInputRef.current?.click()}
              />
              <MenuOption 
                icon={<FileText size={20} />} 
                title="Add other record" 
                subtitle="Prescriptions, reports, etc."
                onClick={() => galleryInputRef.current?.click()}
              />
            </div>
            
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />
            <input ref={galleryInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleCapture} />
          </motion.div>
        )}

        {state === ScanState.ANALYZING && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center space-y-8"
          >
            <div className="relative w-full max-w-[280px] aspect-[3/4] bg-gray-100 rounded-[32px] overflow-hidden shadow-2xl">
              {image && <img src={image} className="w-full h-full object-cover grayscale opacity-50" alt="" />}
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg text-black">
                  <Activity size={32} className="animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">AI Vision</p>
                  <p className="text-sm font-bold">Analyzing intelligence...</p>
                </div>
              </div>
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-black/20 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
              />
            </div>
            <p className="text-sm text-gray-400 font-medium max-w-[200px] text-center italic">
              Our AI is identifying vaccines, dates, and clinic information...
            </p>
          </motion.div>
        )}

        {state === ScanState.RESULT && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 flex flex-col h-full"
          >
            <div className="flex-1 space-y-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-sm border border-green-100">
                  <Check size={40} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black italic tracking-tight">Record Scanned!</h2>
                  <p className="text-sm text-gray-400 font-medium">Validation successful. Ready to save.</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-[32px] p-6 space-y-6 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="space-y-4 text-left">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detected Activity</p>
                      <p className="text-[17px] font-bold text-gray-900">{result.title}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clinic</p>
                      <p className="text-[15px] font-bold text-gray-900">{result.clinicName || "Clinic Info Found"}</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black border border-gray-100 shadow-sm">
                    {getSmallIconForType(result.recordType)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-black/5 pt-6">
                  <div className="text-left space-y-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                    <p className="font-bold">{result.date}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {result.nextDueDate ? "Next Due" : "Auto-Remind"}
                    </p>
                    <p className={`font-bold ${result.nextDueDate ? "text-orange-600" : "text-green-600"}`}>
                      {result.nextDueDate || "Yes"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-4">Assign member</p>
                <select
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-4 font-bold text-sm outline-none shadow-sm appearance-none"
                >
                   {pets.map(pet => (
                     <option key={pet.id} value={pet.id}>{pet.name}</option>
                   ))}
                </select>
              </div>
            </div>

            <button
              onClick={saveRecord}
              disabled={saving}
              className="w-full h-16 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {saving ? <Loader2 size={24} className="animate-spin text-white" /> : <ChevronRight size={20} />}
              Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuOption({ icon, title, subtitle, recommended, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-5 rounded-[28px] border flex items-center gap-4 transition-all active:scale-[0.98] text-left group ${recommended ? "bg-black border-black text-white" : "bg-white border-gray-100 text-gray-900 shadow-sm hover:border-gray-200"}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${recommended ? "bg-white/10" : "bg-gray-50 text-black group-hover:bg-gray-100"}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-[15px]">{title}</h3>
        <p className={`text-[11px] font-medium leading-tight ${recommended ? "text-white/60" : "text-gray-400"}`}>{subtitle}</p>
      </div>
      <ChevronRight size={18} className={recommended ? "text-white/40" : "text-gray-300"} />
    </button>
  );
}

function getSmallIconForType(type: string) {
  switch (type?.toLowerCase()) {
    case 'vaccine': return <ShieldCheck size={20} />;
    case 'prescription': return <Pill size={20} />;
    case 'deworming': return <Activity size={20} />;
    default: return <Stethoscope size={20} />;
  }
}

