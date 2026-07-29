import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  Droplets, 
  MapPin, 
  Phone, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  TestTube,
  Clock,
  User,
  MessageSquare,
  RefreshCw,
  Plus
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

enum MatchStep {
  SIGN_UP = 1,
  BLOOD_TYPE = 2,
  SCANNING = 3,
  CONNECTED = 4
}

interface DonorMatch {
  name: string;
  petName: string;
  bloodType: string;
  distance: string;
  phone: string;
  verified: boolean;
  avatar: string;
}

const CANINE_BLOOD_TYPES = [
  "DEA 1.1 positive",
  "DEA 1.1 negative",
  "DEA 1.2",
  "DEA 3",
  "DEA 4",
  "DEA 7",
  "Unknown (Test Needed)"
];

const MOCK_DONORS: DonorMatch[] = [
  {
    name: "Sarah M.",
    petName: "Milo",
    bloodType: "DEA 1.1 positive",
    distance: "2.4 km away",
    phone: "+1 (555) 234-5678",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
  },
  {
    name: "David K.",
    petName: "Rex",
    bloodType: "DEA 1.1 positive",
    distance: "4.1 km away",
    phone: "+1 (555) 876-5432",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
  },
  {
    name: "Dr. Elena V.",
    petName: "Buster (Vet Reserve)",
    bloodType: "DEA 1.1 positive",
    distance: "5.8 km away",
    phone: "+1 (555) 345-6789",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"
  }
];

