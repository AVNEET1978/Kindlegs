import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { compressImage } from "../lib/imageUtils";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "motion/react";
import { ChevronLeft, Camera, Upload, Check } from "lucide-react";

export default function AddPet() {
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    species: "dog",
    breed: "",
    dob: "",
    gender: "male",
    weight: "",
    color: "",
    microchip: "",
    spayedNeutered: true,
    insuranceProvider: "",
    insurancePolicy: "",
    vetName: "",
    vetPhone: "",
    emergencyPhone: "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const compressed = await compressImage(base64);
          setImage(compressed);
        } catch (error) {
          console.error("Compression error:", error);
          setImage(base64); // Fallback to original if compression fails
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "pets"), {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        imageUrl: image,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "pets");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500 text-center px-4">
        <div className="w-24 h-24 bg-black text-white rounded-[40px] flex items-center justify-center shadow-2xl mx-auto">
          <Check size={48} />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black">Registration Successful!</h1>
          <p className="text-grey-text font-medium leading-relaxed max-w-xs mx-auto">
            {formData.name} is now part of your pack. Let's add some medical records to get started.
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.setItem("highlight_plus", "true");
            navigate("/");
          }}
          className="w-full max-w-sm h-16 bg-black text-white rounded-[24px] font-bold shadow-xl active:scale-[0.98] transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
      <header className="flex flex-col items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-grey-text hover:text-black mb-2"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-[10px] uppercase tracking-widest text-grey-text tracking-[0.2em]">Register Pet</span>
      </header>

      <div className="space-y-2">
        <h1 className="text-3xl font-black">Tell us about your pet.</h1>
        <p className="text-grey-text font-medium">Let’s get their health profile started.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-8">
        <div className="flex flex-col items-center gap-3 py-4">
          <input
            type="file"
            ref={cameraInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
          />
          <input
            type="file"
            ref={galleryInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
          <div 
            onClick={() => galleryInputRef.current?.click()}
            className="w-24 h-24 bg-grey-soft border border-grey-mid rounded-[24px] flex flex-col items-center justify-center text-grey-text hover:border-black hover:text-black transition-colors cursor-pointer shadow-sm relative overflow-hidden"
          >
            {image ? (
              <img src={image} alt="Pet Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera size={24} />
            )}
          </div>
          <div className="flex flex-col gap-2 w-full max-w-[200px]">
            <button 
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-3 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <Camera size={14} /> Take a Photo
            </button>
            <button 
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="px-4 py-3 bg-white border border-grey-mid text-black rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-grey-soft transition-colors"
            >
              <Upload size={14} /> Upload from Device
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-grey-text opacity-60 block text-center">
              Pet Name
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Luna"
              className="w-full h-14 px-4 bg-grey-soft border border-grey-mid rounded-[16px] focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-grey-text/40 text-center"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-grey-text opacity-60 block text-center">
                Species
              </label>
              <select
                className="w-full h-14 px-4 bg-grey-soft border border-grey-mid rounded-[16px] focus:ring-1 focus:ring-black outline-none appearance-none text-center"
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
              >
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="rabbit">Rabbit</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-grey-text opacity-60 block text-center">
                Gender
              </label>
              <select
                className="w-full h-14 px-4 bg-grey-soft border border-grey-mid rounded-[16px] focus:ring-1 focus:ring-black outline-none appearance-none text-center"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-grey-text opacity-60 block text-center">
              Breed
            </label>
            <input
              type="text"
              placeholder="e.g. Golden Retriever"
              className="w-full h-14 px-4 bg-grey-soft border border-grey-mid rounded-[16px] focus:ring-1 focus:ring-black outline-none text-center"
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-grey-text opacity-60 block text-center">
              Date of Birth
            </label>
            <input
              required
              type="date"
              className="w-full h-14 px-4 bg-grey-soft border border-grey-mid rounded-[16px] focus:ring-1 focus:ring-black outline-none text-center"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-grey-text opacity-60 block text-center">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                className="w-full h-14 px-4 bg-grey-soft border border-grey-mid rounded-[16px] focus:ring-1 focus:ring-black outline-none text-center font-bold"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-grey-text opacity-60 block text-center">
                Colour
              </label>
              <input
                type="text"
                placeholder="e.g. Golden"
                className="w-full h-14 px-4 bg-grey-soft border border-grey-mid rounded-[16px] focus:ring-1 focus:ring-black outline-none text-center font-bold"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>

          {/* Additional Passport & Vet Info */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-black text-center">Digital Passport & Vet Contacts</p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-grey-text opacity-60 block text-center">
                Microchip Number
              </label>
              <input
                type="text"
                placeholder="e.g. 985141002938102"
                className="w-full h-14 px-4 bg-grey-soft border border-grey-mid rounded-[16px] focus:ring-1 focus:ring-black outline-none text-center font-mono text-sm font-bold"
                value={formData.microchip}
                onChange={(e) => setFormData({ ...formData, microchip: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-grey-text opacity-60 block text-center">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  placeholder="e.g. Petplan"
                  className="w-full h-14 px-4 bg-grey-soft border border-grey-mid rounded-[16px] focus:ring-1 focus:ring-black outline-none text-center text-xs font-bold"
                  value={formData.insuranceProvider}
                  onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-grey-text opacity-60 block text-center">
                  Spayed / Neutered
                </label>
                <select
                  className="w-full h-14 px-4 bg-grey-soft border border-grey-mid rounded-[16px] focus:ring-1 focus:ring-black outline-none appearance-none text-center font-bold"
                  value={formData.spayedNeutered ? "yes" : "no"}
                  onChange={(e) => setFormData({ ...formData, spayedNeutered: e.target.value === "yes" })}
                >
                  <option value="yes">Yes (Neutered)</option>
                  <option value="no">No (Intact)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-grey-text opacity-60 block text-center">
                  Primary Vet Clinic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Valley Vet"
                  className="w-full h-14 px-4 bg-grey-soft border border-grey-mid rounded-[16px] focus:ring-1 focus:ring-black outline-none text-center text-xs font-bold"
                  value={formData.vetName}
                  onChange={(e) => setFormData({ ...formData, vetName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-grey-text opacity-60 block text-center">
                  Vet Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1 555-0192"
                  className="w-full h-14 px-4 bg-grey-soft border border-grey-mid rounded-[16px] focus:ring-1 focus:ring-black outline-none text-center text-xs font-bold"
                  value={formData.vetPhone}
                  onChange={(e) => setFormData({ ...formData, vetPhone: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full h-16 bg-black text-white rounded-2xl font-semibold hover:bg-gray-900 transition-colors disabled:bg-gray-200 mt-4 shadow-lg active:scale-[0.98] transition-all"
        >
          {loading ? "Adding Pet..." : "Complete Registration"}
        </button>
      </form>
    </div>
  );
}
