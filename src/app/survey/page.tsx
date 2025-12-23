"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      const profileData = {
        id: userId,
        nickname: nickname,
        gender: gender,
        smoke: smoke === "true",
        sleep_time_val: sleepTime[0] / 100.0,
        wake_time_val: wakeTime[0] / 100.0,
        clean_cycle_val: cleanCycle[0] / 100.0,
        outing_val: outing[0] / 100.0,
        alarm_val: noise[0] / 100.0,
        w_sleep: 1.0,
        w_clean_cycle: 1.0,
        w_hvac: 1.0,
        w_noise: 1.0,
        w_outing: 1.0,
        w_smoke: 2.0,
        status: "seeking",
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData);

      if (error) throw error;

      toast.success("설문 완료! 취향 분석 단계로 넘어갑니다.");
      router.push("/calibration");

    } catch (error: any) {
      toast.error(`저장 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 전체 배경: 라벤더 (#B9BEFF)
    <div className="min-h-screen bg-[#B9BEFF] p-6 pb-20 flex justify-center items-start pt-10">
      <Card className="w-full max-w-lg shadow-xl border-0 rounded-3xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6 border-b border-slate-100">
          <CardTitle className="text-2xl font-black text-[#051E96]">
            📝 생활 습관 리포트
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            솔직하게 답변할수록<br/>꼭 맞는 룸메이트를 찾을 확률 UP! 🚀
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-10 pt-8">
          
          {/* 1. 기본 정보 섹션 */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-[#051E96] flex items-center gap-2">
              <span className="bg-[#E5E8FF] w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              기본 정보
            </h3>
            
            <div className="space-y-3">
              <Label className="text-slate-600 font-semibold">닉네임 (익명)</Label>
              <input 
                className="flex h-12 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium transition-all focus:border-[#051E96] focus:bg-white focus:outline-none placeholder:text-slate-400"
                placeholder="예: 깔끔한 판다"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-slate-600 font-semibold">성별</Label>
              <RadioGroup value={gender} onValueChange={setGender} className="grid grid-cols-2 gap-4">
                {/* 커스텀 라디오 버튼 스타일 */}
                {['male', 'female'].map((val) => (
                  <label key={val} className={`cursor-pointer relative flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    gender === val 
                      ? "border-[#051E96] bg-[#051E96] text-white shadow-md" 
                      : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}>
                    <RadioGroupItem value={val} id={val} className="sr-only" />
                    <span className="font-bold">{val === 'male' ? "남자 🙋‍♂️" : "여자 🙋‍♀️"}</span>
                    {gender === val && <Check className="absolute right-3 w-4 h-4" />}
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-slate-600 font-semibold">흡연 여부</Label>
              <RadioGroup value={smoke} onValueChange={setSmoke} className="grid grid-cols-2 gap-4">
                {[
                  { val: "false", label: "비흡연 🚭" }, 
                  { val: "true", label: "흡연 🚬" }
                ].map((item) => (
                  <label key={item.val} className={`cursor-pointer relative flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    smoke === item.val 
                      ? "border-[#051E96] bg-[#051E96] text-white shadow-md" 
                      : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}>
                    <RadioGroupItem value={item.val} id={`s-${item.val}`} className="sr-only" />
                    <span className="font-bold">{item.label}</span>
                    {smoke === item.val && <Check className="absolute right-3 w-4 h-4" />}
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* 2. 생활 패턴 섹션 */}
          <div className="space-y-8">
            <h3 className="font-bold text-lg text-[#051E96] flex items-center gap-2">
              <span className="bg-[#E5E8FF] w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              생활 패턴 (드래그 해주세요)
            </h3>

            {/* 취침 시간 */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <Label className="text-slate-600 font-semibold text-base">취침 시간</Label>
                <span className="text-sm font-bold text-[#051E96] bg-[#E5E8FF] px-2 py-1 rounded-md">
                  {sleepTime[0] < 30 ? "일찍 (10시~)" : sleepTime[0] > 70 ? "새벽 (2시~)" : "보통 (12시~)"}
                </span>
              </div>
              <Slider 
                value={sleepTime} onValueChange={setSleepTime} max={100} step={5} 
                className="py-2"
              />
              <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
                <span>새나라 어린이 ☀️</span>
                <span>새벽 롤쟁이 🌙</span>
              </div>
            </div>

            {/* 기상 시간 */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <Label className="text-slate-600 font-semibold text-base">기상 시간</Label>
                <span className="text-sm font-bold text-[#051E96] bg-[#E5E8FF] px-2 py-1 rounded-md">
                  {wakeTime[0] < 30 ? "아침형 (6~7시)" : wakeTime[0] > 70 ? "오후 기상" : "보통 (8~9시)"}
                </span>
              </div>
              <Slider value={wakeTime} onValueChange={setWakeTime} max={100} step={5} className="py-2" />
              <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
                <span>아침형</span>
                <span>오후 기상</span>
              </div>
            </div>

            {/* 청소 빈도 */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <Label className="text-slate-600 font-semibold text-base">청소 빈도</Label>
                <span className="text-sm font-bold text-[#051E96] bg-[#E5E8FF] px-2 py-1 rounded-md">
                  {cleanCycle[0] > 80 ? "✨ 결벽증급" : cleanCycle[0] < 20 ? "🧹 안함" : "👌 적당히"}
                </span>
              </div>
              <Slider value={cleanCycle} onValueChange={setCleanCycle} max={100} step={5} className="py-2" />
              <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
                <span>자유로운 영혼</span>
                <span>먼지 못 참음</span>
              </div>
            </div>

             {/* 외출 빈도 */}
             <div className="space-y-4">
              <div className="flex justify-between items-end">
                <Label className="text-slate-600 font-semibold text-base">외출 빈도</Label>
                <span className="text-sm font-bold text-[#051E96] bg-[#E5E8FF] px-2 py-1 rounded-md">
                  {outing[0] > 70 ? "🏃 밖돌이" : outing[0] < 30 ? "🏠 집순이" : "⚖️ 반반"}
                </span>
              </div>
              <Slider value={outing} onValueChange={setOuting} max={100} step={5} className="py-2" />
              <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
                <span>기숙사 지박령</span>
                <span>잠만 잠</span>
              </div>
            </div>

             {/* 소음 민감도 */}
             <div className="space-y-4">
              <div className="flex justify-between items-end">
                <Label className="text-slate-600 font-semibold text-base">소음 민감도</Label>
                <span className="text-sm font-bold text-[#051E96] bg-[#E5E8FF] px-2 py-1 rounded-md">
                  {noise[0] > 70 ? "🔇 예민보스" : noise[0] < 30 ? "🎧 무던함" : "👂 보통"}
                </span>
              </div>
              <Slider value={noise} onValueChange={setNoise} max={100} step={5} className="py-2" />
               <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
                <span>시끄러워도 꿀잠</span>
                <span>작은 소리도 깸</span>
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="pt-4">
            <Button 
              onClick={handleSubmit} 
              className="w-full h-14 text-lg font-bold bg-[#051E96] hover:bg-[#041675] text-white rounded-full shadow-lg transition-transform active:scale-95" 
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2"/> : null}
              {loading ? "저장 중..." : "다음 단계로 (1/2) 👉"}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}