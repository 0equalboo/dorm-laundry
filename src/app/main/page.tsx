"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Clock, Sun, Sparkles, Cigarette, Timer, RefreshCw, QrCode } from "lucide-react";

// --- 타입 정의 ---
interface LaundryMachine {
  id: number;
  gender: "male" | "female";
  type: "washer" | "dryer";
  label: string;
  status: "idle" | "running";
  end_time: string | null;
  user_id: string | null;
}

interface RecommendedUser {
  id: string;
  nickname: string;
  score: number;
  smoke: boolean;
  sleep_time_val: number;
  wake_time_val: number;
  clean_cycle_val: number;
}

export default function MainPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState("");
  const [nickname, setNickname] = useState("학우");
  const [userGender, setUserGender] = useState<"male" | "female" | "">("");

  // 데이터 상태
  const [machines, setMachines] = useState<LaundryMachine[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedUser[]>([]);
  const [now, setNow] = useState(new Date()); 

  // 모달 상태
  const [selectedUser, setSelectedUser] = useState<RecommendedUser | null>(null);
  const [contactInfo, setContactInfo] = useState("");
  const [message, setMessage] = useState("");
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);

  // --- 유틸리티 함수 ---
  const getSleepText = (val: number) => val < 0.3 ? "새벽형" : val > 0.7 ? "올빼미" : "보통";
  const getWakeText = (val: number) => val < 0.3 ? "아침형" : val > 0.7 ? "오후 기상" : "보통";
  const getCleanText = (val: number) => val > 0.7 ? "깔끔쟁이" : val < 0.3 ? "자유 영혼" : "적당함";
  const getSmokeText = (smoke: boolean) => smoke ? "흡연 🚬" : "비흡연 🚭";

  // --- 초기 데이터 로딩 ---
  useEffect(() => {
    async function initData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         router.replace("/login");
         return;
      }
      setMyId(user.id);

      // 1. 내 프로필 정보
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("nickname, gender")
        .eq("id", user.id)
        .single();

      if (myProfile) {
        setNickname(myProfile.nickname);
        setUserGender(myProfile.gender);
        fetchLaundryStatus(myProfile.gender);
      }

      // 2. 추천 룸메이트
      fetchRecommendations(user.id);
      
      setLoading(false);
    }

    initData();

    const timerInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerInterval);
  }, [router]);

  // --- API 호출 함수들 ---
  const fetchLaundryStatus = async (gender: string) => {
    const { data, error } = await supabase
      .from("laundry_machines")
      .select("*")
      .eq("gender", gender)
      .order("id", { ascending: true });
    
    if (error) console.error("세탁기 로딩 실패:", error);
    else setMachines(data || []);
  };

  const fetchRecommendations = async (userId: string) => {
    try {
      const res = await fetch("/api/match", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      if (res.ok && Array.isArray(result)) {
        setRecommendations(result);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQRScan = (machineId: number) => {
    router.push(`/laundry/action?id=${machineId}`);
  };

  const getTimeLeft = (endTimeStr: string | null) => {
    if (!endTimeStr) return null;
    const end = new Date(endTimeStr);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "완료됨";
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}분 ${seconds}초`;
  };

  const handleRequestMatch = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: myId,
          receiverId: selectedUser.id,
          contactInfo,
          message
        }),
      });
      if (!res.ok) throw new Error("신청 실패");
      toast.success(`${selectedUser.nickname}님에게 신청 완료!`);
      setIsMatchDialogOpen(false);
    } catch (error) {
      toast.error("이미 신청했거나 오류가 발생했습니다.");
    }
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#B9BEFF]">
        <div className="text-[#051E96] font-bold animate-pulse">데이터 불러오는 중...</div>
    </div>
  );

  return (
    <div className="h-full w-full bg-[#B9BEFF] overflow-hidden flex flex-col">
      
      {/* 1. 상단 헤더 */}
      <div className="px-6 pt-12 pb-6 bg-white/90 rounded-b-[2rem] shadow-sm z-10 shrink-0">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-black text-[#051E96]">
                Hello, {nickname}! 👋
                </h1>
                <p className="text-[#051E96]/70 text-sm mt-1 font-medium">
                {userGender === 'male' ? "남자" : "여자"} 기숙사 생활 관리
                </p>
            </div>
        </div>
        <div className="mt-4 bg-[#E5E8FF] p-3 rounded-xl text-xs text-[#051E96] font-semibold flex items-center">
            🔔 <span className="ml-2">공지: 온수 공급 점검 (14:00~)</span>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8 scrollbar-hide">
        
        {/* [순서 변경] 1. 룸메이트 추천 섹션 (이제 가장 위에 뜸) */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 px-1 drop-shadow-md">
            <User className="w-5 h-5" /> 추천 룸메이트 Pick
          </h2>
          
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
            {recommendations.length === 0 ? (
              <div className="w-full text-center py-10 bg-white/50 rounded-xl text-[#051E96] font-medium border-2 border-dashed border-white/50">
                추천 룸메이트가 없어요 😢
              </div>
            ) : (
              recommendations.map((user, idx) => (
                <Card key={idx} className="min-w-[260px] border-0 shadow-lg snap-center bg-white rounded-2xl">
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <div className="bg-[#E5E8FF] p-2 rounded-full">
                           <User className="w-6 h-6 text-[#051E96]" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-[#051E96]">{user.nickname}</CardTitle>
                          <p className="text-xs text-[#051E96] font-semibold opacity-70">{Math.round(user.score)}% 일치</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs text-slate-600 mb-5 font-medium">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#B9BEFF]"/> {getSleepText(user.sleep_time_val)}</span>
                      <span className="flex items-center gap-1"><Sun className="w-3 h-3 text-[#B9BEFF]"/> {getWakeText(user.wake_time_val)}</span>
                      <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#B9BEFF]"/> {getCleanText(user.clean_cycle_val)}</span>
                      <span className="flex items-center gap-1"><Cigarette className="w-3 h-3 text-[#B9BEFF]"/> {getSmokeText(user.smoke)}</span>
                    </div>
                    
                    <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                className="w-full rounded-full font-bold bg-[#051E96] text-white hover:bg-[#041675]" 
                                onClick={() => {
                                    setSelectedUser(user);
                                    setIsMatchDialogOpen(true);
                                }}
                            >
                                신청하기
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white">
                            <DialogHeader>
                                <DialogTitle className="text-[#051E96]">{selectedUser?.nickname}님에게 신청</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label className="text-[#051E96] font-bold">연락처</Label>
                                    <Input 
                                        value={contactInfo} 
                                        onChange={(e)=>setContactInfo(e.target.value)} 
                                        placeholder="오픈카톡 링크 or 카톡 ID"
                                        className="bg-slate-50 border-0 focus-visible:ring-[#051E96]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#051E96] font-bold">메시지</Label>
                                    <Textarea 
                                        value={message} 
                                        onChange={(e)=>setMessage(e.target.value)}
                                        placeholder="안녕하세요! 생활 패턴이 잘 맞을 것 같아서 신청합니다."
                                        className="bg-slate-50 border-0 focus-visible:ring-[#051E96]"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleRequestMatch} disabled={!contactInfo} className="w-full bg-[#051E96] text-white rounded-full">보내기</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* [순서 변경] 2. 스마트 세탁 타이머 섹션 (아래로 이동됨) */}
        <section className="pb-8">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 shadow-sm drop-shadow-md">
              <Timer className="w-5 h-5" /> 실시간 세탁실 ({userGender === 'male' ? "남" : "여"})
            </h2>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fetchLaundryStatus(userGender)} 
                className="text-white hover:bg-white/20 h-8"
            >
              <RefreshCw className="w-4 h-4 mr-1" /> 새로고침
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {machines.map((machine) => {
              const timeLeft = getTimeLeft(machine.end_time);
              const isFinished = timeLeft === "완료됨";
              const isMine = machine.user_id === myId;
              
              return (
                <div key={machine.id} className={`p-4 rounded-xl flex flex-col justify-between transition-all shadow-md ${
                  machine.status === 'idle' 
                    ? "bg-white" 
                    : isMine 
                      ? "bg-[#051E96] text-white ring-2 ring-white" 
                      : "bg-slate-200 opacity-90 grayscale"
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <Badge 
                        className={`mb-2 font-bold border-0 ${
                            isMine ? "bg-white text-[#051E96] hover:bg-white" : 
                            machine.status === 'idle' ? "bg-[#B9BEFF] text-[#051E96] hover:bg-[#B9BEFF]" : "bg-slate-400"
                        }`}
                    >
                      {machine.label}
                    </Badge>
                    {machine.status === 'running' && (
                      <span className={`text-xs font-bold ${isMine ? "text-white" : "text-slate-500"}`}>
                        {isFinished ? "종료됨" : timeLeft}
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    {machine.status === 'idle' ? (
                        <Button 
                        size="sm" 
                        className="w-full bg-[#051E96] text-white hover:bg-[#041675] font-bold"
                        onClick={() => handleQRScan(machine.id)}
                        >
                        <QrCode className="w-3 h-3 mr-1"/> 스캔
                        </Button>
                    ) : isMine ? (
                        <Button 
                        size="sm" 
                        variant="secondary"
                        className="w-full bg-white text-[#051E96] hover:bg-white/90 font-bold"
                        onClick={() => handleQRScan(machine.id)}
                        >
                        {isFinished ? "종료하기" : "사용 중"}
                        </Button>
                    ) : (
                        <Button size="sm" variant="outline" className="w-full border-slate-300 text-slate-500" disabled>
                        사용 중
                        </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}