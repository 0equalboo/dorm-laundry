"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

// --- [컴포넌트] 바텀 시트 (애니메이션 수정 버전) ---
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
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let rafId: number;

    if (isOpen) {
      // 1. 컴포넌트 마운트 (이 시점에는 opacity-0, translate-y-full)
      setVisible(true);

      // 2. 확실한 애니메이션 보장을 위해 Double requestAnimationFrame 사용
      // 첫 번째 rAF: 브라우저가 DOM 렌더링을 준비할 시간을 줌
      rafId = requestAnimationFrame(() => {
        // 두 번째 rAF: 실제 페인트가 끝난 다음 프레임에 애니메이션 트리거
        rafId = requestAnimationFrame(() => {
          setShouldAnimate(true);
        });
      });
    } else {
      // 닫힐 때: 애니메이션 먼저 종료
      setShouldAnimate(false);
      
      // 애니메이션 시간(300ms) 후 언마운트
      timeoutId = setTimeout(() => {
        setVisible(false);
      }, 300);
    }

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
    };
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center overflow-hidden pointer-events-none">
      
      {/* 배경 - shouldAnimate으로 제어 */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto ${
          shouldAnimate ? "opacity-100" : "opacity-0"
        }`} 
        onClick={onClose} 
      />
      
      {/* 시트 본문 - shouldAnimate으로 제어 */}
      <div 
        className={`relative w-full bg-[#B9BEFF] rounded-t-[2rem] p-6 pb-10 shadow-2xl transition-transform duration-300 ease-out pointer-events-auto flex flex-col max-h-[90%] ${
          shouldAnimate ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* 핸들바 */}
        <div className="w-12 h-1.5 bg-[#051E96]/20 rounded-full mx-auto mb-4 shrink-0" />
        
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-2xl font-black text-[#051E96] uppercase tracking-wide">{title}</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="rounded-full text-[#051E96] hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
        
        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [activeSheet, setActiveSheet] = useState<"none" | "login" | "signup">("none");
  const [loading, setLoading] = useState(false);

  // --- 로그인 상태 ---
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // --- 회원가입 상태 ---
  const [signupData, setSignupData] = useState({
    name: "",
    studentId: "",
    phone: "",
    password: "",
    age: "",
    gender: "male"
  });

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData({ ...signupData, [e.target.id]: e.target.value });
  };
  const handleGenderChange = (value: string) => {
    setSignupData({ ...signupData, gender: value });
  };


  // --- 로그인 처리 ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const email = `${loginId}@sejong.ac.kr`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: loginPw,
      });
      if (error) throw error;
      toast.success("로그인 성공!");
      setActiveSheet("none");
      router.push("/analyzing");
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
      const email = `${signupData.studentId.trim()}@sejong.ac.kr`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: signupData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("회원가입 실패");

      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        nickname: signupData.name,
        gender: signupData.gender,
      });

      if (profileError) throw profileError;

      toast.success("가입 성공! 생활 패턴을 입력해주세요.");
      setActiveSheet("none");
      router.push("/survey/intro");

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative h-full w-full bg-white px-6 pt-12 pb-6 flex flex-col justify-between overflow-hidden">
      
      {/* 1. 상단 타이틀 */}
      <div className="shrink-0 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-[25px] leading-[1.3] text-slate-900 tracking-tight">
          내게 <span className="font-extrabold">딱</span> 맞는 <span className="font-extrabold text-[#051E96]">룸메이트</span>,<br />
          기숙사 유령이 찾아줄게요!
        </h1>
        <p className="text-[#7A82AB] text-sm leading-relaxed font-medium">
          수면 패턴부터 청소 습관까지,<br />
          데이터로 분석해 매칭해 드려요.
        </p>
      </div>

      {/* 2. 메인 캐릭터 */}
      <div className="relative flex-1 flex justify-center items-center w-full animate-in zoom-in duration-1000 delay-300">
        <div className="absolute top-1/4 right-8 w-10 h-10 bg-[#B9BEFF] rounded-full opacity-80 animate-bounce delay-100" />
        <div className="absolute top-[35%] right-4 w-6 h-6 bg-[#B9BEFF] rounded-full opacity-60 animate-bounce delay-300" />
        <div className="absolute bottom-1/4 left-6 w-12 h-12 bg-[#B9BEFF] rounded-full opacity-70 animate-bounce delay-700" />
        
        <div className="relative w-48 h-48 drop-shadow-2xl animate-float">
           <Image 
            src="/images/ghost_icon.png" 
            alt="기숙사 유령 캐릭터"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
        <div className="absolute bottom-[20%] w-24 h-3 bg-[#051E96] rounded-[100%] opacity-20 blur-md" />
      </div>

      {/* 3. 하단 버튼 */}
      <div className="shrink-0 space-y-3 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 z-10">
        <Button 
          size="lg" 
          onClick={() => {
            setSignupData({ name: "", studentId: "", phone: "", password: "", age: "", gender: "male" });
            setActiveSheet("signup");
          }}
          className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-[#051E96] hover:bg-[#041675] hover:scale-[1.02] transition-all text-white"
        >
          회원가입하기
        </Button>
        
        <div className="text-center pb-2">
          <span className="text-sm text-[#7A82AB]">이미 계정이 있나요? </span>
          <button 
            onClick={() => {
              setLoginId(""); setLoginPw("");
              setActiveSheet("login");
            }}
            className="text-sm font-semibold text-[#7A82AB] underline underline-offset-4 hover:text-[#051E96]"
          >
            로그인하기
          </button>
        </div>
      </div>

      {/* 로그인 바텀 시트 */}
      <BottomSheet 
        isOpen={activeSheet === "login"} 
        onClose={() => setActiveSheet("none")}
        title="LOG IN"
      >
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[#051E96] font-bold pl-1 text-sm">학번</Label>
            <Input 
              placeholder="예: 20240001" 
              type="number"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required 
              className="bg-white border-0 h-12 rounded-lg text-slate-800 placeholder:text-slate-300 focus-visible:ring-[#051E96] text-base shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#051E96] font-bold pl-1 text-sm">비밀번호</Label>
            <Input 
              type="password" 
              placeholder="******" 
              value={loginPw}
              onChange={(e) => setLoginPw(e.target.value)}
              required 
              className="bg-white border-0 h-12 rounded-lg text-slate-800 placeholder:text-slate-300 focus-visible:ring-[#051E96] text-base shadow-sm"
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 text-lg font-bold bg-white text-[#051E96] rounded-full hover:bg-white/90 shadow-lg transition-transform active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin text-[#051E96]" /> : "로그인"}
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* 회원가입 바텀 시트 */}
      <BottomSheet 
        isOpen={activeSheet === "signup"} 
        onClose={() => setActiveSheet("none")}
        title="SIGN UP"
      >
        <form onSubmit={handleSignup} className="flex flex-col gap-3">
          
          <div className="space-y-1">
            <Label htmlFor="name" className="text-[#051E96] font-bold pl-1 text-xs">이름</Label>
            <Input 
              id="name" 
              placeholder="홍길동" 
              required 
              value={signupData.name} 
              onChange={handleSignupChange} 
              className="bg-white border-0 h-10 rounded-lg text-slate-800 focus-visible:ring-[#051E96] text-sm shadow-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="studentId" className="text-[#051E96] font-bold pl-1 text-xs">학번</Label>
            <Input 
              id="studentId" 
              placeholder="20240001" 
              type="number" 
              required 
              value={signupData.studentId} 
              onChange={handleSignupChange} 
              className="bg-white border-0 h-10 rounded-lg text-slate-800 focus-visible:ring-[#051E96] text-sm shadow-sm"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-[#051E96] font-bold pl-1 text-xs">연락처</Label>
            <Input 
              id="phone" 
              placeholder="010-0000-0000" 
              type="tel" 
              required 
              value={signupData.phone} 
              onChange={handleSignupChange} 
              className="bg-white border-0 h-10 rounded-lg text-slate-800 focus-visible:ring-[#051E96] text-sm shadow-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-[#051E96] font-bold pl-1 text-xs">비밀번호</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="******" 
              required 
              value={signupData.password} 
              onChange={handleSignupChange} 
              className="bg-white border-0 h-10 rounded-lg text-slate-800 focus-visible:ring-[#051E96] text-sm shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-1">
            <div className="space-y-1">
              <Label htmlFor="age" className="text-[#051E96] font-bold pl-1 text-xs">나이</Label>
              <Input 
                id="age" 
                type="number" 
                placeholder="20" 
                required 
                value={signupData.age} 
                onChange={handleSignupChange} 
                className="bg-white border-0 h-10 rounded-lg text-slate-800 focus-visible:ring-[#051E96] text-sm shadow-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[#051E96] font-bold pl-1 text-xs">성별</Label>
              <RadioGroup value={signupData.gender} onValueChange={handleGenderChange} className="flex gap-2 h-10 items-center bg-white/50 rounded-lg px-2">
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="male" id="male" className="bg-white border-[#051E96] text-[#051E96]" />
                  <Label htmlFor="male" className="font-bold text-[#051E96] cursor-pointer text-xs">남자</Label>
                </div>
                <div className="w-px h-4 bg-[#051E96]/20 mx-1"></div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="female" id="female" className="bg-white border-[#051E96] text-[#051E96]" />
                  <Label htmlFor="female" className="font-bold text-[#051E96] cursor-pointer text-xs">여자</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg font-bold bg-white text-[#051E96] rounded-full hover:bg-white/90 shadow-lg transition-transform active:scale-95 border-2 border-transparent hover:border-[#051E96]/10" 
            >
              {loading ? <Loader2 className="animate-spin text-[#051E96]" /> : "회원가입 완료"}
            </Button>
          </div>
        </form>
      </BottomSheet>

    </main>
  );
}