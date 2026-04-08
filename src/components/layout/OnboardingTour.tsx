'use client';

import { useEffect, useRef, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

export function OnboardingTour() {
    const { isTourPending, setTourPending, tourStepIndex, setTourStepIndex } = useAppStore();
    const pathname = usePathname();
    const router = useRouter();
    const driverRef = useRef<any>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const injectStyles = () => {
        if (typeof document === 'undefined') return;
        const styleId = 'driver-js-quran-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .driver-popover.premium-popover {
                background: rgba(255, 255, 255, 0.98) !important;
                backdrop-filter: blur(20px) !important;
                border-radius: 20px !important;
                padding: 30px !important;
                border: 1px solid rgba(255, 255, 255, 0.6) !important;
                box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.25) !important;
                max-width: 420px !important;
                direction: rtl !important;
                font-family: inherit !important;
            }

            .dark .driver-popover.premium-popover {
                background: rgba(15, 23, 42, 0.96) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                color: #f8fafc !important;
            }

            .driver-popover-title {
                font-size: 20px !important;
                font-weight: 900 !important;
                color: #047857 !important; /* Emerald 700 */
                margin-bottom: 12px !important;
                line-height: 1.3 !important;
            }

            .dark .driver-popover-title {
                color: #34d399 !important; /* Emerald 400 */
            }

            .driver-popover-description {
                font-size: 15px !important;
                line-height: 1.8 !important;
                color: #475569 !important;
                font-weight: 500 !important;
            }

            .dark .driver-popover-description {
                color: #cbd5e1 !important;
            }

            .driver-popover-footer {
                margin-top: 25px !important;
                display: flex !important;
                gap: 12px !important;
                justify-content: flex-end !important;
            }

            .driver-popover-next-btn {
                background: linear-gradient(135deg, #059669, #047857) !important; /* Emerald theme */
                color: white !important;
                border: none !important;
                border-radius: 12px !important;
                padding: 10px 24px !important;
                font-size: 15px !important;
                font-weight: 800 !important;
                text-shadow: none !important;
                box-shadow: 0 8px 16px rgba(5, 150, 105, 0.3) !important;
                transition: transform 0.2s, box-shadow 0.2s !important;
            }

            .driver-popover-next-btn:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 12px 24px rgba(5, 150, 105, 0.4) !important;
            }

            .driver-popover-prev-btn {
                background: transparent !important;
                color: #64748b !important;
                border: 1.5px solid #cbd5e1 !important;
                border-radius: 12px !important;
                padding: 9px 20px !important;
                font-weight: 700 !important;
                transition: all 0.2s !important;
            }
                
            .driver-popover-prev-btn:hover {
                background: #f1f5f9 !important;
                border-color: #94a3b8 !important;
            }

            .dark .driver-popover-prev-btn {
                border-color: #334155 !important;
                color: #94a3b8 !important;
            }

            .driver-popover-progress-text {
                background: #ecfdf5 !important; /* Emerald 50 */
                padding: 5px 12px !important;
                border-radius: 12px !important;
                font-weight: 800 !important;
                color: #065f46 !important; /* Emerald 800 */
                font-size: 12px !important;
            }

            .dark .driver-popover-progress-text {
                background: rgba(16, 185, 129, 0.1) !important; /* Emerald 500 at 10% */
                color: #34d399 !important; /* Emerald 400 */
            }
        `;
        document.head.appendChild(style);
    };

    const runTour = () => {
        injectStyles();

        // Sample Steps suitable for Quraanic Schools
        // Note: Target elements must exist in the UI with these class names or IDs.
        const steps: any[] = [
            {
                element: '.tour-step-dashboard-welcome',
                popover: {
                    title: '🕌 مرحباً بك في المعلم القرآني',
                    description: 'نسعد بانضمامك لمنصتنا لتعليم القرآن العظيم. سنأخذك في جولة سريعة للتعرف على الأدوات الأساسية هنا.',
                    side: "bottom",
                    align: 'center'
                }
            },
            {
                element: '.tour-step-students',
                popover: {
                    title: '👥 إدارة الطلاب',
                    description: 'من هنا يمكنك إضافة أسماء الطلاب، وتوزيعهم على الحلقات والمستويات المختلفة بطريقة منظمة.',
                    side: "left",
                    align: 'start',
                    onNextClick: () => {
                        // Example navigation logic:
                        // router.push('/app/students');
                        // setTourStepIndex(2);
                        // driverRef.current.destroy();
                        d.moveNext(); // If keeping on same page, simply moveNext
                    }
                }
            },
            {
                element: '.tour-step-points',
                popover: {
                    title: '⭐ نظام النقاط والمكافآت',
                    description: 'ركن أساسي! سجل نقاط تسميع أو سلوك إيجابي لتحفيز طلابك، واخصم النقاط في حالة الغياب بطريقة مرنة.',
                    side: "bottom",
                    align: 'center',
                }
            },
            {
                element: '.tour-step-covenants',
                popover: {
                    title: '📜 العهد القرآنية',
                    description: 'أداة رائعة لربط الطالب ببرنامج مراجعة دوري "عهد" لمنع تفلت القرآن، وتتابع تقدمه بوضوح.',
                    side: "right",
                    align: 'start'
                }
            },
            {
                element: 'body',
                popover: {
                    title: '🎉 بارك الله في جهودك',
                    description: 'أنت الآن جاهز لإدارة حلقاتك بكل يسر وسهولة. اضغط على أزرار المصباح 💡 متى ما احتجت لمساعدة إضافية.',
                    side: "top",
                    align: 'center',
                    onNextClick: () => {
                        setTourPending(false);
                        driverRef.current.destroy();
                        // router.push('/app/dashboard');
                    }
                }
            }
        ];

        const d = driver({
            showProgress: true,
            animate: true,
            allowClose: true, 
            overlayColor: 'rgba(0,0,0,0.7)',
            popoverClass: 'premium-popover',
            nextBtnText: 'التالي ➔',
            prevBtnText: '⬅ السابق',
            doneBtnText: 'إنهاء الجولة ✓',
            progressText: '{{current}} / {{total}}',
            steps: steps,
            onDeselected: () => {
                const index = d.getActiveIndex();
                if (index !== undefined) setTourStepIndex(index);
            },
            onDestroyed: () => {
                // If the user closed it prematurely, we stop the tour.
                setTourPending(false);
            }
        });

        driverRef.current = d;
        d.drive(tourStepIndex);
    };

    useEffect(() => {
        if (!isMounted || !isTourPending) return;

        // Give the DOM a moment to render before attempting the tour
        const timeoutId = setTimeout(() => {
            runTour();
        }, 300);

        return () => {
            clearTimeout(timeoutId);
            if (driverRef.current) driverRef.current.destroy();
        };
        // By watching tourStepIndex, we can orchestrate complex cross-page tours if needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTourPending, isMounted, pathname]);

    if (!isMounted || !isTourPending) return null;

    return null;
}
