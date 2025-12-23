"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider"; // shadcn slider (없으면 input range로 대체 가능)
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SurveyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // --- 상태 관리 (DB 컬럼과 일치시킴) ---
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("male");
  const [smoke, setSmoke] = useState("false"); // 라디오 버튼용 문자열 처리
  
  // 0.0 ~ 1.0 (슬라이더 값은 0~100으로 받고 나중에 100으로 나눔)
  const [sleepTime, setSleepTime] = useState([50]); // 0(일찍) ~ 100(늦게)
  const [wakeTime, setWakeTime] = useState([50]);   // 0(일찍) ~ 100(늦게)
  const [cleanCycle, setCleanCycle] = useState([50]); // 0(안함) ~ 100(매일)
  const [outing, setOuting] = useState([50]);       // 0(집돌이) ~ 100(밖돌이)
  
  // 소음 민감도 (예민할수록 높음)
  const [noise, setNoise] = useState([50]);

  useEffect(() => {
    // 로그인 체크
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
      // 1. 데이터 포맷팅 (0~100 -> 0.0~1.0 변환)
      const profileData = {
        id: userId, // 내 ID (PK)
        nickname: nickname,
        gender: gender,
        smoke: smoke === "true", // 문자열 "true" -> boolean true

        // 정규화된 값 (0.0 ~ 1.0)
        sleep_time_val: sleepTime[0] / 100.0,
        wake_time_val: wakeTime[0] / 100.0,
        clean_cycle_val: cleanCycle[0] / 100.0,
        outing_val: outing[0] / 100.0,
        alarm_val: noise[0] / 100.0, // 소음 민감도

        // 기본 가중치 (일단 1.0으로 초기화, 나중에 캘리브레이션 페이지에서 수정됨)
        w_sleep: 1.0,
        w_clean_cycle: 1.0,
        w_hvac: 1.0,
        w_noise: 1.0,
        w_outing: 1.0,
        w_smoke: 2.0, // 흡연 여부는 보통 중요하니까 기본 가중치를 높게

        status: "seeking", // 매칭 대기 중 상태
      };

      console.log("전송할 데이터:", profileData);

      // 2. Supabase Insert (upsert를 써서 이미 있으면 수정, 없으면 생성)
      const { error } = await supabase
        .from("profiles")
        .upsert(profileData);

      if (error) {
        console.error("DB 에러:", error);
        throw error;
      }

      toast.success("설문 완료! 취향 분석 단계로 넘어갑니다.");
      
      // 3. 다음 페이지(캘리브레이션)로 이동
      router.push("/calibration");

    } catch (error: any) {
      toast.error(`저장 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20 flex justify-center">
      <Card className="w-full max-w-lg shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">📝 생활 습관 설문조사</CardTitle>
          <CardDescription>솔직하게 답변할수록 딱 맞는 룸메를 찾아요!</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8 pt-6">
          
          {/* 1. 기본 정보 */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">기본 정보</h3>
            
            <div className="space-y-2">
              <Label>닉네임 (익명)</Label>
              <input 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="예: 깔끔한 판다"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>성별 (기숙사 동 분류용)</Label>
              <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="m" />
                  <Label htmlFor="m">남자</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="f" />
                  <Label htmlFor="f">여자</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>흡연 여부</Label>
              <RadioGroup value={smoke} onValueChange={setSmoke} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="s-no" />
                  <Label htmlFor="s-no">비흡연자</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="s-yes" />
                  <Label htmlFor="s-yes">흡연자</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* 2. 생활 패턴 (슬라이더) */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg border-b pb-2">생활 패턴</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>취침 시간</Label>
                <span className="text-xs text-slate-500">
                  {sleepTime[0] < 30 ? "일찍 잠 (10시~)" : sleepTime[0] > 70 ? "새벽 올빼미" : "보통 (12시~)"}
                </span>
              </div>
              <Slider value={sleepTime} onValueChange={setSleepTime} max={100} step={5} />
              <div className="flex justify-between text-xs text-slate-400">
                <span>새나라의 어린이</span>
                <span>새벽 롤쟁이</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>기상 시간</Label>
                <span className="text-xs text-slate-500">
                  {wakeTime[0] < 30 ? "아침형 (6~7시)" : wakeTime[0] > 70 ? "오후 기상" : "보통 (8~9시)"}
                </span>
              </div>
              <Slider value={wakeTime} onValueChange={setWakeTime} max={100} step={5} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>청소 빈도</Label>
                <span className="text-xs text-slate-500">
                  {cleanCycle[0] > 80 ? "결벽증급" : cleanCycle[0] < 20 ? "안함" : "적당히"}
                </span>
              </div>
              <Slider value={cleanCycle} onValueChange={setCleanCycle} max={100} step={5} />
              <div className="flex justify-between text-xs text-slate-400">
                <span>더러워도 괜찮아</span>
                <span>먼지 한톨 못참아</span>
              </div>
            </div>

             <div className="space-y-3">
              <div className="flex justify-between">
                <Label>외출 빈도 (기숙사 체류)</Label>
                <span className="text-xs text-slate-500">
                  {outing[0] > 70 ? "밖돌이 (잠만 잠)" : outing[0] < 30 ? "기숙사 지박령" : "반반"}
                </span>
              </div>
              <Slider value={outing} onValueChange={setOuting} max={100} step={5} />
            </div>

             <div className="space-y-3">
              <div className="flex justify-between">
                <Label>소음 민감도</Label>
                <span className="text-xs text-slate-500">
                  {noise[0] > 70 ? "예민보스" : noise[0] < 30 ? "무던함" : "보통"}
                </span>
              </div>
              <Slider value={noise} onValueChange={setNoise} max={100} step={5} />
               <div className="flex justify-between text-xs text-slate-400">
                <span>시끄러워도 잘잠</span>
                <span>작은 소리도 깸</span>
              </div>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full bg-slate-900 h-12 text-lg" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2"/> : null}
            {loading ? "저장 중..." : "다음 단계로 (1/2) 👉"}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}