"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { startSyncEngine, stopSyncEngine, subscribeSyncStatus, pullSync, type SyncStatus } from "@/lib/storage/syncEngine";
import type { AppUser, School } from "@/lib/types";

// ─── تحويل بيانات المدرسة من Supabase (snake_case) إلى CamelCase ──
function mapSchool(raw: any): School {
  return {
    id: raw.id,
    name: raw.name ?? "",
    city: raw.city ?? "",
    country: raw.country ?? "الجزائر",
    directorName: raw.director_name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    logoURL: raw.logo_url ?? undefined,
    seasonStartDate: raw.season_start_date ?? undefined,
    createdAt: raw.created_at ?? "",
    updatedAt: raw.updated_at ?? "",
    settings: raw.settings ?? {
      prices: { renewal: { 'فئة الأكابر': 1500, 'فئة الأصاغر': 1200 } },
      points: { attendance: { 'حاضر': 5, 'متأخر': 2, 'تعويض': 3, 'غائب': 0 }, evaluation: { 'ممتاز': 10, 'جيد جداً': 8, 'جيد': 6, 'متوسط': 3, 'لم يحفظ': 0 }, behavior: { 'هادئ': 3, 'متوسط': 1, 'غير منضبط': -1 }, review: { completed: 5 }, surah: { memorized: 15, mastered: 25 }, covenantCompleted: 10 },
      rewards: [],
      badges: [],
    },
  } as School;
}

// Types compatible with existing app expectations
interface AuthContextType {
  user: any | null;
  school: any | null;
  loading: boolean;
  role: string | null;
  isSuperAdmin: boolean;
  isPrincipal: boolean;
  isTeacher: boolean;
  syncStatus: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSchool: () => Promise<void>; // تحديث بيانات المدرسة من Supabase
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [school, setSchool] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: "idle", pendingCount: 0, lastSyncAt: new Date().toISOString() });
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Auth session error:", sessionError);
          // If the refresh token is invalid, clear the corrupted session
          if (sessionError.message?.includes("Refresh Token Not Found") || sessionError.name === "AuthApiError") {
            await supabase.auth.signOut();
            await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          }
        }

        if (!session) {
          if (mounted) {
            setUser(null);
            setSchool(null);
            setLoading(false);
          }
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (userData) {
          const formattedUser = {
            id: userData.id,
            email: userData.email,
            displayName: userData.display_name,
            role: userData.role,
            schoolId: userData.school_id,
            groupName: userData.group_name,
          };
          if (mounted) setUser(formattedUser);

          if (userData.school_id) {
            const { data: schoolData } = await supabase
              .from("schools")
              .select("*")
              .eq("id", userData.school_id)
              .single();
            if (mounted && schoolData) setSchool(mapSchool(schoolData));
          }
        } else {
          if (mounted) setUser(null);
        }
      } catch (e) {
        console.error("Auth session load failed:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          if (mounted) {
            setUser(null);
            setSchool(null);
          }
        } else {
          loadSession();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (user) {
      startSyncEngine();
      const unsub = subscribeSyncStatus((s) => setSyncStatus(s));

      // جلب شامل من Supabase عند أول تسجيل دخول لضمان اكتمال البيانات المحلية
      pullSync().catch(console.error);

      return () => {
        unsub();
        stopSyncEngine();
      };
    }
  }, [user]);

  const login = async (email: string, pass: string): Promise<void> => {
    // Calling the API route so it sets SSR cookies correctly
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "خطأ في تسجيل الدخول");
    }

    // Refresh data natively
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: userData } = await supabase.from("users").select("*").eq("id", session.user.id).single();
      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          displayName: userData.display_name,
          role: userData.role,
          schoolId: userData.school_id,
          groupName: userData.group_name,
        });
        if (userData.school_id) {
          const { data: schoolData } = await supabase.from("schools").select("*").eq("id", userData.school_id).single();
          if (schoolData) setSchool(mapSchool(schoolData));
        }
      }
    }
  };

  const logout = (): void => {
    supabase.auth.signOut();
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setSchool(null);
  };

  const refreshSchool = async (): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: userData } = await supabase.from("users").select("school_id").eq("id", session.user.id).single();
    if (userData?.school_id) {
      const { data: schoolData } = await supabase.from("schools").select("*").eq("id", userData.school_id).single();
      if (schoolData) setSchool(mapSchool(schoolData));
    }
  };

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
        refreshSchool,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth يجب أن يستخدم داخل AuthProvider");
  return ctx;
}
