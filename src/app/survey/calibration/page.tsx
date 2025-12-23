"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import { CALIBRATION_ROUNDS, type PersonaCard } from "@/app/constants/calibration";
import { IMPORTANCE_WEIGHTS } from "@/app/constants/weights";

export default function CalibrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false); 

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("로그인이 필요합니다.");
        router.push("/login");
        return;
      }
      setUserId(user.id);
    };
    checkUser();
  }, [router]);

  const handleCardSelect = async (selectedCard: PersonaCard) => {
    if (!userId) return;
    setLoading(true);

    try {
      const { data: current } = await supabase
        .from("user_personas")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const currentWeights = current || {
        pref_schedule: 0, pref_smoke: 0, pref_habit: 0, pref_temp: 0,
        pref_cleanliness: 0, pref_noise: 0, pref_drink: 0, calibration_step: 0
      };

      const updates = {
        user_id: userId,
        pref_schedule:    currentWeights.pref_schedule    + (selectedCard.attributes.sleep * IMPORTANCE_WEIGHTS.sleep),
        pref_smoke:       currentWeights.pref_smoke       + (selectedCard.attributes.smoke * IMPORTANCE_WEIGHTS.smoke),
        pref_habit:       currentWeights.pref_habit       + (selectedCard.attributes.habit * IMPORTANCE_WEIGHTS.habit),
        pref_temp:        currentWeights.pref_temp        + (selectedCard.attributes.temp  * IMPORTANCE_WEIGHTS.temp),
        pref_cleanliness: currentWeights.pref_cleanliness + (selectedCard.attributes.clean * IMPORTANCE_WEIGHTS.clean),
        pref_noise:       currentWeights.pref_noise       + (selectedCard.attributes.noise * IMPORTANCE_WEIGHTS.noise),
        pref_drink:       currentWeights.pref_drink       + (selectedCard.attributes.drink * IMPORTANCE_WEIGHTS.drink),
        calibration_step: currentRound + 1,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("user_personas").upsert(updates);
      if (error) throw error;

      if (currentRound < 2) {
        setCurrentRound((prev) => prev + 1);
        // 스크롤 맨 위로 (리스트 영역만)
        const listContainer = document.getElementById("card-list-container");
        if (listContainer) listContainer.scrollTop = 0;
      } else {
        setIsAnalyzing(true);
        setTimeout(() => {
            toast.success("나만의 룸메이트 분석 완료! 👻");
            router.push("/main");
        }, 3000);
      }

    } catch (error) {
      console.error(error);
      toast.error("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="h-screen w-full bg-gradient-to-b from-[#2E409A] to-[#B9BEFF] flex flex-col justify-center items-center relative overflow-hidden">
        <div className="relative w-40 h-40 mb-8 animate-float">
          <Image src="/images/ghost_icon.png" alt="분석중인 유령" fill style={{ objectFit: "contain" }} priority />
        </div>
        <div className="w-24 h-3 bg-[#051E96] rounded-[100%] opacity-30 blur-sm mb-20 animate-pulse" />
        <h2 className="text-white text-lg font-medium text-center animate-pulse leading-relaxed">
          선택하신 데이터를 기반으로<br/>
          <span className="font-bold text-yellow-300">운명의 룸메이트</span>를 찾는 중...
        </h2>
      </div>
    );
  }

  const currentCards = CALIBRATION_ROUNDS[currentRound];
  if (!userId) return null;

  return (
    // [레이아웃] 헤더는 고정, 아래 리스트만 스크롤되도록 flex-col & overflow-hidden 설정
    <main className="h-screen w-full bg-[#B9BEFF] flex flex-col items-center pt-12 pb-4 px-5 overflow-hidden">
      
      {/* 1. 상단 고정 영역 (스크롤 안됨) */}
      <div className="w-full max-w-md shrink-0 text-center mb-4 z-10">
         {/* 점 (Dots) 인디케이터 */}
         <div className="flex justify-center gap-2 mb-3">
            {[0, 1, 2].map((step) => (
                <div 
                  key={step} 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    step === currentRound 
                      ? "bg-[#051E96] scale-125" 
                      : "bg-white/50"
                  }`} 
                />
            ))}
         </div>

         {/* 멘트 변경 */}
         <p className="text-[#051E96]/70 text-xs font-bold mb-1 tracking-tight">
            조금 더 자세히 물어볼게요.
         </p>
         <h1 className="text-xl font-black text-[#051E96] leading-tight">
            어떤 룸메이트와<br/>함께하고 싶나요?
         </h1>
      </div>

      {/* 2. 카드 리스트 영역 (여기만 스크롤 됨) */}
      <div 
        id="card-list-container"
        className="w-full max-w-md flex-1 overflow-y-auto scrollbar-hide pb-6 flex flex-col gap-3"
      >
        {currentCards.map((card, index) => {
          const cleanText = card.tags.clean.includes("깔끔") ? "깔끔한" : "자유로운";
          const sleepText = card.tags.sleep;

          return (
            <button
              key={card.id}
              onClick={() => handleCardSelect(card)}
              disabled={loading}
              // [수정] 박스 크기 축소: p-4, rounded-2xl
              className="group relative w-full bg-white rounded-2xl p-4 shadow-sm border-[3px] border-transparent hover:border-[#051E96] active:scale-[0.98] transition-all duration-200 text-left overflow-hidden shrink-0"
            >
              {/* 상단 라벨 */}
              <div className="flex justify-between items-start mb-2">
                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md">
                  TYPE {['A', 'B', 'C'][index]}
                </span>
                <div className="w-4 h-4 rounded-full bg-[#051E96] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Check className="w-2.5 h-2.5" />
                </div>
              </div>

              {/* 메인 타이틀 (글씨 크기 축소) */}
              <h3 className="text-base font-black text-slate-800 leading-snug mb-3">
                <span className="text-[#051E96]">{cleanText}</span> & {sleepText} 스타일
              </h3>

              {/* 태그 영역 (간격 좁게) */}
              <div className="grid grid-cols-3 gap-1.5">
                 <TagBadge label="수면" value={card.tags.sleep} active={card.attributes.sleep === 1} />
                 <TagBadge label="잠버릇" value={card.tags.habit} active={card.attributes.habit === 1} />
                 <TagBadge label="냉난방" value={card.tags.temp} active={card.attributes.temp === 1} />
                 <TagBadge label="청소" value={cleanText} active={card.attributes.clean === 1} />
                 <TagBadge label="음주" value={card.tags.drink} active={card.attributes.drink === 1} />
                 <TagBadge label="소음" value={card.tags.noise} active={card.attributes.noise === 1} />
              </div>

              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <Loader2 className="w-6 h-6 text-[#051E96] animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}

// 태그 뱃지 컴포넌트 (컴팩트 버전)
function TagBadge({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    // [수정] 높이와 패딩을 최소화하여 한 화면에 많이 보이게 함
    <div className={`flex flex-col items-center justify-center py-1.5 rounded-lg border transition-colors ${
      active 
        ? "bg-[#E5E8FF] border-[#051E96]/20" 
        : "bg-slate-50 border-slate-100"
    }`}>
      <span className={`text-[9px] font-bold mb-0 ${active ? "text-[#051E96]/60" : "text-slate-400"}`}>
        {label}
      </span>
      <span className={`text-[10px] font-bold leading-none ${active ? "text-[#051E96]" : "text-slate-600"}`}>
        {value}
      </span>
    </div>
  );
}