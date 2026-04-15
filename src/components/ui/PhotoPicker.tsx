"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, X, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotoPickerProps {
  currentPhoto?: string;        // data URL أو رابط حالي
  displayName?: string;         // الحرف الأول في حالة غياب الصورة
  size?: "sm" | "md" | "lg";   // حجم العرض
  onPhotoChange: (dataUrl: string | undefined) => void;
  disabled?: boolean;
}

const SIZE_MAP = {
  sm: { wrapper: "w-14 h-14", text: "text-xl", badge: "w-5 h-5 -bottom-0.5 -left-0.5" },
  md: { wrapper: "w-20 h-20", text: "text-2xl", badge: "w-6 h-6 -bottom-0.5 -left-0.5" },
  lg: { wrapper: "w-28 h-28", text: "text-3xl", badge: "w-8 h-8 -bottom-1 -left-1" },
};

export function PhotoPicker({
  currentPhoto,
  displayName = "؟",
  size = "md",
  onPhotoChange,
  disabled = false,
}: PhotoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const s = SIZE_MAP[size];

  const processFile = (file: File | null) => {
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      onPhotoChange(e.target?.result as string);
      setLoading(false);
    };
    reader.readAsDataURL(file);
    setMenu(false);
  };

  return (
    <div className="relative inline-block">
      {/* Avatar */}
      <div
        className={`${s.wrapper} rounded-2xl overflow-hidden relative cursor-pointer group shrink-0`}
        onClick={() => !disabled && setMenu((v) => !v)}
      >
        {currentPhoto ? (
          <img src={currentPhoto} alt="photo" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-black" style={{ fontFamily: "var(--font-headline)" }}>
            <span className={s.text}>{displayName[0] ?? "؟"}</span>
          </div>
        )}
        {/* Overlay on hover */}
        {!disabled && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {loading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </div>
        )}
      </div>

      {/* Badge */}
      {!disabled && (
        <div
          className={`${s.badge} absolute bg-[var(--color-primary)] rounded-full border-2 border-white flex items-center justify-center cursor-pointer shadow-md`}
          onClick={() => setMenu((v) => !v)}
        >
          <Camera className="w-2.5 h-2.5 text-white" />
        </div>
      )}

      {/* Dropdown menu */}
      <AnimatePresence>
        {menu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 right-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[180px]"
            >
              {/* Camera */}
              <button
                onClick={() => { setMenu(false); cameraInputRef.current?.click(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Camera className="w-4 h-4 text-[var(--color-primary)]" />
                التقاط صورة
              </button>
              {/* Gallery */}
              <button
                onClick={() => { setMenu(false); fileInputRef.current?.click(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
              >
                <ImagePlus className="w-4 h-4 text-blue-500" />
                اختيار من المعرض
              </button>
              {/* Remove */}
              {currentPhoto && (
                <button
                  onClick={() => { onPhotoChange(undefined); setMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50"
                >
                  <X className="w-4 h-4" />
                  إزالة الصورة
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => processFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => processFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
