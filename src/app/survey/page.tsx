"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

export default function SurveyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // --- 상태 관리 ---
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("male");
  const [smoke, setSmoke] = useState("false");
  
  // 0 ~ 100 값 상태
  const [sleepTime, setSleepTime] = useState([50]);
  const [wakeTime, setWakeTime] = useState([50]); 
  const [cleanCycle, setCleanCycle] = useState([50]);
  const [outing, setOuting] = useState([50]);
  const [noise, setNoise] = useState([50]);   

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

  const handleSubmit = async () => {
    if (!nickname) {
      toast.error("닉네임을 입력해주세요!");
      return;
    }
    if (!userId) return;

    setLoading(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nickname: nickname,
          gender: gender,
          status: "seeking",
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      const { error: lifestyleError } = await supabase
        .from("user_lifestyles")
        .upsert({
          user_id: userId,
          smoke: smoke === "true",
          sleep_time_val: sleepTime[0] / 100.0,
          wake_time_val: wakeTime[0] / 100.0,
          clean_cycle_val: cleanCycle[0] / 100.0,
          sound_sensitivity_val: noise[0] / 100.0,
          updated_at: new Date().toISOString(),
        });

      if (lifestyleError) throw lifestyleError;

      toast.success("설문 완료! 취향 분석 단계로 넘어갑니다.");
      router.push("/survey/calibration");

    } catch (error: any) {
      console.error(error);
      toast.error(`저장 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 배경: 라벤더 (#B9BEFF), 스크롤바 숨김
    <div className="min-h-screen bg-[#B9BEFF] px-5 py-10 flex flex-col items-center overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* 헤더 (카드 밖으로 뺌) */}
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-2xl font-black text-[#051E96]">
          📝 생활 습관 리포트
        </h1>
        <p className="text-[#051E96]/80 font-medium text-sm">
          솔직하게 답변할수록<br/>꼭 맞는 룸메이트를 찾을 확률 UP! 🚀
        </p>
      </div>

      <div className="w-full max-w-md space-y-5 pb-20">
        
        {/* 1. 닉네임 박스 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
          <Label className="text-[#051E96] font-bold text-sm mb-3 block">닉네임 (익명)</Label>
          <input 
            className="flex h-12 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium transition-all focus:border-[#051E96] focus:bg-white focus:outline-none placeholder:text-slate-400"
            placeholder="예: 깔끔한 판다"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        {/* 2. 성별 & 흡연 박스 (함께 배치하거나 분리 가능, 여기선 깔끔하게 묶음) */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-3">
            <Label className="text-[#051E96] font-bold text-sm">성별</Label>
            <RadioGroup value={gender} onValueChange={setGender} className="grid grid-cols-2 gap-3">
              {['male', 'female'].map((val) => (
                <label key={val} className={`cursor-pointer relative flex items-center justify-center py-3 rounded-xl border-2 transition-all duration-200 ${
                  gender === val ? "border-[#051E96] bg-[#051E96] text-white" : "border-slate-100 bg-slate-50 text-slate-500"
                }`}>
                  <RadioGroupItem value={val} id={val} className="sr-only" />
                  <span className="font-bold text-sm">{val === 'male' ? "남자 🙋‍♂️" : "여자 🙋‍♀️"}</span>
                  {gender === val && <Check className="absolute right-3 w-4 h-4" />}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="space-y-3">
            <Label className="text-[#051E96] font-bold text-sm">흡연 여부</Label>
            <RadioGroup value={smoke} onValueChange={setSmoke} className="grid grid-cols-2 gap-3">
              {[ { val: "false", label: "비흡연 🚭" }, { val: "true", label: "흡연 🚬" } ].map((item) => (
                <label key={item.val} className={`cursor-pointer relative flex items-center justify-center py-3 rounded-xl border-2 transition-all duration-200 ${
                  smoke === item.val ? "border-[#051E96] bg-[#051E96] text-white" : "border-slate-100 bg-slate-50 text-slate-500"
                }`}>
                  <RadioGroupItem value={item.val} id={`s-${item.val}`} className="sr-only" />
                  <span className="font-bold text-sm">{item.label}</span>
                  {smoke === item.val && <Check className="absolute right-3 w-4 h-4" />}
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* 3. 생활 패턴 박스 (개별로 나눌 수도 있지만, 슬라이더 그룹은 묶는게 UI상 자연스러움) */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-[#E5E8FF] text-[#051E96] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <h3 className="font-bold text-lg text-[#051E96]">생활 패턴 설정</h3>
          </div>

          <CompactSlider label="취침 시간" value={sleepTime} onChange={setSleepTime} leftLabel="새나라" rightLabel="새벽반" 
            status={sleepTime[0] < 30 ? "10시 이전" : sleepTime[0] > 70 ? "새벽 2시 이후" : "12시 쯤"} />
          
          <CompactSlider label="기상 시간" value={wakeTime} onChange={setWakeTime} leftLabel="아침형" rightLabel="오후형" 
            status={wakeTime[0] < 30 ? "7시 이전" : wakeTime[0] > 70 ? "오후 기상" : "9시 쯤"} />
          
          <CompactSlider label="청소 빈도" value={cleanCycle} onChange={setCleanCycle} leftLabel="자유" rightLabel="깔끔" 
            status={cleanCycle[0] > 70 ? "매일 청소" : cleanCycle[0] < 30 ? "몰아서 함" : "적당히"} />
          
          <CompactSlider label="소음 민감도" value={noise} onChange={setNoise} leftLabel="둔감" rightLabel="예민" 
            status={noise[0] > 70 ? "매우 예민" : noise[0] < 30 ? "신경 안씀" : "보통"} />

          <CompactSlider label="외출 빈도" value={outing} onChange={setOuting} leftLabel="집순이" rightLabel="밖돌이" 
            status={outing[0] > 70 ? "주로 밖" : outing[0] < 30 ? "주로 방" : "반반"} />
        </div>

        {/* 하단 버튼 */}
        <Button 
          onClick={handleSubmit} 
          className="w-full h-14 text-lg font-bold bg-[#051E96] hover:bg-[#041675] text-white rounded-full shadow-lg transition-transform active:scale-95 border-2 border-white/20" 
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin mr-2"/> : null}
          {loading ? "저장 중..." : "취향 분석하러 가기 👉"}
        </Button>

      </div>
    </div>
  );
}

// 작은 슬라이더 컴포넌트
function CompactSlider({ label, value, onChange, leftLabel, rightLabel, status }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-slate-700 font-bold text-sm">{label}</Label>
        <span className="text-[10px] font-bold text-[#051E96] bg-[#E5E8FF] px-2 py-0.5 rounded-full">
          {status}
        </span>
      </div>
      <Slider value={value} onValueChange={onChange} max={100} step={5} className="py-1" />
      <div className="flex justify-between text-[10px] font-medium text-slate-400 px-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}