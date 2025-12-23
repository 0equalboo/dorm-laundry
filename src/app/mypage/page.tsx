"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
// [수정 1] 하단 메뉴바에 필요한 아이콘들(Home, Calendar, User) 추가 Import
import { Bell, Menu, Home, Calendar, User } from "lucide-react";

// DB 스키마에 맞춘 라이프스타일 타입
interface UserLifestyle {
  smoke: boolean;
  game_voice: boolean;
  sleep_time_val: number;
  wake_time_val: number;
  clean_cycle_val: number;
  hvac_val: number;
  sound_sensitivity_val: number;
  outing_val: number;
}

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [lifestyle, setLifestyle] = useState<UserLifestyle | null>(null);
  const [loading, setLoading] = useState(true);

  // [수정 2] 하단 탭 상태 관리 추가 (초기값: "mypage")
  const [activeTab, setActiveTab] = useState("mypage");

  useEffect(() => {
    async function fetchMyData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // 프로필 및 라이프스타일 데이터 가져오기
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, user_lifestyles(*)")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        // user_lifestyles가 배열로 올 수도 있으므로 처리
        const lifestyleData = Array.isArray(profileData.user_lifestyles) 
          ? profileData.user_lifestyles[0] 
          : profileData.user_lifestyles;
        setLifestyle(lifestyleData);
      }
      setLoading(false);
    }
    fetchMyData();
  }, [router]);

  // 아이콘 결정 로직
  const getSleepIcon = () => (lifestyle?.sleep_time_val ?? 0.5) > 0.6 ? "/images/late_night.png" : "/images/sun.png";
  const getNoiseIcon = () => (lifestyle?.sound_sensitivity_val ?? 0.5) > 0.6 ? "/images/small_sound.png" : "/images/big_sound.png";
  const getCleanIcon = () => (lifestyle?.clean_cycle_val ?? 0.5) < 0.4 ? "/images/blood_minus.png" : "/images/clean_icon.png";
  const getSmokeIcon = () => lifestyle?.smoke ? "/images/tabaco_icon.png" : "/images/no_tabaco_icon.png";

  const getSleepLabel = () => (lifestyle?.sleep_time_val ?? 0.5) > 0.6 ? "야행성" : "아침형";
  const getNoiseLabel = () => (lifestyle?.sound_sensitivity_val ?? 0.5) > 0.6 ? "소음 둔감" : "소음 예민";
  const getCleanLabel = () => (lifestyle?.clean_cycle_val ?? 0.5) < 0.4 ? "청소 적게" : "청소 자주";
  const getSmokeLabel = () => lifestyle?.smoke ? "흡연자" : "비흡연자";

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-white text-[#051E96] font-bold animate-pulse">
      로딩 중... 👻
    </div>
  );

  return (
    <div className="h-full w-full bg-[#B9BEFF] flex flex-col font-sans overflow-hidden relative">
      
      {/* 1. 상단 프로필 헤더 */}
      <div className="px-6 pt-12 pb-10 flex flex-col items-center relative shrink-0">
        <div className="absolute top-12 right-6 flex gap-3">
          <Bell className="w-6 h-6 text-white" />
          <Menu className="w-6 h-6 text-white" />
        </div>

        {/* 유령 프로필 */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
          <Image src="/images/ghost_icon.png" alt="Ghost" width={60} height={60} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">{profile?.nickname || "학우"}</h2>
        <p className="text-white/80 text-sm mb-8">{profile?.gender === "male" ? "남학생" : "여학생"} · 기숙사 거주 중</p>

        {/* 요약 픽토그램 섹션 */}
        <div className="flex justify-around w-full max-w-sm">
          <SummaryIcon src={getSleepIcon()} label={getSleepLabel()} />
          <SummaryIcon src={getNoiseIcon()} label={getNoiseLabel()} />
          <SummaryIcon src={getCleanIcon()} label={getCleanLabel()} />
          <SummaryIcon src={getSmokeIcon()} label={getSmokeLabel()} />
        </div>
      </div>

      {/* 2. 상세 설문 데이터 시각화 */}
      <div className="flex-1 bg-white rounded-t-[40px] px-8 py-10 space-y-10 overflow-y-auto pb-32">
        
        {/* 수면 섹션 */}
        <Section title="수면">
          <SliderRow 
            label="기상 시간" 
            left="이르다" 
            right="늦다" 
            value={lifestyle?.wake_time_val ?? 0.5} 
          />
          <SliderRow 
            label="취침 시간" 
            left="이르다" 
            right="늦다" 
            value={lifestyle?.sleep_time_val ?? 0.5} 
          />
        </Section>

        {/* 청소 섹션 */}
        <Section title="청소">
          <SliderRow 
            label="청소 주기" 
            left="잘 안 해요" 
            right="자주 해요" 
            value={lifestyle?.clean_cycle_val ?? 0.5} 
          />
        </Section>

        {/* 냉난방 선호도 섹션 */}
        <Section title="냉난방 선호도">
          <SliderRow 
            label="온도 선호" 
            left="시원하게" 
            right="따뜻하게" 
            value={lifestyle?.hvac_val ?? 0.5} 
          />
        </Section>

        {/* 소음 섹션 */}
        <Section title="소음">
          <SliderRow 
            label="소음 민감도" 
            left="예민해요" 
            right="둔감해요" 
            value={lifestyle?.sound_sensitivity_val ?? 0.5} 
          />
        </Section>

        {/* 외출/음주 섹션 */}
        <Section title="외출 & 음주">
          <SliderRow 
            label="외출 빈도" 
            left="적어요" 
            right="많아요" 
            value={lifestyle?.outing_val ?? 0.5} 
          />
        </Section>

      </div>

      {/* 🌟 하단 메뉴바 */}
      <div className="absolute bottom-8 left-0 right-0 px-8 z-20">
        <div className="w-full h-[64px] bg-white rounded-full border border-[#051E96] flex items-center justify-between p-1.5 shadow-[0_4px_20px_rgba(5,30,150,0.15)]">
            
            {/* 1. 홈 버튼 (클릭 시 메인 페이지로 이동) */}
            <button 
                onClick={() => { setActiveTab("home"); router.push("/main"); }} 
                className={`flex-1 h-full flex items-center justify-center rounded-[24px] transition-all duration-300 ${
                    activeTab === "home" 
                    ? "bg-[#051E96] text-white shadow-md" 
                    : "bg-transparent text-[#051E96] hover:bg-blue-50"
                }`}
            >
                <Home strokeWidth={2.5} className="w-6 h-6" />
            </button>

            {/* 2. 스케줄 버튼 */}
            <button 
                onClick={() => { setActiveTab("schedule"); router.push("/schedule"); }} 
                className={`flex-1 h-full flex items-center justify-center rounded-[24px] transition-all duration-300 ${
                    activeTab === "schedule" 
                    ? "bg-[#051E96] text-white shadow-md" 
                    : "bg-transparent text-[#051E96] hover:bg-blue-50"
                }`}
            >
                <Calendar strokeWidth={2.5} className="w-6 h-6" />
            </button>

            {/* 3. 마이페이지 버튼 */}
            <button 
                onClick={() => setActiveTab("mypage")} 
                className={`flex-1 h-full flex items-center justify-center rounded-[24px] transition-all duration-300 ${
                    activeTab === "mypage" 
                    ? "bg-[#051E96] text-white shadow-md" 
                    : "bg-transparent text-[#051E96] hover:bg-blue-50"
                }`}
            >
                <User strokeWidth={2.5} className="w-6 h-6" />
            </button>

        </div>
      </div>

    </div>
  );
}

// --- 내부 컴포넌트 ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-[#051E96] font-bold text-lg">{title}</h3>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function SliderRow({ label, left, right, value }: { label: string; left: string; right: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-slate-800">{label}</span>
        <span className="text-xs text-[#051E96] font-bold">{Math.round(value * 100)}%</span>
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      {/* 커스텀 게이지 바 */}
      <div className="h-4 w-full bg-slate-100 rounded-full relative overflow-hidden">
        <div 
          className="h-full bg-[#051E96] transition-all duration-500 rounded-full" 
          style={{ width: `${value * 100}%` }} 
        />
      </div>
    </div>
  );
}

function SummaryIcon({ src, label }: { src: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-14 h-14 bg-white/20 rounded-full border border-white/40 flex items-center justify-center backdrop-blur-sm">
        <Image src={src} alt={label} width={32} height={32} />
      </div>
      <span className="text-[10px] text-white font-bold">{label}</span>
    </div>
  );
}