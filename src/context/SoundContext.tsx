"use client";

/**
 * SoundContext — كونتكست إعدادات الصوت
 * يحفظ تفضيلات enabled/volume في localStorage
 * خفيف جداً — لا re-renders غير ضرورية
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { SoundLibrary, SoundName } from "@/lib/soundEngine";

const LS_KEY = "qsp-sound";

interface SoundCtxValue {
  enabled: boolean;
  volume: number;
  toggle: () => void;
  play: (name: SoundName) => void;
}

const SoundCtx = createContext<SoundCtxValue>({
  enabled: true,
  volume: 1,
  toggle: () => {},
  play: () => {},
});

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  // قراءة الإعداد المحفوظ عند التحميل
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved !== null) setEnabled(saved === "true");
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(LS_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const play = useCallback((name: SoundName) => {
    if (!enabled) return;
    try {
      SoundLibrary[name]();
    } catch {}
  }, [enabled]);

  return (
    <SoundCtx.Provider value={{ enabled, volume: 1, toggle, play }}>
      {children}
    </SoundCtx.Provider>
  );
}

export function useSound() {
  return useContext(SoundCtx);
}