export default function BloodMatch() {
  const navigate = useNavigate();
  const [step, setStep] = useState<MatchStep>(MatchStep.SIGN_UP);

  // Form State - Step 1
  const [name, setName] = useState(auth.currentUser?.displayName || "");
  const [registerMethod, setRegisterMethod] = useState<"phone" | "email">("phone");
  const [contactValue, setContactValue] = useState(auth.currentUser?.email || "+1 (555) 019-2831");

  // Form State - Step 2
  const [bloodType, setBloodType] = useState("DEA 1.1 positive");
  const [petName, setPetName] = useState("Bruno");
  const [isDonorSaved, setIsDonorSaved] = useState(false);
  const [testKitBooked, setTestKitBooked] = useState(false);

  // Step 3 State
  const [scanning, setScanning] = useState(false);
  const [donorsFoundCount, setDonorsFoundCount] = useState(0);

  // Step 4 State (Chat)
  const [messages, setMessages] = useState<Array<{ sender: "donor" | "user"; text: string; time: string }>>([
    { sender: "donor", text: "Milo's DEA 1.1 pos and free tonight.", time: "Just now" },
    { sender: "user", text: "That's a match — clinic by 8?", time: "Just now" },
    { sender: "donor", text: "On our way now.", time: "Just now" }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [connectedTime, setConnectedTime] = useState("1m 48s");

  // Fetch pet info if available
  useEffect(() => {
    const fetchPetDetails = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(collection(db, "pets"), where("ownerId", "==", auth.currentUser.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const petData = snap.docs[0].data();
          if (petData.name) setPetName(petData.name);
          if (petData.bloodType) setBloodType(petData.bloodType);
        }
      } catch (err) {
        console.error("Error fetching pet for blood match:", err);
      }
    };
    fetchPetDetails();
  }, []);

  const handleStep1Continue = () => {
    if (!name.trim()) return;
    setStep(MatchStep.BLOOD_TYPE);
  };

  const handleSaveToDonorDB = async () => {
    if (auth.currentUser) {
      try {
        await addDoc(collection(db, "blood_donors"), {
          ownerId: auth.currentUser.uid,
          ownerName: name,
          contact: contactValue,
          petName,
          bloodType,
          registeredAt: serverTimestamp(),
          available: true
        });
      } catch (e) {
        console.error("Donor registration error:", e);
      }
    }
    setIsDonorSaved(true);
  };

  const handleStartMatching = () => {
    setStep(MatchStep.SCANNING);
    setScanning(true);
    setDonorsFoundCount(0);

    // Simulate scanning progress
    setTimeout(() => setDonorsFoundCount(1), 1000);
    setTimeout(() => setDonorsFoundCount(2), 2200);
    setTimeout(() => {
      setDonorsFoundCount(3);
      setScanning(false);
      // Auto transition to connected after scan completes
      setTimeout(() => {
        setStep(MatchStep.CONNECTED);
      }, 1200);
    }, 3500);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;
    
    setMessages(prev => [
      ...prev,
      { sender: "user", text: inputMessage, time: "Just now" }
    ]);
    setInputMessage("");

    // Simulated quick donor response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { sender: "donor", text: "Got it! Heading to Auro Pet Hospital entrance. ETA 12 mins.", time: "Just now" }
      ]);
    }, 1800);
  };

  return (
    <div className="pb-24 space-y-6 text-left animate-in fade-in duration-300">
      {/* Header Banner */}
      <header className="flex items-center justify-between pt-1 pb-3 border-b border-gray-100">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:text-black transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-[9px] font-bold text-amber-700 tracking-widest uppercase">KindLegs • Rainbow Crossing Network</p>

          <h1 className="text-base font-black tracking-tight text-gray-900">Emergency Blood Match</h1>
        </div>
        <div className="w-10 flex items-center justify-end">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
        </div>
      </header>

      {/* Progress Stepper Bar (4 Screens) */}
      <div className="flex items-center justify-between px-2 pt-1">
        {[
          { id: 1, label: "Sign up" },
          { id: 2, label: "Add type" },
          { id: 3, label: "Matching" },
          { id: 4, label: "Connect" }
        ].map((s) => (
          <div 
            key={s.id} 
            onClick={() => s.id <= step && setStep(s.id as MatchStep)}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${step === s.id ? "opacity-100" : s.id < step ? "opacity-70" : "opacity-30"}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-colors ${step === s.id ? "bg-amber-800 text-white shadow-md scale-110" : s.id < step ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>
              {s.id < step ? "✓" : s.id}
            </div>
            <span className="text-[10px] font-bold text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: SIGN UP */}
      {step === MatchStep.SIGN_UP && (
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 pt-2"
        >
          <div className="bg-amber-50/60 border border-amber-200/70 p-4 rounded-3xl space-y-1">
            <h2 className="text-xl font-black text-amber-950">Emergency blood match, in minutes.</h2>
            <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
              Find a compatible canine blood donor nearby — from sign-up to a live conversation built directly into KindLegs.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">REGISTER WITH</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setRegisterMethod("phone")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${registerMethod === "phone" ? "bg-black text-white shadow-sm" : "text-gray-500 hover:text-black"}`}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterMethod("email")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${registerMethod === "email" ? "bg-black text-white shadow-sm" : "text-gray-500 hover:text-black"}`}
                >
                  Email
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {registerMethod === "phone" ? "PHONE NUMBER" : "EMAIL ADDRESS"}
              </label>
              <input
                type={registerMethod === "phone" ? "tel" : "email"}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={registerMethod === "phone" ? "+1 (555) 000-0000" : "you@example.com"}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
            </div>

            <button
              onClick={handleStep1Continue}
              className="w-full h-14 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Continue
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 2: ADD BLOOD TYPE */}
      {step === MatchStep.BLOOD_TYPE && (
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 pt-2"
        >
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">STEP 2 OF 4</span>
              <h3 className="text-lg font-black text-gray-900">Your Dog's Blood Type</h3>
              <p className="text-xs text-gray-400">Select {petName}'s verified blood group to scan compatible donors.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">BLOOD TYPE</label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-800 appearance-none"
              >
                {CANINE_BLOOD_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Test Kit Option */}
            <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">Don't know it yet?</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Home Test Available</span>
              </div>
              <button
                type="button"
                onClick={() => setTestKitBooked(true)}
                className="w-full py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <TestTube size={14} className="text-amber-800" />
                {testKitBooked ? "✓ Home test kit booked & dispatched!" : "Book a home test kit"}
              </button>
            </div>

            {/* Save to donor database toggle */}
            <div className="flex items-center justify-between p-3 bg-green-50/70 border border-green-200/80 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isDonorSaved ? "bg-green-600 animate-pulse" : "bg-gray-300"}`} />
                <span className="text-xs font-bold text-green-900">Saved to donor database</span>
              </div>
              <button
                type="button"
                onClick={handleSaveToDonorDB}
                className="text-[11px] font-bold text-green-800 underline hover:text-green-950"
              >
                {isDonorSaved ? "Saved ✓" : "Register as donor"}
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={handleStartMatching}
                className="w-full h-14 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Search size={18} />
                Find donors
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 3: GET MATCHED (Radar Scanning Screen) */}
      {step === MatchStep.SCANNING && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-stone-900 text-white rounded-3xl p-8 min-h-[380px] flex flex-col items-center justify-between text-center shadow-xl relative overflow-hidden my-2"
        >
          {/* Subtle Radar Ripple Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div 
              animate={{ scale: [1, 2.5], opacity: [0.6, 0] }} 
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
              className="w-32 h-32 border border-amber-500/30 rounded-full"
            />
            <motion.div 
              animate={{ scale: [1, 3.8], opacity: [0.4, 0] }} 
              transition={{ repeat: Infinity, duration: 2.5, delay: 0.8, ease: "easeOut" }}
              className="w-32 h-32 border border-amber-500/20 rounded-full"
            />
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">REAL-TIME SCANNING</span>
            <h3 className="text-lg font-black text-stone-100">Scanning Nearby Donors</h3>
          </div>

          {/* Central Blood Type Indicator */}
          <div className="relative z-10 my-6">
            <div className="w-32 h-32 bg-amber-800 text-white rounded-full flex flex-col items-center justify-center mx-auto shadow-[0_0_40px_rgba(184,84,40,0.5)] border-4 border-amber-600/40">
              <span className="text-[11px] font-bold text-amber-200 tracking-wider">DEA</span>
              <span className="text-2xl font-black tracking-tight">{bloodType.includes("positive") ? "1.1+" : "1.1-"}</span>
            </div>
          </div>

          <div className="space-y-3 relative z-10 w-full">
            <div className="inline-flex items-center gap-2 bg-stone-800/90 border border-stone-700/80 px-4 py-2 rounded-full text-xs font-bold text-stone-200">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
              <span>{donorsFoundCount} donors found • 2.4 km</span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium animate-pulse">
              matching in real time with willing donors...
            </p>

            <button
              onClick={() => setStep(MatchStep.CONNECTED)}
              className="w-full mt-2 py-3 bg-amber-800 text-white rounded-2xl font-bold text-xs shadow-md hover:bg-amber-700 transition-colors"
            >
              Open live match chat
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 4: CONNECT & ACT (Live Conversation Screen) */}
      {step === MatchStep.CONNECTED && (
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-1"
        >
          {/* Connected Timer Badge */}
          <div className="bg-stone-900 text-white p-4 rounded-3xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-800 rounded-2xl flex items-center justify-center font-bold text-white text-xs">
                DEA
              </div>
              <div className="text-left">
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300">CONNECTED IN</span>
                <p className="text-sm font-black text-white">{connectedTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-green-400 bg-green-950/80 border border-green-800/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                Matched
              </span>
            </div>
          </div>

          {/* Donor Quick Card */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-left">
              <img 
                src={MOCK_DONORS[0].avatar} 
                className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" 
                alt="Donor Avatar" 
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-gray-900">{MOCK_DONORS[0].name} ({MOCK_DONORS[0].petName})</h4>
                  <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                </div>
                <p className="text-[11px] text-gray-500 font-medium">{MOCK_DONORS[0].bloodType} • {MOCK_DONORS[0].distance}</p>
              </div>
            </div>
            <a 
              href={`tel:${MOCK_DONORS[0].phone}`}
              className="w-10 h-10 bg-amber-800 text-white rounded-full flex items-center justify-center hover:bg-amber-900 transition-colors shadow-sm"
              title="Call Donor Directly"
            >
              <Phone size={18} />
            </a>
          </div>

          {/* Direct Live Chat Box */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm space-y-4">
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                Live Donor Chat
              </span>
            </div>

            {/* Message Feed */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto p-1">
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                      m.sender === "user" 
                        ? "bg-amber-800 text-white rounded-br-xs" 
                        : "bg-gray-100 text-gray-900 rounded-bl-xs"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 px-1">{m.time}</span>
                </div>
              ))}
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-gray-100">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Message donor..."
                className="flex-1 h-11 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
              <button
                type="submit"
                className="w-11 h-11 bg-amber-800 text-white rounded-2xl flex items-center justify-center hover:bg-amber-900 transition-colors shadow-sm"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => alert("Clinic coordinates sent to donor: Auro Multispeciality Pet Hospital")}
              className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <MapPin size={14} className="text-amber-800" />
              Share Clinic Directions
            </button>
            <button
              onClick={() => setStep(MatchStep.SIGN_UP)}
              className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} />
              New Match Scan
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
