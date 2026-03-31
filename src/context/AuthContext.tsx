"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getDB } from "@/lib/storage/db";
import { startSyncEngine, stopSyncEngine, subscribeSyncStatus } from "@/lib/storage/syncEngine";
import type { SyncStatus } from "@/lib/storage/syncEngine";
import type { AppUser, School } from "@/lib/types";

// ─── نوع السياق ──────────────────────────────────────────

interface AuthContextType {
  user: AppUser | null;
  school: School | null;
  loading: boolean;
  role: AppUser["role"] | null;
  isSuperAdmin: boolean;
  isPrincipal: boolean;
  isTeacher: boolean;
  syncStatus: SyncStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── مخزن الجلسة المحلية ─────────────────────────────────

const SESSION_KEY = "qsp_session"; // quran-schools-platform session

function loadSession(): { userId: string; schoolId: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(userId: string, schoolId: string): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, schoolId }));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Provider ─────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: "idle",
    lastSyncAt: null,
    pendingCount: 0,
  });

  // ─── تحميل الجلسة عند البدء ────────────────────────────

  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const db = getDB();
          const savedUser = await db.users.get(data.user.id);
          const savedSchool = await db.schools.get(data.user.schoolId);
          
          if (savedUser && savedSchool) {
            setUser(savedUser);
            setSchool(savedSchool);
          } else {
            // First time on this device or local DB cleared
            setUser(data.user);
            saveSession(data.user.id, data.user.schoolId);
          }
        } else if (res.status === 401) {
          // Token expired or invalid
          clearSession();
          setUser(null);
          setSchool(null);
        } else {
          fallbackToLocalSession();
        }
      } catch (err) {
        // Network error (Offline mode)
        fallbackToLocalSession();
      } finally {
        setLoading(false);
      }
    }

    async function fallbackToLocalSession() {
      const session = loadSession();
      if (!session) return;
      const db = getDB();
      const savedUser = await db.users.get(session.userId);
      const savedSchool = await db.schools.get(session.schoolId);
      if (savedUser && savedSchool) {
        setUser(savedUser);
        setSchool(savedSchool);
      }
    }

    restoreSession();
  }, []);

  // ─── تشغيل محرك المزامنة عند تسجيل الدخول ─────────────

  useEffect(() => {
    if (!user) return;

    startSyncEngine();
    const unsub = subscribeSyncStatus(setSyncStatus);

    return () => {
      unsub();
      stopSyncEngine();
    };
  }, [user?.id]);

  // ─── تسجيل الدخول ────────────────────────────────────

  const login = async (email: string, password: string): Promise<void> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "تأكد من بيانات الدخول وحاول مجدداً.");
    }

    const data = await res.json();
    const db = getDB();
    
    saveSession(data.user.id, data.user.schoolId);
    setUser(data.user);

    const foundSchool = await db.schools.get(data.user.schoolId);
    if (foundSchool) {
      setSchool(foundSchool);
    }
  };

  // ─── تسجيل الخروج ────────────────────────────────────

  const logout = (): void => {
    stopSyncEngine();
    setUser(null);
    setSchool(null);
    clearSession();
    
    // Clear HttpOnly cookie on server
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  };

  // ─── الصلاحيات ───────────────────────────────────────

  const role = user?.role ?? null;
  const isSuperAdmin = role === "super_admin";
  const isPrincipal = role === "principal" || role === "super_admin";
  const isTeacher = role === "teacher" || isPrincipal;

  return (
    <AuthContext.Provider
      value={{
        user,
        school,
        loading,
        role,
        isSuperAdmin,
        isPrincipal,
        isTeacher,
        syncStatus,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth يجب أن يستخدم داخل AuthProvider");
  return ctx;
}
