"use client";

/**
 * Modal.tsx — مكوّن النافذة المنبثقة الموحّد
 * يُستخدَم في جميع أنحاء المنصة بدلاً من أنماط modal المتكررة.
 *
 * الاستخدام:
 *   <Modal open={open} onClose={onClose} title="عنوان" size="lg">
 *     محتوى النافذة
 *   </Modal>
 */

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// ── الأحجام المتاحة ──────────────────────────────────────────
const SIZE_CLASSES = {
  sm:  "max-w-sm",
  md:  "max-w-lg",
  lg:  "max-w-2xl",
  xl:  "max-w-3xl",
  "2xl": "max-w-4xl",
  full: "max-w-[95vw]",
} as const;

export type ModalSize = keyof typeof SIZE_CLASSES;

export interface ModalProps {
  /** هل النافذة مفتوحة؟ */
  open: boolean;
  /** callback عند الإغلاق */
  onClose: () => void;
  /** عنوان النافذة (يظهر في الـ header) */
  title?: React.ReactNode;
  /** نص وصفي أسفل العنوان */
  description?: React.ReactNode;
  /** أيقونة / صورة تُعرض يمين العنوان */
  icon?: React.ReactNode;
  /** أزرار الـ footer (إلغاء، حفظ…) */
  footer?: React.ReactNode;
  /** حجم النافذة */
  size?: ModalSize;
  /** منع الإغلاق بالضغط على الخلفية */
  preventClose?: boolean;
  /** محتوى النافذة */
  children: React.ReactNode;
  /** class إضافي للـ container الداخلي */
  className?: string;
  /** class للوحة header */
  headerClassName?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  footer,
  size = "lg",
  preventClose = false,
  children,
  className = "",
  headerClassName = "",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventClose) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, preventClose]);

  // Lock body AND html scroll when open to prevent white bar from showing
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ zIndex: 9998 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={preventClose ? undefined : onClose}
            aria-hidden="true"
          />

          {/* ── Centering wrapper — stays strictly within viewport ── */}
          <div
            style={{ zIndex: 9999 }}
            className="fixed inset-0 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={preventClose ? undefined : onClose}
          >
            {/* ── Panel ── */}
            <motion.div
              key="modal-panel"
              ref={panelRef}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ maxHeight: "calc(100dvh - 2rem)" }}
              className={`relative w-full ${SIZE_CLASSES[size]} bg-white dark:bg-[var(--color-card)] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/8 flex flex-col overflow-hidden ${className}`}
              onClick={(e) => e.stopPropagation()}
            >

              {/* ── Header ── */}
              {(title || icon) && (
                <div
                  className={`shrink-0 flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 dark:border-white/8 bg-white dark:bg-[var(--color-card)] ${headerClassName}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {icon && (
                      <div className="shrink-0">{icon}</div>
                    )}
                    <div className="min-w-0">
                      {title && (
                        <h2
                          className="text-xl font-black text-gray-900 dark:text-white leading-snug"
                          style={{ fontFamily: "var(--font-headline)" }}
                        >
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* زر الإغلاق */}
                  <button
                    onClick={onClose}
                    aria-label="إغلاق"
                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15 hover:text-gray-800 dark:hover:text-white transition-all shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ── Body — scrolls internally ── */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
                {children}
              </div>

              {/* ── Footer ── */}
              {footer && (
                <div className="shrink-0 border-t border-gray-100 dark:border-white/8 bg-white dark:bg-[var(--color-card)] px-6 py-4">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── مكوّن قسم داخل النافذة (لتنظيم المحتوى) ────────────────
export function ModalSection({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em]">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

// ── Card داخل النافذة ────────────────────────────────────────
export function ModalCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/6 rounded-2xl p-4 ${className}`}
    >
      {children}
    </div>
  );
}
