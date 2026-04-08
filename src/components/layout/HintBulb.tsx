'use client';

import { useRef, useState, useEffect } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HintStep {
    /** CSS selector of element to highlight. Omit for a centered popover. */
    element?: string;
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
}

interface HintBulbProps {
    steps: HintStep[];
    className?: string;
    label?: string;
    size?: 'sm' | 'md';
    /** Pulse button until user clicks it for the first time (localStorage-based) */
    pulseUntilSeen?: boolean;
}

const SEEN_KEY_PREFIX = 'hint-seen-';

let stylesInjected = false;
function injectHintStyles() {
    if (stylesInjected || typeof document === 'undefined') return;
    stylesInjected = true;

    const style = document.createElement('style');
    style.id = 'hint-bulb-styles-v1';
    style.textContent = `
        /* ─── Overlay ─── */
        .hint-driver-active #driver-page-overlay {
            background: rgba(0,0,0,0.78) !important;
        }

        /* ─── Highlighted element ring — light mode ─── */
        #driver-highlighted-element-stage {
            border-radius: 12px !important;
            box-shadow:
                0 0 0 3px #fff,
                0 0 0 6px #f59e0b,
                0 0 0 9px rgba(245,158,11,0.35),
                0 0 32px 8px rgba(245,158,11,0.2) !important;
            transition: box-shadow 0.25s ease, border-radius 0.25s ease !important;
        }

        /* ─── Dark mode overrides ─── */
        .dark #driver-highlighted-element-stage {
            box-shadow:
                0 0 0 4px rgba(255,255,255,0.95),
                0 0 0 7px #fbbf24,
                0 0 0 12px rgba(251,191,36,0.6),
                0 0 48px 16px rgba(251,191,36,0.4) !important;
        }

        .dark .driver-highlighted-element {
            filter: brightness(1.65) contrast(1.05) !important;
            transition: filter 0.3s ease !important;
        }

        /* ─── Popover base ─── */
        .hint-popover.driver-popover {
            background: rgba(255,255,255,0.99) !important;
            backdrop-filter: blur(20px) !important;
            border-radius: 20px !important;
            padding: 22px 26px 18px !important;
            border: 1.5px solid rgba(245,158,11,0.3) !important;
            box-shadow:
                0 0 0 4px rgba(245,158,11,0.06),
                0 24px 48px -12px rgba(0,0,0,0.22) !important;
            max-width: 360px !important;
            direction: rtl !important;
            font-family: inherit !important;
        }
        .dark .hint-popover.driver-popover {
            background: rgba(15,23,42,0.98) !important;
            border-color: rgba(251,191,36,0.3) !important;
            box-shadow:
                0 0 0 4px rgba(251,191,36,0.06),
                0 24px 48px -12px rgba(0,0,0,0.6) !important;
        }

        /* ─── Title ─── */
        .hint-popover .driver-popover-title {
            font-size: 16px !important;
            font-weight: 900 !important;
            color: #0f172a !important;
            margin-bottom: 8px !important;
            line-height: 1.4 !important;
        }
        .dark .hint-popover .driver-popover-title { color: #f1f5f9 !important; }

        /* ─── Description ─── */
        .hint-popover .driver-popover-description {
            font-size: 14px !important;
            line-height: 1.85 !important;
            color: #475569 !important;
        }
        .dark .hint-popover .driver-popover-description { color: #94a3b8 !important; }

        /* ─── Footer ─── */
        .hint-popover .driver-popover-footer {
            margin-top: 16px !important;
            gap: 8px !important;
            display: flex !important;
            align-items: center !important;
            border-top: 1px solid rgba(0,0,0,0.07) !important;
            padding-top: 14px !important;
        }
        .dark .hint-popover .driver-popover-footer {
            border-color: rgba(255,255,255,0.06) !important;
        }

        /* ─── Next / done button ─── */
        .hint-popover .driver-popover-next-btn {
            background: linear-gradient(135deg, #f59e0b, #d97706) !important;
            color: #fff !important;
            border: none !important;
            border-radius: 10px !important;
            padding: 8px 20px !important;
            font-size: 13px !important;
            font-weight: 800 !important;
            text-shadow: none !important;
            box-shadow: 0 4px 12px rgba(245,158,11,0.35) !important;
            transition: transform 0.15s, box-shadow 0.15s !important;
        }
        .hint-popover .driver-popover-next-btn:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 8px 18px rgba(245,158,11,0.45) !important;
        }

        /* ─── Prev button ─── */
        .hint-popover .driver-popover-prev-btn {
            background: transparent !important;
            color: #64748b !important;
            border: 1.5px solid #e2e8f0 !important;
            border-radius: 10px !important;
            padding: 7px 16px !important;
            font-weight: 700 !important;
            font-size: 13px !important;
        }
        .hint-popover .driver-popover-prev-btn:hover {
            border-color: #94a3b8 !important;
            background: #f8fafc !important;
        }
        .dark .hint-popover .driver-popover-prev-btn {
            border-color: #334155 !important;
            color: #94a3b8 !important;
        }

        /* ─── Progress text ─── */
        .hint-popover .driver-popover-progress-text {
            background: linear-gradient(135deg, #fef3c7, #fde68a) !important;
            color: #92400e !important;
            padding: 3px 11px !important;
            border-radius: 20px !important;
            font-weight: 900 !important;
            font-size: 11px !important;
            border: 1px solid rgba(217,119,6,0.18) !important;
        }
        .dark .hint-popover .driver-popover-progress-text {
            background: rgba(251,191,36,0.12) !important;
            color: #fbbf24 !important;
            border-color: rgba(251,191,36,0.25) !important;
        }

        /* ─── Close (X) button ─── */
        .hint-popover .driver-popover-close-btn {
            width: 26px !important;
            height: 26px !important;
            border-radius: 50% !important;
            background: #f1f5f9 !important;
            color: #64748b !important;
            font-size: 14px !important;
            top: 12px !important;
            right: 12px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.15s !important;
        }
        .hint-popover .driver-popover-close-btn:hover {
            background: rgba(239,68,68,0.1) !important;
            color: #ef4444 !important;
        }

        /* ─── Attention pulse ─── */
        @keyframes hint-attention {
            0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,0); }
            50%      { box-shadow: 0 0 0 7px rgba(251,191,36,0.28); }
        }
        .hint-bulb-attention { animation: hint-attention 2.4s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
}

export function HintBulb({ steps, className, label, size = 'md', pulseUntilSeen = true }: HintBulbProps) {
    const driverRef = useRef<ReturnType<typeof driver> | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [hasSeen, setHasSeen] = useState(true); // SSR-safe default
    
    // Store key based on the label or first step title
    const storageKey = SEEN_KEY_PREFIX + (label ?? steps[0]?.title ?? 'default').replace(/\s+/g, '-');

    useEffect(() => {
        if (!localStorage.getItem(storageKey)) setHasSeen(false);
    }, [storageKey]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        injectHintStyles();

        if (!hasSeen) {
            localStorage.setItem(storageKey, '1');
            setHasSeen(true);
        }

        // Toggle logic
        if (driverRef.current) {
            driverRef.current.destroy();
            driverRef.current = null;
            setIsActive(false);
            return;
        }

        const driverSteps: DriveStep[] = steps.map(step => ({
            ...(step.element ? { element: step.element } : {}),
            popover: {
                title: step.title,
                description: step.description,
                side: step.side ?? 'bottom',
                align: step.align ?? 'start',
            }
        }));

        const d = driver({
            showProgress: steps.length > 1,
            animate: true,
            allowClose: true,
            overlayColor: 'rgba(0,0,0,0.72)',
            popoverClass: 'hint-popover',
            nextBtnText: steps.length > 1 ? 'التالي ←' : 'فهمت ✓',
            prevBtnText: '→ السابق',
            doneBtnText: 'إلغاء ×',
            progressText: '{{current}} / {{total}}',
            smoothScroll: true,
            steps: driverSteps,
            onDestroyStarted: () => d.destroy(),
            onDestroyed: () => {
                setIsActive(false);
                driverRef.current = null;
                document.body.classList.remove('hint-driver-active');
            },
            onHighlightStarted: () => {
                document.body.classList.add('hint-driver-active');
            },
        });

        driverRef.current = d;
        setIsActive(true);
        d.drive();
    };

    const sizeClasses = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';
    const iconSize   = size === 'sm' ? 'w-3 h-3'  : 'w-4 h-4';

    return (
        <button
            type="button"
            onClick={handleClick}
            title={label ?? 'شرح وتفاصيل 💡'}
            aria-label={label ?? 'شرح وظيفة العنصر'}
            className={cn(
                'group relative inline-flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer select-none',
                'bg-amber-400/15 hover:bg-amber-400/30 border border-amber-300/50 hover:border-amber-400',
                'shadow-[0_0_6px_rgba(251,191,36,0.2)] hover:shadow-[0_0_12px_rgba(251,191,36,0.4)]',
                isActive && 'bg-amber-400/35 shadow-[0_0_14px_rgba(251,191,36,0.6)] border-amber-400',
                !hasSeen && pulseUntilSeen && 'hint-bulb-attention',
                sizeClasses,
                className
            )}
        >
            <Lightbulb
                className={cn(
                    'transition-all duration-200',
                    isActive
                        ? 'text-amber-500 animate-pulse drop-shadow-[0_0_5px_rgba(251,191,36,0.9)]'
                        : 'text-amber-500/80 group-hover:text-amber-500 group-hover:drop-shadow-[0_0_5px_rgba(251,191,36,0.7)]',
                    iconSize
                )}
            />
            {/* Step count badge for multiple instructions */}
            {steps.length > 1 && !isActive && (
                <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center leading-none shadow-sm pointer-events-none">
                    {steps.length}
                </span>
            )}
        </button>
    );
}
