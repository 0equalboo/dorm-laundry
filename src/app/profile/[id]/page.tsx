"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, Loader2 } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; 
// [추가] 팝업(Dialog) 관련 컴포넌트 import
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// --- [타입 정의] ---
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

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const targetUserId = params.id as string; // 조회할 유저 ID

  const [profile, setProfile] = useState<any>(null);
  const [lifestyle, setLifestyle] = useState<UserLifestyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState("");

  // [추가] 팝업 및 신청 관련 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reqMessage, setReqMessage] = useState("");
  const [reqContact, setReqContact] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // 1. 내 ID 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setMyId(user.id);

      // 2. 타겟 유저 데이터 가져오기
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, user_lifestyles(*)")
        .eq("id", targetUserId)
        .single();

      if (profileData) {
        setProfile(profileData);
        const lifestyleData = Array.isArray(profileData.user_lifestyles) 
          ? profileData.user_lifestyles[0] 
          : profileData.user_lifestyles;
        setLifestyle(lifestyleData);
      }
      setLoading(false);
    }

    if (targetUserId) fetchData();
  }, [targetUserId]);

  // [추가] 신청 전송 핸들러 (메인 페이지 로직과 동일)
  const handleSendRequest = async () => {
    // 1. 유효성 검사
    if (!myId) {
      toast.error("로그인이 필요합니다.");
      router.push("/login");
      return;
    }
    if (!reqContact.trim()) {
      toast.error("연락처를 입력해주세요!");
      return;
    }

    setIsSending(true);

    try {
      // 2. 중복 신청 확인
      const { data: existingMatch, error: searchError } = await supabase
        .from("matches")
        .select("id, status")
        .or(`and(sender_id.eq.${myId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${myId})`)
        .maybeSingle();

      if (existingMatch) {
        toast.error(`이미 신청이 오고 갔거나, 친구 상태입니다! (상태: ${existingMatch.status})`);
        setIsSending(false);
        return;
      }

      // 3. 신청 전송 (INSERT)
      const { error } = await supabase
        .from("matches")
        .insert({
          sender_id: myId,
          receiver_id: targetUserId,
          message: reqMessage,
          contact_info: reqContact,
          status: "pending"
        });

      if (error) {
        console.error(error);
        toast.error("전송 실패: " + error.message);
      } else {
        toast.success(`${profile?.nickname}님에게 신청을 보냈습니다! 💌`);
        setIsDialogOpen(false); // 팝업 닫기
        setReqMessage("");
        setReqContact("");
      }
    } catch (e) {
      console.error(e);
      toast.error("알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  // 아이콘 및 라벨 로직
  const getSleepIcon = () => (lifestyle?.sleep_time_val ?? 0.5) > 0.6 ? "/images/late_night.png" : "/images/sun.png";
  const getNoiseIcon = () => (lifestyle?.sound_sensitivity_val ?? 0.5) > 0.6 ? "/images/small_sound.png" : "/images/big_sound.png";
  // [수정] 파일명 대소문자 주의 (Blood_minus.png)
  const getCleanIcon = () => (lifestyle?.clean_cycle_val ?? 0.5) < 0.4 ? "/images/Blood_minus.png" : "/images/clean_icon.png";
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
        <button 
          onClick={() => router.back()} 
          className="absolute top-12 left-6 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* 유령 프로필 */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
          <Image src="/images/ghost_icon.png" alt="Ghost" width={60} height={60} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">{profile?.nickname || "알수없음"}</h2>
        <p className="text-white/80 text-sm mb-8">{profile?.gender === "male" ? "남학생" : "여학생"} · 기숙사 거주 중</p>

        {/* 요약 픽토그램 */}
        <div className="flex justify-around w-full max-w-sm">
          <SummaryIcon src={getSleepIcon()} label={getSleepLabel()} />
          <SummaryIcon src={getNoiseIcon()} label={getNoiseLabel()} />
          <SummaryIcon src={getCleanIcon()} label={getCleanLabel()} />
          <SummaryIcon src={getSmokeIcon()} label={getSmokeLabel()} />
        </div>
      </div>

      {/* 2. 상세 데이터 시각화 */}
      <div className="flex-1 bg-white rounded-t-[40px] px-8 py-10 space-y-10 overflow-y-auto pb-32">
        <Section title="수면">
          <SliderRow label="기상 시간" left="이르다" right="늦다" value={lifestyle?.wake_time_val ?? 0.5} />
          <SliderRow label="취침 시간" left="이르다" right="늦다" value={lifestyle?.sleep_time_val ?? 0.5} />
        </Section>

        <Section title="청소">
          <SliderRow label="청소 주기" left="잘 안 해요" right="자주 해요" value={lifestyle?.clean_cycle_val ?? 0.5} />
        </Section>

        <Section title="냉난방 선호도">
          <SliderRow label="온도 선호" left="시원하게" right="따뜻하게" value={lifestyle?.hvac_val ?? 0.5} />
        </Section>

        <Section title="소음">
          <SliderRow label="소음 민감도" left="예민해요" right="둔감해요" value={lifestyle?.sound_sensitivity_val ?? 0.5} />
        </Section>

        <Section title="외출 & 음주">
          <SliderRow label="외출 빈도" left="적어요" right="많아요" value={lifestyle?.outing_val ?? 0.5} />
        </Section>
      </div>

      {/* 3. 하단 신청하기 버튼 (타인 프로필일 때만 표시) */}
      {myId !== targetUserId && (
         <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
             <Button 
               onClick={() => setIsDialogOpen(true)}
               className="w-full bg-[#051E96] hover:bg-[#041675] text-white font-bold h-14 rounded-2xl text-lg shadow-lg"
             >
               룸메이트 신청하기
             </Button>
         </div>
      )}

      {/* 4. [추가] 신청 팝업 (Dialog) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[90%] max-w-md rounded-[20px] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#051E96]">
              {profile?.nickname}님에게<br/>룸메이트 신청하기
            </DialogTitle>
             <DialogDescription className="text-xs text-slate-400">
               상대방에게 보여질 메시지와 연락처를 남겨주세요.
             </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            {/* 아이콘 요약 (상대방 성향) */}
            <div className="flex gap-2 justify-center py-2 bg-[#F8F9FF] rounded-xl">
               {[getSleepIcon(), getNoiseIcon(), getCleanIcon(), getSmokeIcon()].map((src, i) => (
                  <div key={i} className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-[#E5E8FF]">
                    <Image src={src} alt="icon" width={24} height={24} />
                  </div>
               ))}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">한줄 메시지</label>
              <input 
                value={reqMessage}
                onChange={(e) => setReqMessage(e.target.value)}
                placeholder="안녕하세요! 저랑 패턴이 잘 맞을 것 같아요 :)"
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#051E96]"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">연락처 (카톡ID/전화번호) <span className="text-red-500">*</span></label>
              <input 
                value={reqContact}
                onChange={(e) => setReqContact(e.target.value)}
                placeholder="오픈채팅 링크나 카톡 아이디를 남겨주세요"
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#051E96]"
              />
            </div>

            <Button 
              onClick={handleSendRequest}
              disabled={isSending}
              className="w-full bg-[#051E96] hover:bg-[#041675] text-white font-bold h-12 rounded-xl mt-2"
            >
              {isSending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> 전송 중...</> : "신청 보내기 🚀"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
      <div className="h-4 w-full bg-slate-100 rounded-full relative overflow-hidden">
        <div className="h-full bg-[#051E96] transition-all duration-500 rounded-full" style={{ width: `${value * 100}%` }} />
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