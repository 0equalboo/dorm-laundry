"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Clock, Moon, Sparkles, Cigarette } from "lucide-react";

// --- 더미 데이터 ---
const calibrationProfiles = [
  { id: "c1", name: "User A", sleep: "23:00", wake: "07:00", clean: "매일", smoke: false, intro: "규칙적인 생활을 선호합니다." },
  { id: "c2", name: "User B", sleep: "02:00", wake: "10:00", clean: "주 1회", smoke: false, intro: "밤에 집중이 잘 되는 편이에요." },
  { id: "c3", name: "User C", sleep: "00:00", wake: "08:00", clean: "보통", smoke: true, intro: "흡연자지만 실내 냄새 신경 씁니다." },
  { id: "c4", name: "User D", sleep: "22:00", wake: "06:00", clean: "매일", smoke: false, intro: "아침 운동을 나갑니다." },
  { id: "c5", name: "User E", sleep: "01:00", wake: "09:00", clean: "적당히", smoke: false, intro: "조용한 분위기를 좋아해요." },
];

export default function CalibrationPage() {
  const router = useRouter();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- 선택 토글 ---
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      if (selectedIds.length >= 1) {
        setSelectedIds([id]); 
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  // --- 분석 시작 ---
  const handleAnalyze = async () => {
    if (selectedIds.length === 0) {
      toast.error("가장 마음에 드는 1명을 선택해주세요!");
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 로딩 3초
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast.success("취향 분석 완료!");
      router.push("/main");

    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
    }
  };

  // ✅ [화면 2] 분석 중 (로딩 화면)
  if (isAnalyzing) {
    return (
      <div className="h-full w-full bg-gradient-to-b from-[#2E409A] to-[#B9BEFF] flex flex-col justify-center items-center relative overflow-hidden">
        <div className="relative w-40 h-40 mb-8 animate-float">
          <Image
            src="/images/ghost_icon.png"
            alt="분석중인 유령"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
        <div className="w-24 h-3 bg-[#051E96] rounded-[100%] opacity-30 blur-sm mb-20 animate-pulse" />
        <h2 className="text-white text-lg font-medium text-center animate-pulse">
          선택하신 데이터를 기반으로<br/>
          최적의 룸메이트를 매칭 중입니다...
        </h2>
      </div>
    );
  }

  // ✅ [화면 1] 더미 프로필 선택
  return (
    <div className="h-full w-full bg-[#B9BEFF] px-6 pt-12 pb-6 flex flex-col overflow-hidden">
      
      {/* 상단 타이틀 */}
      <div className="shrink-0 mb-6 text-center space-y-2">
        <h2 className="text-2xl font-black text-[#051E96] uppercase">Preference</h2>
        <p className="text-[#051E96]/80 text-sm font-medium">
          어떤 스타일의 룸메이트가 편하신가요?<br/>
          가장 마음에 드는 <strong>한 명</strong>을 선택해주세요.
        </p>
      </div>

      {/* 카드 리스트 (스크롤 가능 영역) */}
      {/* [수정 포인트] 스크롤바 숨기기 코드 추가 */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {calibrationProfiles.map((profile) => {
          const isSelected = selectedIds.includes(profile.id);
          return (
            <Card 
              key={profile.id}
              className={`cursor-pointer border-0 transition-all duration-200 ${
                isSelected 
                  ? "ring-4 ring-[#051E96] bg-white transform scale-[1.02]" 
                  : "bg-white/90 hover:bg-white"
              }`}
              onClick={() => toggleSelection(profile.id)}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#051E96]">{profile.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{profile.intro}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="text-[#051E96] w-6 h-6 fill-blue-100" />}
                </div>

                {/* 데이터 그리드 */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Moon className="w-4 h-4 text-[#7A82AB]" />
                    <span className="font-semibold">{profile.sleep}</span> 취침
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4 text-[#7A82AB]" />
                    <span className="font-semibold">{profile.wake}</span> 기상
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Sparkles className="w-4 h-4 text-[#7A82AB]" />
                    <span className="font-semibold">{profile.clean}</span> 청소
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Cigarette className="w-4 h-4 text-[#7A82AB]" />
                    <span className={profile.smoke ? "text-red-500 font-bold" : "text-blue-600 font-bold"}>
                      {profile.smoke ? "흡연" : "비흡연"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 하단 버튼 */}
      <div className="shrink-0 pt-4">
        <Button 
          className={`w-full h-14 text-lg font-bold rounded-full shadow-lg transition-all ${
            selectedIds.length > 0
              ? "bg-[#051E96] text-white hover:bg-[#041675]"
              : "bg-white/50 text-[#051E96]/50 cursor-not-allowed"
          }`}
          onClick={handleAnalyze}
          disabled={selectedIds.length === 0}
        >
          매칭 시작하기 ✨
        </Button>
      </div>
    </div>
  );
}