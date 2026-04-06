import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, ChevronRight, FileText, Layers, Phone, Scale, Settings, Wallet, AlertCircle, Clock, HelpCircle, AlertTriangle, Receipt, ShieldCheck, FileSearch, FileSignature, Gavel, ArrowRight, User, Award, CheckCircle, Lock, ChevronLeft, X } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function LandingPage() {
  const [lawyers, setLawyers] = useState<any[]>([
    { name: '정해원', role: '대표변호사', img: '/jeong.jpg' },
    { name: '윤선영', role: '대표변호사', img: 'https://picsum.photos/seed/lawyer2/400/400' },
    { name: '곽은정', role: '대표변호사', img: 'https://picsum.photos/seed/lawyer3/400/400' },
  ]);
  const [cases, setCases] = useState<any[]>([
    { type: '사기 / 횡령', result: '집행유예', desc: '피해액 10억 원 이상, 실형 위기 방어', docImg: 'https://picsum.photos/seed/doc1/400/600' },
    { type: '특수 폭행', result: '불기소', desc: '합의 거부 상황에서 정당방위 입증', docImg: 'https://picsum.photos/seed/doc2/400/600' },
    { type: '음주운전 3진', result: '벌금형 감경', desc: '혈중알코올농도 0.15% 이상, 구속 영장 기각', docImg: 'https://picsum.photos/seed/doc3/400/600' },
  ]);

  const [certificates, setCertificates] = useState<any[]>([
    { img: 'https://picsum.photos/seed/cert1/300/400' },
    { img: 'https://picsum.photos/seed/cert2/300/400' },
    { img: 'https://picsum.photos/seed/cert3/300/400' },
    { img: 'https://picsum.photos/seed/cert4/300/400' },
  ]);
  const [activePopup, setActivePopup] = useState<any>(null);

  useEffect(() => {
    const qLawyers = query(collection(db, 'lawyers'), orderBy('order', 'asc'));
    const unsubLawyers = onSnapshot(qLawyers, (snapshot) => {
      if (!snapshot.empty) {
        setLawyers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    const qCases = query(collection(db, 'cases'), orderBy('order', 'asc'));
    const unsubCases = onSnapshot(qCases, (snapshot) => {
      if (!snapshot.empty) {
        setCases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    const qCertificates = query(collection(db, 'certificates'), orderBy('order', 'asc'));
    const unsubCertificates = onSnapshot(qCertificates, (snapshot) => {
      if (!snapshot.empty) {
        setCertificates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    const qPopups = query(collection(db, 'popups'), orderBy('createdAt', 'desc'));
    const unsubPopups = onSnapshot(qPopups, (snapshot) => {
      const active = snapshot.docs.find(doc => doc.data().isActive);
      if (active) {
        setActivePopup({ id: active.id, ...active.data() });
      } else {
        setActivePopup(null);
      }
    });

    return () => {
      unsubLawyers();
      unsubCases();
      unsubCertificates();
      unsubPopups();
    };
  }, []);
  // Lawyer Slider State & Handlers
  const [lawyerIndex, setLawyerIndex] = useState(0);
  const lawyerTouchStartX = useRef(0);
  const lawyerTouchEndX = useRef(0);

  const handleLawyerTouchStart = (e: React.TouchEvent) => {
    lawyerTouchStartX.current = e.changedTouches[0].screenX;
  };
  const handleLawyerTouchEnd = (e: React.TouchEvent) => {
    lawyerTouchEndX.current = e.changedTouches[0].screenX;
    if (lawyerTouchStartX.current - lawyerTouchEndX.current > 50) {
      setLawyerIndex((prev) => (prev + 1) % lawyers.length);
    }
    if (lawyerTouchEndX.current - lawyerTouchStartX.current > 50) {
      setLawyerIndex((prev) => (prev - 1 + lawyers.length) % lawyers.length);
    }
  };

  // Case Slider State & Handlers
  const [caseIndex, setCaseIndex] = useState(0);
  const caseTouchStartX = useRef(0);
  const caseTouchEndX = useRef(0);

  const handleCaseTouchStart = (e: React.TouchEvent) => {
    caseTouchStartX.current = e.changedTouches[0].screenX;
  };
  const handleCaseTouchEnd = (e: React.TouchEvent) => {
    caseTouchEndX.current = e.changedTouches[0].screenX;
    if (caseTouchStartX.current - caseTouchEndX.current > 50) {
      setCaseIndex((prev) => (prev + 1) % cases.length);
    }
    if (caseTouchEndX.current - caseTouchStartX.current > 50) {
      setCaseIndex((prev) => (prev - 1 + cases.length) % cases.length);
    }
  };

  const [formData, setFormData] = useState({ name: '', phone: '', alcoholLevel: '0.03~0.08%', duiHistory: '0회', details: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('이름과 연락처를 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'consultations'), {
        ...formData,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Send Telegram Notification
      let botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      let chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const settingsDoc = await getDoc(doc(db, 'settings', 'telegram'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.botToken) botToken = data.botToken;
          if (data.chatId) chatId = data.chatId;
        }
      } catch (e) {
        console.error("Failed to fetch telegram settings from Firestore", e);
      }
      
      if (botToken && chatId) {
        const message = `🚨 새로운 상담 신청이 접수되었습니다!\n\n👤 이름: ${formData.name}\n📞 연락처: ${formData.phone}\n🍷 알코올 농도: ${formData.alcoholLevel}\n🚔 음주운전 전력: ${formData.duiHistory}\n📝 내용: ${formData.details}`;
        
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
            }),
          });
        } catch (telegramError) {
          console.error("Telegram notification failed", telegramError);
        }
      }

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      setFormData({ name: '', phone: '', alcoholLevel: '0.03~0.08%', duiHistory: '0회', details: '' });
    } catch (error: any) {
      console.error("Error submitting consultation", error);
      alert(`신청 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-play effect
  useEffect(() => {
    if (lawyers.length === 0 || cases.length === 0) return;
    
    const lawyerTimer = setInterval(() => {
      setLawyerIndex((prev) => (prev + 1) % lawyers.length);
    }, 3000);
    const caseTimer = setInterval(() => {
      setCaseIndex((prev) => (prev + 1) % cases.length);
    }, 4000);
    return () => {
      clearInterval(lawyerTimer);
      clearInterval(caseTimer);
    };
  }, [lawyers.length, cases.length]);

  const scrollToForm = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('consultation-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] font-sans text-white selection:bg-[#C5A880]/30 pb-20 lg:pb-0">
      
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 lg:bottom-10 left-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[100] font-bold whitespace-nowrap"
          >
            <CheckCircle className="w-5 h-5" />
            상담 신청이 접수되었습니다.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Logo */}
      <header className="absolute top-0 left-0 right-0 w-full p-5 lg:px-12 lg:py-8 flex items-center justify-start lg:justify-between z-10 animate-fade-in-up">
        <div className="flex items-center gap-2.5">
          <img src="https://beobjin-criminal.com/images/common/logo.png" alt="법률사무소 법진 형사센터 로고" className="h-6 lg:h-9 object-contain" />
          <span className="font-extrabold text-sm lg:text-lg tracking-tight text-[#E2C792] border-l border-[#334155] pl-2.5">법률사무소 법진</span>
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <span className="text-[#94A3B8] font-medium text-sm">24시간 긴급 법률상담</span>
          <span className="text-[#E2C792] font-bold text-lg tracking-wide">031-214-5566</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] px-5 sm:px-6 lg:px-12 flex flex-col justify-center items-center pt-24 pb-6 lg:pb-0 overflow-hidden">
        
        {/* Subtle 330 Watermark */}
        <div className="absolute -bottom-8 -right-8 sm:-bottom-12 sm:-right-12 text-[160px] sm:text-[280px] font-black text-[#94A3B8] opacity-[0.07] select-none pointer-events-none leading-none tracking-tighter blur-[3px] z-0">
          330
        </div>
        
        <div className="max-w-md mx-auto sm:max-w-3xl lg:max-w-7xl w-full flex flex-col lg:flex-row justify-center items-center lg:items-center text-center lg:text-left gap-12 lg:gap-20 relative z-10">
          
          {/* Left Content */}
        <div className="flex-1 flex flex-col justify-center items-center lg:items-start w-full">
          
          {/* Trust Elements */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6 animate-fade-in-up">
            <span className="bg-[#C5A880]/10 text-[#E2C792] border border-[#C5A880]/30 px-2.5 py-1 rounded-full text-[11px] sm:text-[12px] font-bold flex items-center gap-1.5 backdrop-blur-sm shadow-sm">
              <Scale className="w-3.5 h-3.5 text-[#C5A880]" /> 음주운전 전문 변호인단
            </span>
            <span className="bg-[#7F1D1D]/40 text-[#FCA5A5] border border-[#7F1D1D]/50 px-2.5 py-1 rounded-full text-[11px] sm:text-[12px] font-bold flex items-center gap-2 shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F87171] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EF4444]"></span>
              </span>
              24시 긴급 대응
            </span>
          </div>

          {/* Main Title */}
          <div className="mb-7 w-full animate-fade-in-up animation-delay-100">
            <h1 className="text-[50px] sm:text-[72px] lg:text-[80px] xl:text-[90px] font-extrabold tracking-tight text-white leading-[1.1] break-keep drop-shadow-md">
              음주운전,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E2C792] to-[#C5A880]">결과는 지키고</span><br className="sm:hidden" /> <span className="text-white">비용은 낮췄습니다</span>
            </h1>
          </div>

          {/* Sub-copy */}
          <div className="text-[17px] sm:text-xl lg:text-2xl text-[#94A3B8] font-medium break-keep leading-relaxed mb-8 animate-fade-in-up animation-delay-200 space-y-1 lg:space-y-2">
            <p>불필요한 과정은 제거하고</p>
            <p><strong className="text-[#E2C792]">결과에 필요한 대응</strong>만 남겼습니다</p>
          </div>

          {/* Mobile 3-Step Process Graphic (Hidden on Desktop) */}
          <div className="w-full max-w-[340px] mx-auto lg:hidden bg-[#111827]/80 backdrop-blur-md rounded-2xl p-4 shadow-2xl mb-8 animate-fade-in-up animation-delay-300 flex items-center justify-between border border-white/10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 rounded-full bg-[#1E293B] flex items-center justify-center border border-[#334155]">
                <Settings className="w-5 h-5 text-[#94A3B8]" />
              </div>
              <span className="text-[13px] font-bold text-[#CBD5E1]">과정 최적화</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#475569]" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 rounded-full bg-[#1E293B] flex items-center justify-center border border-[#334155]">
                <Layers className="w-5 h-5 text-[#94A3B8]" />
              </div>
              <span className="text-[13px] font-bold text-[#CBD5E1]">시스템 구축</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#475569]" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 rounded-full bg-[#C5A880]/15 flex items-center justify-center border border-[#C5A880]/30 shadow-[0_0_15px_rgba(197,168,128,0.15)]">
                <Wallet className="w-5 h-5 text-[#E2C792]" />
              </div>
              <span className="text-[13px] font-extrabold text-[#E2C792]">합리적 비용</span>
            </div>
          </div>

          {/* Desktop Inline CTA (Hidden on Mobile) */}
          <div className="hidden lg:flex gap-4 mt-4 animate-fade-in-up animation-delay-300">
            <a href="tel:031-214-5566" className="flex items-center justify-center gap-2 bg-[#1E293B] text-white border border-[#334155] px-8 py-4 rounded-xl font-bold text-[17px] hover:bg-[#334155] transition-colors active:scale-[0.98]">
              <Phone className="w-5 h-5 text-[#94A3B8]" />
              전화 상담
            </a>
            <a 
              href="#consultation-form"
              onClick={scrollToForm}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#E2C792] to-[#C5A880] text-[#0A0F1C] px-8 py-4 rounded-xl font-bold text-[17px] hover:from-[#D4B881] hover:to-[#B59870] transition-colors shadow-lg shadow-[#C5A880]/20 active:scale-[0.98]"
            >
              <FileText className="w-5 h-5" />
              상담 신청하기
            </a>
          </div>

        </div>

        {/* Desktop Right Panel (Hidden on Mobile) */}
        <div className="hidden lg:flex w-full max-w-[480px] flex-col animate-fade-in-up animation-delay-400">
          <div className="bg-[#111827]/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#C5A880]/10 rounded-full blur-3xl"></div>
            
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
              <div className="w-1.5 h-7 bg-gradient-to-b from-[#E2C792] to-[#C5A880] rounded-full"></div>
              법진 독보적 시스템
            </h3>
            
            <div className="flex flex-col gap-5 relative z-10">
              {/* Step 1 */}
              <div className="flex items-center gap-5 bg-[#1E293B]/50 p-5 rounded-2xl border border-white/5 hover:bg-[#1E293B] transition-colors group">
                <div className="w-14 h-14 rounded-full bg-[#0A0F1C] flex items-center justify-center border border-[#334155] shrink-0 group-hover:border-[#94A3B8] transition-colors">
                  <Settings className="w-6 h-6 text-[#94A3B8] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="text-[17px] font-bold text-[#CBD5E1] group-hover:text-white transition-colors">1. 과정 최적화</h4>
                  <p className="text-[14px] text-[#64748B] mt-1">불필요한 절차를 생략하여 시간 단축</p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="flex items-center gap-5 bg-[#1E293B]/50 p-5 rounded-2xl border border-white/5 hover:bg-[#1E293B] transition-colors group">
                <div className="w-14 h-14 rounded-full bg-[#0A0F1C] flex items-center justify-center border border-[#334155] shrink-0 group-hover:border-[#94A3B8] transition-colors">
                  <Layers className="w-6 h-6 text-[#94A3B8] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="text-[17px] font-bold text-[#CBD5E1] group-hover:text-white transition-colors">2. 시스템 구축</h4>
                  <p className="text-[14px] text-[#64748B] mt-1">데이터 기반의 체계적인 승소 전략</p>
                </div>
              </div>
              {/* Step 3 */}
              <div className="flex items-center gap-5 bg-gradient-to-r from-[#C5A880]/10 to-transparent p-5 rounded-2xl border border-[#C5A880]/30 hover:from-[#C5A880]/20 transition-colors">
                <div className="w-14 h-14 rounded-full bg-[#C5A880]/20 flex items-center justify-center border border-[#C5A880]/40 shrink-0 shadow-[0_0_15px_rgba(197,168,128,0.2)]">
                  <Wallet className="w-6 h-6 text-[#E2C792]" />
                </div>
                <div>
                  <h4 className="text-[17px] font-extrabold text-[#E2C792]">3. 합리적 비용</h4>
                  <p className="text-[14px] text-[#C5A880]/80 mt-1">거품을 뺀 투명하고 합리적인 수임료</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

      </section>

      {/* Section 2: Empathy / Problem Identification */}
      <section className="relative py-24 lg:py-32 bg-[#0F172A] px-5 sm:px-6 lg:px-12 overflow-hidden">
        {/* Subtle 330 Watermark */}
        <div className="absolute -bottom-8 -right-8 sm:-bottom-12 sm:-right-12 text-[160px] sm:text-[280px] font-black text-[#94A3B8] opacity-[0.07] select-none pointer-events-none leading-none tracking-tighter blur-[3px] z-0">
          330
        </div>
        
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="max-w-3xl mx-auto flex flex-col items-center relative z-10">
          
          {/* Hook / Title */}
          <div className="text-center mb-16">
            <h2 className="text-[52px] sm:text-[68px] lg:text-[84px] font-black text-white leading-[1.1] break-keep drop-shadow-2xl">
              혹시,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E2C792] to-[#C5A880]">이런 고민</span><br />
              중이신가요?
            </h2>
          </div>

          {/* Empathy List (5 Bubbles) */}
          <div className="w-full flex flex-col gap-4 mb-16">
            {/* Thought 1 */}
            <div className="bg-[#1E293B]/80 backdrop-blur-sm border border-white/5 rounded-2xl rounded-tl-sm p-5 sm:p-6 w-[90%] sm:w-[80%] self-start shadow-lg">
              <p className="text-[16px] sm:text-[18px] text-[#CBD5E1] leading-relaxed break-keep font-medium text-left">
                "변호사를 지금 선임해야 할까,<br />아니면 조금 더 지켜볼까?"
              </p>
            </div>
            
            {/* Thought 2 */}
            <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-white/5 rounded-2xl rounded-tr-sm p-5 sm:p-6 w-[85%] sm:w-[75%] self-end shadow-lg">
              <p className="text-[16px] sm:text-[18px] text-[#CBD5E1] leading-relaxed break-keep font-medium text-left">
                "변호사 비용이 너무 부담되는데..."
              </p>
            </div>

            {/* Thought 3 */}
            <div className="bg-[#1E293B]/80 backdrop-blur-sm border border-white/5 rounded-2xl rounded-tl-sm p-5 sm:p-6 w-[90%] sm:w-[80%] self-start shadow-lg">
              <p className="text-[16px] sm:text-[18px] text-[#CBD5E1] leading-relaxed break-keep font-medium text-left">
                "변호사 비용은 왜 이렇게 차이가 나지?"
              </p>
            </div>

            {/* Thought 4 (NEW) */}
            <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-white/5 rounded-2xl rounded-tr-sm p-5 sm:p-6 w-[85%] sm:w-[75%] self-end shadow-lg">
              <p className="text-[16px] sm:text-[18px] text-[#CBD5E1] leading-relaxed break-keep font-medium text-left">
                "음주운전 처음이 아니라 너무 불안하네..."
              </p>
            </div>

            {/* Thought 5 (Highlighted) */}
            <div className="bg-[#1E293B]/80 backdrop-blur-sm border border-[#C5A880]/20 rounded-2xl rounded-tl-sm p-5 sm:p-6 w-[95%] sm:w-[85%] self-start shadow-lg shadow-[#C5A880]/5">
              <p className="text-[16px] sm:text-[18px] text-[#E2C792] leading-relaxed break-keep font-bold text-left">
                "무조건 많이 해주고 비싼 곳이 좋겠지?"
              </p>
            </div>
          </div>

          {/* Reinforcement & Wrong Choices */}
          <div className="w-full flex flex-col items-center mb-8">
            <div className="text-center mb-10">
              <h3 className="text-[26px] sm:text-[32px] lg:text-[36px] text-white font-bold leading-relaxed break-keep">
                많은 분들이 고민 끝에<br />
                <span className="text-[#F87171]">잘못된 선택</span>을 합니다.
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl mx-auto">
              {/* Wrong Choice 1 */}
              <div className="flex-1 relative rounded-xl p-5 sm:p-6 flex items-center text-left shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-b from-[#7F1D1D]/10 to-transparent border border-[#7F1D1D]/30 rounded-xl pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-full bg-[#7F1D1D]/20 flex items-center justify-center border border-[#7F1D1D]/40 shrink-0">
                    <AlertCircle className="w-6 h-6 text-[#FCA5A5]" />
                  </div>
                  <p className="text-[#E2E8F0] font-medium text-[14px] sm:text-[16px] break-keep leading-snug">
                    처벌에 대한 불안감에<br />
                    <strong className="text-[#FCA5A5] font-black text-[26px] sm:text-[28px] block mt-1">불필요한 지출</strong>
                  </p>
                </div>
              </div>
              
              {/* Wrong Choice 2 */}
              <div className="flex-1 relative rounded-xl p-5 sm:p-6 flex items-center text-left shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-b from-[#7F1D1D]/10 to-transparent border border-[#7F1D1D]/30 rounded-xl pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-full bg-[#7F1D1D]/20 flex items-center justify-center border border-[#7F1D1D]/40 shrink-0">
                    <Clock className="w-6 h-6 text-[#FCA5A5]" />
                  </div>
                  <p className="text-[#E2E8F0] font-medium text-[14px] sm:text-[16px] break-keep leading-snug">
                    비용에 대한 부담감에<br />
                    <strong className="text-[#FCA5A5] font-black text-[26px] sm:text-[28px] block mt-1">늦어지는 대응</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transition */}
          <div className="text-center flex flex-col items-center mt-16 sm:mt-20">
            <h4 className="text-[20px] sm:text-[24px] text-[#94A3B8] font-bold mb-6 tracking-wide break-keep">
              원인은 명확한 기준의 부재.<br className="sm:hidden" /> 해결책은?
            </h4>
            <ArrowDown className="w-8 h-8 text-[#CBD5E1] animate-bounce" />
          </div>

        </div>
      </section>

      {/* Section 3: The Standard (Solution) */}
      <section className="relative py-24 lg:py-32 bg-[#0A0F1C] px-5 sm:px-6 lg:px-12 overflow-hidden">
        {/* Subtle 330 Watermark */}
        <div className="absolute -bottom-8 -right-8 sm:-bottom-12 sm:-right-12 text-[160px] sm:text-[280px] font-black text-[#94A3B8] opacity-[0.07] select-none pointer-events-none leading-none tracking-tighter blur-[3px] z-0">
          330
        </div>

        <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
          
          {/* 1. Solution Declaration */}
          <div className="text-center flex flex-col items-center mb-16">
            <h2 className="text-[50px] sm:text-[72px] lg:text-[80px] xl:text-[90px] font-extrabold tracking-tight text-white leading-[1.1] break-keep drop-shadow-md">
              당신에게<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E2C792] to-[#C5A880]">딱 필요한 것만</span><br className="sm:hidden" /> <span className="text-white">담았습니다.</span>
            </h2>
          </div>

          {/* 4. Core Content (4 List Items) */}
          <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-3xl mx-auto mb-4">
            {/* Item 1 */}
            <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-[#C5A880]/30 rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-5 shadow-lg shadow-[#C5A880]/5 relative overflow-hidden group hover:border-[#C5A880]/60 transition-colors">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[80px] font-black text-[#C5A880]/5 leading-none -mr-4 group-hover:text-[#C5A880]/10 transition-colors">1</div>
              <div className="shrink-0 bg-[#111827] p-2.5 sm:p-3 rounded-full border border-[#334155] relative z-10">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#E2C792]" />
              </div>
              <div className="flex flex-col flex-1 relative z-10">
                <h4 className="text-[18px] sm:text-[22px] lg:text-[24px] text-white font-bold break-keep">경찰 조사 동행</h4>
              </div>
              <div className="relative z-10 shrink-0 ml-auto pl-2">
                <span className="text-[#E2C792] font-black text-[18px] sm:text-[22px] whitespace-nowrap">
                  1회
                </span>
              </div>
            </div>
            
            {/* Item 2 */}
            <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-[#C5A880]/30 rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-5 shadow-lg shadow-[#C5A880]/5 relative overflow-hidden group hover:border-[#C5A880]/60 transition-colors">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[80px] font-black text-[#C5A880]/5 leading-none -mr-4 group-hover:text-[#C5A880]/10 transition-colors">2</div>
              <div className="shrink-0 bg-[#111827] p-2.5 sm:p-3 rounded-full border border-[#334155] relative z-10">
                <FileSearch className="w-5 h-5 sm:w-6 sm:h-6 text-[#E2C792]" />
              </div>
              <div className="flex flex-col flex-1 relative z-10">
                <h4 className="text-[18px] sm:text-[22px] lg:text-[24px] text-white font-bold break-keep">양형자료 리스트</h4>
                <p className="text-[#94A3B8] text-[13px] sm:text-[15px] mt-1 break-keep">(실전 기반 선별된 리스트 정립)</p>
              </div>
              <div className="relative z-10 shrink-0 ml-auto pl-2">
                <span className="text-[#E2C792] font-black text-[18px] sm:text-[22px] whitespace-nowrap">
                  제공
                </span>
              </div>
            </div>

            {/* Item 3 */}
            <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-[#C5A880]/30 rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-5 shadow-lg shadow-[#C5A880]/5 relative overflow-hidden group hover:border-[#C5A880]/60 transition-colors">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[80px] font-black text-[#C5A880]/5 leading-none -mr-4 group-hover:text-[#C5A880]/10 transition-colors">3</div>
              <div className="shrink-0 bg-[#111827] p-2.5 sm:p-3 rounded-full border border-[#334155] relative z-10">
                <FileSignature className="w-5 h-5 sm:w-6 sm:h-6 text-[#E2C792]" />
              </div>
              <div className="flex flex-col flex-1 relative z-10">
                <h4 className="text-[18px] sm:text-[22px] lg:text-[24px] text-white font-bold break-keep">변호인의견서 제출</h4>
                <p className="text-[#94A3B8] text-[13px] sm:text-[15px] mt-1 break-keep">(공판단계 법원 제출용)</p>
              </div>
              <div className="relative z-10 shrink-0 ml-auto pl-2">
                <span className="text-[#E2C792] font-black text-[18px] sm:text-[22px] whitespace-nowrap">
                  1회
                </span>
              </div>
            </div>

            {/* Item 4 */}
            <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-[#C5A880]/30 rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-5 shadow-lg shadow-[#C5A880]/5 relative overflow-hidden group hover:border-[#C5A880]/60 transition-colors">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[80px] font-black text-[#C5A880]/5 leading-none -mr-4 group-hover:text-[#C5A880]/10 transition-colors">4</div>
              <div className="shrink-0 bg-[#111827] p-2.5 sm:p-3 rounded-full border border-[#334155] relative z-10">
                <Gavel className="w-5 h-5 sm:w-6 sm:h-6 text-[#E2C792]" />
              </div>
              <div className="flex flex-col flex-1 relative z-10">
                <h4 className="text-[18px] sm:text-[22px] lg:text-[24px] text-white font-bold break-keep">공판기일 출석</h4>
              </div>
              <div className="relative z-10 shrink-0 ml-auto pl-2">
                <span className="text-[#E2C792] font-black text-[18px] sm:text-[22px] whitespace-nowrap">
                  최대 2회
                </span>
              </div>
            </div>
          </div>

          {/* 5. Conclusion: Reasonable Cost */}
          <div className="flex flex-col items-center w-full mt-2">
            {/* Animated Connection */}
            <div className="flex flex-col items-center justify-center mb-6 relative z-20">
              <ArrowDown className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 animate-bounce drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
            </div>

            {/* Result Box */}
            <div className="relative group cursor-default w-full max-w-3xl mx-auto">
              {/* Outer Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-400/20 blur-xl rounded-2xl group-hover:blur-2xl transition-all duration-500"></div>
              
              {/* Animated Border Wrapper */}
              <div className="relative rounded-2xl p-[2px] bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500 animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                {/* Inner Content */}
                <div className="relative bg-[#0A0F1C]/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-center sm:text-left h-full w-full">
                  <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent flex items-center justify-center border border-emerald-500/40 shadow-inner">
                    <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[28px] sm:text-[36px] lg:text-[42px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mb-2 break-keep drop-shadow-lg">
                      합리적 비용
                    </h3>
                    <p className="text-[15px] sm:text-[18px] text-[#CBD5E1] font-medium break-keep leading-relaxed">
                      수행 범위 최적화와 시스템 구축을 통해<br className="hidden sm:block" /> 합리적 비용이 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Section 4: Proof & Trust (Removing Doubts) */}
      <section className="relative py-24 lg:py-32 bg-[#0F172A] px-5 sm:px-6 lg:px-12 overflow-hidden">
        {/* Subtle 330 Watermark */}
        <div className="absolute -bottom-8 -right-8 sm:-bottom-12 sm:-right-12 text-[160px] sm:text-[280px] font-black text-[#94A3B8] opacity-[0.07] select-none pointer-events-none leading-none tracking-tighter blur-[3px] z-0">
          330
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-[#C5A880]/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto flex flex-col items-center relative z-10">
          
          {/* 1. Start Question (Targeting Doubts) */}
          <div className="text-center mb-20">
            <h2 className="text-[52px] sm:text-[68px] lg:text-[84px] font-black text-white leading-[1.1] break-keep">
              결과나 대응이 <span className="text-[#E2C792]">부족할까</span><br />
              걱정되시나요?
            </h2>
          </div>

          {/* 2. Evidence (Show, Don't Tell) */}
          <div className="w-full flex flex-col gap-20 sm:gap-24 mb-24">
            
            <div className="w-full flex flex-col lg:flex-row gap-20 lg:gap-12 justify-center items-start max-w-7xl mx-auto">
              {/* 1. Success Cases */}
              <div className="w-full lg:w-1/2 flex flex-col items-center">
              <div className="flex flex-col items-center mb-8 sm:mb-10 text-center">
                <h3 className="text-[28px] sm:text-[32px] font-bold text-white">압도적인 성공 사례</h3>
              </div>
              <div className="w-full max-w-xl relative">
                <div 
                  className="relative w-full h-[380px] sm:h-[420px] lg:h-[768px] overflow-hidden rounded-2xl"
                  onTouchStart={handleCaseTouchStart}
                  onTouchEnd={handleCaseTouchEnd}
                >
                  {cases.map((c, idx) => {
                    const isActive = idx === caseIndex;
                    const isPrev = idx === (caseIndex - 1 + cases.length) % cases.length;
                    const isNext = idx === (caseIndex + 1) % cases.length;
                    
                    let transformStyle = 'translateX(100%) opacity-0';
                    let zIndex = 0;
                    
                    if (isActive) {
                      transformStyle = 'translateX(0) opacity-100';
                      zIndex = 20;
                    } else if (isPrev) {
                      transformStyle = 'translateX(-100%) opacity-0';
                      zIndex = 10;
                    } else if (isNext) {
                      transformStyle = 'translateX(100%) opacity-0';
                      zIndex = 10;
                    }

                    return (
                      <div 
                        key={idx} 
                        className="absolute inset-0 w-full h-full transition-all duration-500 ease-in-out"
                        style={{ transform: transformStyle, zIndex }}
                      >
                        <div className="w-full h-full bg-[#111827] border border-[#334155] rounded-2xl overflow-hidden relative flex flex-col justify-center p-8 sm:p-12 shadow-lg group">
                          {/* Background Document Image */}
                          <div className="absolute inset-0 z-0">
                            <img src={c.docImg} alt="판결문" className="w-full h-full object-contain opacity-30 group-hover:opacity-50 transition-all duration-500 group-hover:scale-105 mix-blend-luminosity" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/80 to-transparent"></div>
                          </div>
                          
                          <div className="relative z-10 max-w-xl">
                            <div className="inline-flex items-center gap-2 bg-[#1E293B] border border-[#475569] px-3 py-1.5 rounded-full mb-6 shadow-md">
                              <Gavel className="w-4 h-4 text-[#94A3B8]" />
                              <span className="text-[14px] sm:text-[16px] text-[#CBD5E1] font-bold">{c.type}</span>
                            </div>
                            <h3 className="text-[36px] sm:text-[48px] lg:text-[56px] font-black text-emerald-400 tracking-tight mb-4 drop-shadow-xl leading-none">
                              {c.result}
                            </h3>
                            <p className="text-[16px] sm:text-[20px] text-white font-medium break-keep drop-shadow-md">
                              {c.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination indicator */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button 
                    onClick={() => setCaseIndex((prev) => (prev - 1 + cases.length) % cases.length)}
                    className="w-10 h-10 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#334155] transition-colors active:scale-95"
                    aria-label="이전 사례"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="bg-[#1E293B] border border-[#334155] px-4 py-2 rounded-full text-[#94A3B8] font-medium text-sm flex items-center gap-2">
                    <span className="text-white font-bold">{caseIndex + 1}</span>
                    <span className="text-[#475569]">/</span>
                    <span>{cases.length}</span>
                  </div>

                  <button 
                    onClick={() => setCaseIndex((prev) => (prev + 1) % cases.length)}
                    className="w-10 h-10 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#334155] transition-colors active:scale-95"
                    aria-label="다음 사례"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Lawyer Profiles */}
            <div className="w-full lg:w-1/2 flex flex-col items-center">
              <div className="flex flex-col items-center mb-8 sm:mb-10 text-center">
                <h3 className="text-[28px] sm:text-[32px] font-bold text-white">음주운전 전담 변호인단</h3>
              </div>
              
              {/* Lawyer Profile Slider (Stacked Cards) */}
              <div 
                className="w-full max-w-xl relative h-[420px] sm:h-[460px] lg:h-[820px] perspective-1000"
                onTouchStart={handleLawyerTouchStart}
                onTouchEnd={handleLawyerTouchEnd}
              >
                {lawyers.map((lawyer, idx) => {
                  const relIndex = (idx - lawyerIndex + lawyers.length) % lawyers.length;
                  
                  let transformStyle = '';
                  let zIndex = 0;
                  let opacity = 1;
                  
                  if (relIndex === 0) {
                    transformStyle = 'translateY(0) scale(1)';
                    zIndex = 30;
                    opacity = 1;
                  } else if (relIndex === 1) {
                    transformStyle = 'translateY(24px) scale(0.95)';
                    zIndex = 20;
                    opacity = 0.7;
                  } else {
                    transformStyle = 'translateY(48px) scale(0.9)';
                    zIndex = 10;
                    opacity = 0.4;
                  }

                  return (
                    <div 
                      key={idx} 
                      className="absolute top-0 left-0 right-0 h-[380px] sm:h-[420px] lg:h-[768px] bg-[#111827] border border-[#334155] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ease-in-out origin-top group hover:border-[#C5A880]/50"
                      style={{ transform: transformStyle, zIndex, opacity }}
                    >
                      {/* Full Background Image */}
                      <img 
                        src={lawyer.img} 
                        alt={lawyer.name} 
                        className="absolute inset-0 w-full h-full object-contain object-top grayscale opacity-90" 
                        referrerPolicy="no-referrer" 
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C] via-[#0A0F1C]/70 to-transparent"></div>

                      {/* Text Content at Bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex flex-col items-center text-center z-10">
                        <div className="text-red-400 text-[11px] sm:text-[12px] font-bold mb-2 border border-red-400/30 px-2.5 py-0.5 rounded-full bg-red-400/10 backdrop-blur-sm">
                          대한변호사협회 형사전문변호사
                        </div>
                        <h3 className="text-[24px] sm:text-[28px] font-bold text-white flex items-center gap-2">
                          {lawyer.name} <span className="text-[16px] sm:text-[18px] text-[#94A3B8] font-medium">{lawyer.role}</span>
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>

            {/* 3. Certificates Marquee (No Box) */}
            <div className="w-full flex flex-col items-center mt-[-2rem] sm:mt-[-3rem]">
              <div className="w-full relative overflow-hidden py-2">
                <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[#0F172A] to-transparent z-10 pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[#0F172A] to-transparent z-10 pointer-events-none"></div>
                
                <div className="flex items-center w-full overflow-hidden relative">
                  <div className="flex animate-marquee whitespace-nowrap items-center">
                    {[...certificates, ...certificates, ...certificates].map((cert, idx) => (
                      <div key={idx} className="w-28 h-40 sm:w-36 sm:h-52 relative overflow-hidden mx-2 sm:mx-3 shrink-0 rounded-md shadow-lg border border-white/5">
                        <img 
                          src={cert.img} 
                          alt="위촉장" 
                          className="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:opacity-100 hover:mix-blend-normal transition-all duration-300" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 3. Final Conclusion */}
          <div className="text-center mb-24 w-full">
            <h3 className="text-[36px] sm:text-[48px] lg:text-[56px] font-black text-white mb-8 tracking-tight break-keep leading-[1.3]">
              이미 결과로 <span className="text-emerald-400">충분히</span> 입증되었습니다.<br />
              단언컨대 <span className="text-red-400">절대</span> 부족하지 않습니다.
            </h3>
          </div>

          {/* 4. Transition to CTA */}
          <div className="text-center flex flex-col items-center">
            <h4 className="text-[20px] sm:text-[24px] text-[#94A3B8] font-bold mb-8 tracking-wide">
              이제, 선택만 남았습니다.
            </h4>
            <ArrowDown className="w-8 h-8 text-[#CBD5E1] animate-bounce" />
          </div>

        </div>
      </section>

      {/* Section 5: CTA / Contact Form (Action) */}
      <section id="consultation-form" className="relative py-24 lg:py-32 bg-[#0A0F1C] px-5 sm:px-6 lg:px-12 overflow-hidden">
        {/* Subtle 330 Watermark */}
        <div className="absolute -bottom-8 -right-8 sm:-bottom-12 sm:-right-12 text-[160px] sm:text-[280px] font-black text-[#94A3B8] opacity-[0.07] select-none pointer-events-none leading-none tracking-tighter blur-[3px] z-0">
          330
        </div>

        <div className="max-w-3xl mx-auto flex flex-col items-center relative z-10">
          
          {/* 1. Header */}
          <div className="text-center mb-12">
            <h2 className="text-[40px] sm:text-[52px] lg:text-[64px] font-black text-white leading-[1.2] break-keep mb-6">
              지금 상황,<br />
              <span className="text-[#E2C792]">빠르게 확인해보세요</span>
            </h2>
            <p className="text-[16px] sm:text-[18px] text-[#94A3B8] font-medium leading-relaxed break-keep">
              복잡하게 고민하지 않으셔도 됩니다<br />
              현재 상황만 알려주시면<br />
              필요한 대응을 정리해드립니다
            </p>
          </div>

          {/* 2. Trust Indicators */}
          <div className="w-full bg-[#111827] border border-[#334155] rounded-xl p-6 sm:p-8 mb-10 shadow-lg">
            <ul className="flex flex-col gap-4 text-[15px] sm:text-[16px] text-[#CBD5E1] font-medium">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                상담 내용은 외부에 공유되지 않습니다
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                현재 단계에 맞는 대응만 안내드립니다
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                불필요한 상담 유도는 하지 않습니다
              </li>
            </ul>
          </div>

          {/* 3. Contact Form */}
          <div className="w-full bg-[#1E293B]/50 border border-white/5 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm mb-16">
            <form className="flex flex-col gap-6" onSubmit={handleConsultationSubmit}>
              
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-white font-bold text-[15px] sm:text-[16px] ml-1">이름 <span className="text-red-400 text-[13px] font-normal ml-1">(필수)</span></label>
                <input 
                  type="text" 
                  placeholder="이름을 입력해주세요" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-5 py-4 text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#C5A880] transition-colors text-[16px]"
                />
              </div>

              {/* Contact */}
              <div className="flex flex-col gap-2">
                <label className="text-white font-bold text-[15px] sm:text-[16px] ml-1">연락처 <span className="text-red-400 text-[13px] font-normal ml-1">(필수)</span></label>
                <input 
                  type="tel" 
                  placeholder="연락 가능한 번호" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-5 py-4 text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#C5A880] transition-colors text-[16px]"
                />
              </div>

              {/* Alcohol Level */}
              <div className="flex flex-col gap-2">
                <label className="text-white font-bold text-[15px] sm:text-[16px] ml-1">알코올 농도 <span className="text-[#64748B] text-[13px] font-normal ml-1">(선택)</span></label>
                <select 
                  value={formData.alcoholLevel}
                  onChange={(e) => setFormData({...formData, alcoholLevel: e.target.value})}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#C5A880] transition-colors text-[16px] appearance-none"
                >
                  <option value="0.03~0.08%">0.03~0.08%</option>
                  <option value="0.08~0.2%">0.08~0.2%</option>
                  <option value="0.2% 이상">0.2% 이상</option>
                  <option value="음주 측정거부/측정방해">음주 측정거부/측정방해</option>
                  <option value="미측정(혐의의심)">미측정(혐의의심)</option>
                </select>
              </div>

              {/* DUI History */}
              <div className="flex flex-col gap-2">
                <label className="text-white font-bold text-[15px] sm:text-[16px] ml-1">음주운전 전력 <span className="text-[#64748B] text-[13px] font-normal ml-1">(선택)</span></label>
                <select 
                  value={formData.duiHistory}
                  onChange={(e) => setFormData({...formData, duiHistory: e.target.value})}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#C5A880] transition-colors text-[16px] appearance-none"
                >
                  <option value="0회">0회</option>
                  <option value="1회">1회</option>
                  <option value="2회">2회</option>
                  <option value="3회">3회</option>
                  <option value="4회">4회</option>
                  <option value="5회이상">5회이상</option>
                </select>
              </div>

              {/* Incident Details */}
              <div className="flex flex-col gap-2">
                <label className="text-white font-bold text-[15px] sm:text-[16px] ml-1">사건 경위 <span className="text-[#64748B] text-[13px] font-normal ml-1">(선택)</span></label>
                <textarea 
                  placeholder="간단히 상황을 적어주세요&#13;&#10;(예: 단속 경위, 사고 여부 등)" 
                  rows={4}
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-5 py-4 text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#C5A880] transition-colors resize-none text-[16px]"
                ></textarea>
              </div>

              {/* 4. CTA Button */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#E2C792] to-[#C5A880] text-[#0A0F1C] font-black text-[18px] sm:text-[20px] py-5 rounded-xl mt-4 hover:from-[#D4B881] hover:to-[#B59870] transition-all shadow-lg shadow-[#C5A880]/20 active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? '신청 중...' : '상담 신청하기'}
              </button>

              {/* 5. Bottom Triggers */}
              <div className="text-center mt-4 flex flex-col gap-2">
                <p className="text-[#64748B] font-medium text-[13px] flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
                  상담 내용은 철저히 비밀 보장됩니다
                </p>
              </div>

            </form>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0F1C] border-t border-[#334155] py-12 px-5 sm:px-6 lg:px-12 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <img src="https://beobjin-criminal.com/images/common/logo.png" alt="법률사무소 법진" className="h-8 object-contain opacity-50 mb-2" />
          
          <div className="flex flex-col gap-2 text-[#64748B] text-[13px] sm:text-[14px] items-center">
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-0">
              <span>법률사무소 법진</span>
              <span className="hidden md:inline mx-3 text-[#334155]">|</span>
              <span>대표변호사. 정해원, 윤선영, 곽은정</span>
              <span className="hidden md:inline mx-3 text-[#334155]">|</span>
              <span>사업자등록번호: 587-12-02153</span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-0 mt-1">
              <span>주소 : 경기도 수원시 영통구 광교중앙로 248번길 7-3, 503호(하동, 우연법전프라자)</span>
              <span className="hidden md:inline mx-3 text-[#334155]">|</span>
              <span>TEL: 031-214-5566</span>
              <span className="hidden md:inline mx-3 text-[#334155]">|</span>
              <span>FAX : 031-213-6655</span>
              <span className="hidden md:inline mx-3 text-[#334155]">|</span>
              <span>E-mail : lawofficebj@naver.com</span>
            </div>

            <p className="mt-6">Copyright © 법률사무소 법진. All rights reserved.</p>
            <Link to="/admin" className="text-[#334155] hover:text-[#64748B] text-xs mt-2 transition-colors inline-block">
              관리자 페이지
            </Link>
          </div>
        </div>
      </footer>

      {/* Fixed Bottom CTA (Mobile Only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A0F1C]/90 backdrop-blur-md border-t border-[#C5A880]/20 p-4 pb-6 sm:pb-4 z-50 animate-fade-in-up animation-delay-400">
        <div className="max-w-md mx-auto sm:max-w-3xl flex gap-3">
          <a href="tel:031-214-5566" className="flex-1 flex items-center justify-center gap-2 bg-[#1E293B] text-white border border-[#334155] py-3.5 rounded-xl font-bold text-[16px] hover:bg-[#334155] transition-colors active:scale-[0.98]">
            <Phone className="w-5 h-5 text-[#94A3B8]" />
            전화 상담
          </a>
          <a 
            href="#consultation-form"
            onClick={scrollToForm}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#E2C792] to-[#C5A880] text-[#0A0F1C] py-3.5 rounded-xl font-bold text-[16px] hover:from-[#D4B881] hover:to-[#B59870] transition-colors shadow-lg shadow-[#C5A880]/20 active:scale-[0.98]"
          >
            <FileText className="w-5 h-5" />
            상담 신청하기
          </a>
        </div>
      </div>

      {/* Popup Modal */}
      {activePopup && !localStorage.getItem(`hidePopup_${activePopup.id}`) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-sm w-full bg-[#1E293B] rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-scale-in">
            <button 
              onClick={() => setActivePopup(null)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <a 
              href={activePopup.link || '#'} 
              target={activePopup.link ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className={activePopup.link ? "cursor-pointer" : "cursor-default"}
            >
              <img src={activePopup.img} alt={activePopup.title} className="w-full h-auto" />
            </a>
            <div className="p-4 flex justify-between items-center bg-[#111827]">
              <button 
                onClick={() => {
                  const expires = new Date();
                  expires.setDate(expires.getDate() + 1);
                  localStorage.setItem(`hidePopup_${activePopup.id}`, expires.toISOString());
                  setActivePopup(null);
                }}
                className="text-[#94A3B8] text-sm hover:text-white transition-colors"
              >
                오늘 하루 보지 않기
              </button>
              <button 
                onClick={() => setActivePopup(null)}
                className="text-white font-bold text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed CTA for Desktop */}
      <div className="hidden lg:flex fixed bottom-8 right-8 z-50 flex-col gap-3 items-end">
        <div className="bg-[#1E293B]/90 border border-[#334155] rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col items-center gap-2">
          <span className="text-[#94A3B8] text-[13px] font-bold tracking-wide">24시간 긴급 법률상담</span>
          <a href="tel:031-214-5566" className="text-[#E2C792] text-2xl font-black tracking-wider flex items-center gap-2 hover:text-white transition-colors">
            <Phone className="w-5 h-5" />
            031-214-5566
          </a>
        </div>
        <a 
          href="#consultation-form"
          onClick={scrollToForm}
          className="bg-gradient-to-r from-[#E2C792] to-[#C5A880] text-[#0A0F1C] px-6 py-4 rounded-2xl font-black text-[16px] hover:from-[#D4B881] hover:to-[#B59870] transition-all shadow-lg shadow-[#C5A880]/20 flex items-center justify-center gap-2 w-full active:scale-95"
        >
          <FileText className="w-5 h-5" />
          상담 신청하기
        </a>
      </div>

    </div>
  );
}
