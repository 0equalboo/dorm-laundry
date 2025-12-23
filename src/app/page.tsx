"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, X, ChevronRight } from "lucide-react";

// --- [컴포넌트] 바텀 시트 (아래에서 올라오는 팝업) ---
function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode; 
}) {
  const [visible, setVisible] = useState(false);

  // 애니메이션 효과를 위해 상태 동기화
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = "hidden"; // 스크롤 막기
    } else {
      const timer = setTimeout(() => setVisible(false), 300); // 닫는 애니메이션 시간 확보
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      {/* 배경 (어둡게) */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* 시트 본문 */}
      <div className={`relative w-full max-w-md bg-white rounded-t-[2rem] p-8 pb-10 shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? "translate-y-0" : "translate-y-full"}`}>
        {/* 상단 핸들바 (디자인 요소) */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-[#051E96]">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-400" />
          </Button>
        </div>
        
        {children}
      </div>
    </div>
  );
}

export default function AuthLandingPage() {
  const router = useRouter();
  const [activeSheet, setActiveSheet] = useState<"none" | "login" | "signup">("none");
  const [loading, setLoading] = useState(false);

  // 입력 폼 상태
  const [email, setEmail] = useState(""); // 학번만 입력받아 처리
  const [password, setPassword] = useState("");
  
  // 로그인/회원가입 시 학번 -> 이메일 변환
  const formatEmail = (id: string) => `${id}@sejong.ac.kr`;

  // --- 로그인 처리 ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formatEmail(email),
        password,
      });

      if (error) throw error;

      toast.success("로그인 성공! 유령이 분석 중입니다...");
      setActiveSheet("none"); // 시트 닫기
      router.push("/analyzing"); // 분석 화면으로 이동

    } catch (error: any) {
      toast.error("학번 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // --- 회원가입 처리 ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formatEmail(email),
        password,
      });

      if (error) throw error;

      toast.success("가입 성공! 설문조사를 시작합니다.");
      setActiveSheet("none");
      router.push("/survey"); // 설문조사 화면으로 이동 (아까 만든 SurveyPage)

    } catch (error: any) {
      console.error(error);
      toast.error("이미 가입된 학번이거나 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2E409A] to-[#B9BEFF] relative overflow-hidden flex flex-col items-center justify-between py-12 px-6">
      
      {/* 1. 배경 애니메이션 요소 */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-40 right-10 w-40 h-40 bg-[#051E96]/20 rounded-full blur-2xl" />

      {/* 2. 메인 로고 영역 (중앙) */}
      <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 z-10">
        <div className="relative w-48 h-48 animate-float">
          {/* 유령 이미지 (public/images 폴더에 있어야 함) */}
          <Image
            src="/images/ghost_icon.png" 
            alt="Ghost"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white drop-shadow-md">
            DORM MATE
          </h1>
          <p className="text-blue-100 font-medium text-lg">
            나에게 딱 맞는 룸메이트,<br/>
            기숙사 유령이 찾아줄게요!
          </p>
        </div>
      </div>

      {/* 3. 하단 버튼 영역 */}
      <div className="w-full max-w-sm space-y-4 z-10 mb-8">
        <Button 
          onClick={() => {
            setEmail(""); setPassword("");
            setActiveSheet("login");
          }}
          className="w-full h-14 text-lg font-bold bg-white text-[#051E96] hover:bg-white/90 rounded-full shadow-lg"
        >
          로그인
        </Button>
        <Button 
          onClick={() => {
            setEmail(""); setPassword("");
            setActiveSheet("signup");
          }}
          variant="outline"
          className="w-full h-14 text-lg font-bold border-2 border-white bg-transparent text-white hover:bg-white/10 rounded-full"
        >
          회원가입
        </Button>
      </div>


      {/* --- 4. 로그인 바텀 시트 --- */}
      <BottomSheet 
        isOpen={activeSheet === "login"} 
        onClose={() => setActiveSheet("none")}
        title="로그인"
      >
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 ml-1">학번</label>
            <Input 
              placeholder="예: 18011234" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-lg bg-slate-50 border-slate-200 focus-visible:ring-[#051E96]"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 ml-1">비밀번호</label>
            <Input 
              type="password" 
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-lg bg-slate-50 border-slate-200 focus-visible:ring-[#051E96]"
              required
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 text-lg font-bold bg-[#051E96] hover:bg-[#041675] rounded-full mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : "로그인 완료"}
          </Button>
        </form>
      </BottomSheet>


      {/* --- 5. 회원가입 바텀 시트 --- */}
      <BottomSheet 
        isOpen={activeSheet === "signup"} 
        onClose={() => setActiveSheet("none")}
        title="회원가입"
      >
        <form onSubmit={handleSignup} className="space-y-5">
           <div className="bg-blue-50 p-4 rounded-xl mb-4">
              <p className="text-sm text-[#051E96] font-medium leading-relaxed">
                👋 <strong>세종대학교 학생이신가요?</strong><br/>
                학번을 아이디로 사용하며, 학교 이메일 형식(@sejong.ac.kr)으로 자동 가입됩니다.
              </p>
           </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 ml-1">학번</label>
            <Input 
              placeholder="학번 (숫자만 입력)" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-lg bg-slate-50 border-slate-200 focus-visible:ring-[#051E96]"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 ml-1">비밀번호 설정</label>
            <Input 
              type="password" 
              placeholder="6자리 이상 입력해주세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-lg bg-slate-50 border-slate-200 focus-visible:ring-[#051E96]"
              required
              minLength={6}
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 text-lg font-bold bg-[#051E96] hover:bg-[#041675] rounded-full mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : <span className="flex items-center">가입하고 룸메 찾기 <ChevronRight className="ml-1 w-5 h-5"/></span>}
          </Button>
        </form>
      </BottomSheet>

    </div>
  );
}