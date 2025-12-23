"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
// [수정 1] DialogDescription 추가 import
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Bell, RefreshCw, Copy, Menu, Camera, Home, Calendar, User } from "lucide-react";

// --- [타입 정의] ---
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
  hvac_val: number;
  alarm_val: number; 
}

interface MatchRequest {
  id: number;
  status: "pending" | "accepted" | "rejected";
  contact_info: string;
  message: string;
  created_at: string;
  sender_id: string;
  sender: {
    nickname: string;
    gender: string;
    user_lifestyles: {
      smoke: boolean;
      sleep_time_val: number;
      clean_cycle_val: number;
      sound_sensitivity_val: number;
    } | null; 
  };
}

export default function MainPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState("");
  const [nickname, setNickname] = useState("학우");
  const [userGender, setUserGender] = useState<"male" | "female" | "">("");

  const [machines, setMachines] = useState<LaundryMachine[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedUser[]>([]);
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);
  const [now, setNow] = useState(new Date());

  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // "home" | "schedule" | "mypage"

  const [selectedUser, setSelectedUser] = useState<RecommendedUser | null>(null); // 선택된 추천 유저
  const [reqMessage, setReqMessage] = useState(""); // 신청 메시지
  const [reqContact, setReqContact] = useState(""); // 내 연락처

  useEffect(() => {
    async function initData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         router.replace("/login");
         return;
      }
      setMyId(user.id);

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

      await Promise.all([
        fetchRecommendations(user.id),
        fetchMatchRequests(user.id)
      ]);
      
      setLoading(false);
    }

    initData();
    const timerInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerInterval);
  }, [router]);

  const fetchLaundryStatus = async (gender: string) => {
    const { data, error } = await supabase
      .from("laundry_machines")
      .select("*")
      .eq("gender", gender)
      .order("id", { ascending: true });
    
    if (!error) setMachines(data || []);
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

  const fetchMatchRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id, status, message, contact_info, created_at, sender_id,
          sender:profiles!matches_sender_id_fkey (  
            nickname, 
            gender,
            user_lifestyles (
              smoke, sleep_time_val, clean_cycle_val, sound_sensitivity_val
            )
          )
        `)
        .eq("receiver_id", userId)
        .neq("status", "rejected") 
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((req: any) => {
        const lifestyles = Array.isArray(req.sender?.user_lifestyles)
          ? req.sender.user_lifestyles[0]
          : req.sender?.user_lifestyles;

        return {
          ...req,
          sender: {
            nickname: req.sender?.nickname || "알수없음",
            gender: req.sender?.gender,
            user_lifestyles: lifestyles
          }
        };
      });

      setMatchRequests(formattedData);
    } catch (error) {
      console.error("신청 목록 로딩 실패:", error);
    }
  };

  const handleSendRequest = async () => {
    // 1. 기본 유효성 검사
    if (!myId) {
      toast.error("로그인 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }
    if (!selectedUser || !reqContact) {
      toast.error("연락처를 입력해주세요!");
      return;
    }

    try {
      // 2. [중요] 이미 신청한 내역이 있는지 먼저 확인 (중복 방지)
      const { data: existingMatch, error: searchError } = await supabase
        .from("matches")
        .select("id, status")
        .or(`and(sender_id.eq.${myId},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${myId})`)
        .maybeSingle();

      if (searchError) {
        console.error("중복 검사 중 에러:", searchError);
        // 검색 에러가 나도 일단 진행하거나 리턴
      }

      if (existingMatch) {
        toast.error(`이미 신청이 오고 갔거나, 친구 상태입니다! (상태: ${existingMatch.status})`);
        return;
      }

      // 3. 신청 전송 (INSERT)
      const { data, error } = await supabase
        .from("matches")
        .insert({
          sender_id: myId,
          receiver_id: selectedUser.id,
          message: reqMessage,
          contact_info: reqContact,
          status: "pending"
        })
        .select(); // insert 후 결과 반환 요청

      // 4. 에러 처리
      if (error) {
        console.error("❌ 전송 실패 상세 로그:", error); // 브라우저 콘솔(F12)에서 이 로그를 확인해야 합니다.
        toast.error(`전송 실패: ${error.message || "알 수 없는 오류"}`);
        return;
      }

      // 5. 성공 처리
      toast.success(`${selectedUser.nickname}님에게 신청을 보냈습니다! 💌`);
      setSelectedUser(null);
      setReqMessage("");
      setReqContact("");
      
      // 목록 새로고침 (내가 보낸 것도 확인하고 싶다면 로직 추가 필요, 여기선 생략)
      
    } catch (e) {
      console.error("예상치 못한 에러:", e);
      toast.error("오류가 발생했습니다.");
    }
  };

  // --- [세탁기 관련 로직] ---
  const handleMachineClick = async (machine: LaundryMachine) => {
    const isMine = machine.user_id === myId;

    if (machine.status === 'idle') {
      router.push(`/laundry/action?id=${machine.id}`);
    } else if (isMine) {
      if (confirm(`${machine.label} 사용을 종료하시겠습니까?`)) {
        const { error } = await supabase
          .from("laundry_machines")
          .update({ status: "idle", end_time: null, user_id: null })
          .eq("id", machine.id);
        
        if (!error) {
          toast.success("사용이 종료되었습니다.");
          fetchLaundryStatus(userGender);
        }
      }
    } else {
      toast.error("현재 다른 학우가 사용 중인 기기입니다.");
    }
  };

  const getTimeLeft = (endTimeStr: string | null) => {
    if (!endTimeStr) return null;
    const end = new Date(endTimeStr);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "00:00";
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const copyContact = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("연락처가 복사되었습니다!");
  };

  const handleAcceptMatch = async (matchId: number) => {
      const { error } = await supabase
        .from("matches")
        .update({ status: "accepted" })
        .eq("id", matchId);
        
      if (!error) {
          toast.success("매칭 수락!");
          fetchMatchRequests(myId); 
      }
  };

  const getIcons = (user: any) => {
    const sleepIcon = (user.sleep_time_val ?? 0.5) > 0.6 
      ? "/images/late_night.png" 
      : "/images/sun.png";

    const noiseIcon = (user.alarm_val ?? user.sound_sensitivity_val ?? 0.5) > 0.6 
      ? "/images/small_sound.png" 
      : "/images/big_sound.png";
    
    const cleanIcon = (user.clean_cycle_val ?? 0.5) < 0.4 
      ? "/images/Blood_minus.png" 
      : "/images/clean_icon.png";

    const smokeIcon = (user.smoke ?? false) 
      ? "/images/tabaco_icon.png" 
      : "/images/no_tabaco_icon.png";

    return { sleepIcon, noiseIcon, cleanIcon, smokeIcon };
  };

  // --- 하단 탭 이미지 결정 로직 ---
  const getMenuImage = () => {
    if (activeTab === "home") return "/images/menu1.png";
    if (activeTab === "schedule") return "/images/menu2.png";
    return "/images/menu3.png";
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-white text-[#051E96] font-bold animate-pulse">
        로딩 중... 👻
    </div>
  );

  return (
    <div className="h-full w-full bg-white flex flex-col relative overflow-hidden font-sans">
      
      {/* 1. 헤더 */}
      <div className="px-6 pt-12 pb-4 flex justify-between items-start bg-white z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-snug">
            <span className="text-[#051E96]">{nickname}님</span>,<br/>좋은 하루 보내고 계신가요?
          </h1>
        </div>
        <div className="flex gap-1">
            <Dialog open={isNotiOpen} onOpenChange={setIsNotiOpen}>
                <DialogTrigger asChild>
                    <button className="relative p-2 rounded-full hover:bg-slate-50 transition-colors">
                        <Bell className="w-6 h-6 text-[#051E96]" />
                        {matchRequests.some(r => r.status === 'pending') && (
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        )}
                    </button>
                </DialogTrigger>
                <DialogContent className="w-[90%] max-w-md rounded-[20px] bg-[#F8F9FD] border-0 p-0 overflow-hidden h-[75vh] flex flex-col">
                    <DialogHeader className="px-6 pt-6 pb-2 bg-white shrink-0 border-b border-slate-100">
                        <DialogTitle className="text-lg font-bold text-[#051E96]">룸메이트 신청 목록</DialogTitle>
                        {/* [수정] 경고 제거를 위한 Description 추가 (화면엔 안보임) */}
                        <DialogDescription className="sr-only">나에게 온 룸메이트 신청 목록입니다.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                        {matchRequests.map((req) => {
                            const styles = req.sender.user_lifestyles || { smoke: false, sleep_time_val: 0.5, clean_cycle_val: 0.5, sound_sensitivity_val: 0.5 };
                            const { sleepIcon, noiseIcon, cleanIcon, smokeIcon } = getIcons(styles);
                            return (
                                <div key={req.id} className="bg-white p-5 rounded-[20px] shadow-sm flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-[#E5E8FF] flex items-center justify-center shrink-0 border border-white shadow-sm">
                                            <Image src="/images/ghost_icon.png" alt="Ghost" width={28} height={28} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base text-slate-800">{req.sender.nickname}</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${styles.smoke ? "bg-red-50 text-red-400" : "bg-blue-50 text-[#051E96]"}`}>
                                                {styles.smoke ? "흡연자" : "비흡연자"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-start">
                                        {[sleepIcon, noiseIcon, cleanIcon, smokeIcon].map((src, i) => (
                                            <div key={i} className="w-9 h-9 bg-[#F8F9FF] rounded-xl flex items-center justify-center border border-[#E5E8FF]">
                                                <Image src={src} alt="icon" width={20} height={20} style={{ objectFit: 'contain' }} />
                                            </div>
                                        ))}
                                    </div>
                                    {req.message && <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 leading-relaxed italic">"{req.message}"</div>}
                                    {req.status === 'accepted' ? (
                                        <Button className="w-full bg-[#E5E8FF] text-[#051E96] hover:bg-[#D0D6FF] font-bold h-10 rounded-xl text-sm" onClick={() => copyContact(req.contact_info)}>
                                            {req.contact_info} <Copy className="w-3 h-3 ml-2 opacity-70"/>
                                        </Button>
                                    ) : (
                                        <Button className="w-full bg-[#051E96] text-white hover:bg-[#041675] font-bold h-10 rounded-xl text-sm shadow-md" onClick={() => handleAcceptMatch(req.id)}>연락처 확인하기</Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
            <button className="p-2 rounded-full hover:bg-slate-50 transition-colors"><Menu className="w-6 h-6 text-[#051E96]" /></button>
        </div>
      </div>

      {/* 2. 공지사항 */}
      <div className="px-6 mb-6">
        <div className="bg-[#B9BEFF] rounded-xl p-3 flex justify-between items-center text-white cursor-pointer shadow-sm">
           <div className="flex flex-col">
              <span className="text-[10px] font-bold opacity-90">오늘의 기숙사 공지</span>
              <span className="text-sm font-bold text-white">온수 공급 점검 (14:00~)</span>
           </div>
           <div className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-white">›</div>
        </div>
      </div>

      {/* 3. 메인 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto pb-28 scrollbar-hide space-y-8">
        
        {/* 추천 룸메이트 */}
        <section className="px-6">
           <h2 className="text-lg font-bold text-[#051E96] mb-4">추천 룸메이트</h2>
           <div className="flex gap-3 overflow-x-auto pb-6 -mx-6 px-6 scrollbar-hide snap-x">
             {recommendations.map((user, idx) => {
                 const { sleepIcon, noiseIcon, cleanIcon, smokeIcon } = getIcons(user);
                 return (
                   <div 
                     key={idx} 
                     onClick={() => setSelectedUser(user)} // [수정 2] 클릭 이벤트 추가!
                     className="snap-center shrink-0 w-[160px] bg-white rounded-[20px] p-4 flex flex-col gap-2.5 shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-[#F0F2F9] cursor-pointer"
                    >
                       {/* 상단: 아이콘 + 이름/흡연 정보 (가로 배치) */}
                       <div className="flex items-center gap-2.5">
                           <div className="relative w-11 h-11 rounded-full bg-[#F5F6FF] flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                               <Image src="/images/ghost_icon.png" alt="Profile" width={28} height={28} />
                           </div>
                           <div className="flex flex-col justify-center min-w-0">
                               <h3 className="text-[#051E96] font-bold text-sm truncate">{user.nickname}</h3>
                               <span className={`text-[8px] font-bold ${user.smoke ? "text-red-400" : "text-[#B9BEFF]"}`}>
                                   {user.smoke ? "흡연자" : "비흡연자"}
                               </span>
                           </div>
                       </div>
                       {/* 하단: 아이콘 그리드 */}
                       <div className="grid grid-cols-2 gap-1.5 w-full">
                           <div className="aspect-square bg-[#F8F9FF] rounded-lg flex items-center justify-center border border-[#E5E8FF]"><Image src={sleepIcon} alt="Sleep" width={18} height={18} /></div>
                           <div className="aspect-square bg-[#F8F9FF] rounded-lg flex items-center justify-center border border-[#E5E8FF]"><Image src={noiseIcon} alt="Noise" width={18} height={18} /></div>
                           <div className="aspect-square bg-[#F8F9FF] rounded-lg flex items-center justify-center border border-[#E5E8FF]"><Image src={cleanIcon} alt="Clean" width={18} height={18} /></div>
                           <div className="aspect-square bg-[#F8F9FF] rounded-lg flex items-center justify-center border border-[#E5E8FF]"><Image src={smokeIcon} alt="Smoke" width={18} height={18} /></div>
                       </div>
                   </div>
                 );
             })}
             <div className="w-2 shrink-0"></div>
           </div>
        </section>

        {/* 🌟 세탁실 현황 */}
        <section className="px-6">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-[#051E96]">세탁실 사용 현황</h2>
             <button onClick={() => fetchLaundryStatus(userGender)} className="text-xs font-bold text-slate-400 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> 새로고침</button>
           </div>

           <div className="grid grid-cols-4 gap-3">
             {machines.map((machine) => {
               const isMine = machine.user_id === myId;
               const isRunning = machine.status === 'running';
               const timeLeft = getTimeLeft(machine.end_time);
               
               return (
                 <div key={machine.id} className="flex flex-col gap-2">
                     {/* 세탁기 박스 */}
                     <div 
                       onClick={() => handleMachineClick(machine)} 
                       className={`aspect-square rounded-[16px] flex flex-col items-center justify-between py-2 border-2 cursor-pointer transition-all duration-200 relative ${
                         isRunning 
                         ? isMine 
                           ? "bg-white border-[#051E96]" 
                           : "bg-slate-100 border-transparent grayscale" 
                         : "bg-white border-[#E5E8FF]"
                       }`}
                     >
                         <div className={`text-[8px] font-bold px-2 py-0.5 rounded-full text-white ${isRunning ? "bg-[#051E96]" : "bg-[#B9BEFF]"}`}>
                             {machine.label}
                         </div>

                         <div className="flex flex-col items-center justify-center flex-1 w-full">
                           {isRunning ? (
                               <div className="flex flex-col items-center">
                                   <span className="text-[10px] font-black text-[#051E96]">{isMine ? "사용중" : "사용중"}</span>
                                   <span className="text-[9px] font-bold text-[#051E96] mt-0.5">{timeLeft}</span>
                               </div>
                           ) : (
                               <Camera className="w-5 h-5 text-[#E5E8FF]" />
                           )}
                         </div>
                     </div>
                 </div>
               )
             })}
           </div>
        </section>
      </div>

      {/* 🌟 하단 메뉴바 (CSS 코드로 구현 - 선명함 유지) */}
      <div className="absolute bottom-8 left-0 right-0 px-8 z-20">
        <div className="w-full h-[64px] bg-white rounded-full border border-[#051E96] flex items-center justify-between p-1.5 shadow-[0_4px_20px_rgba(5,30,150,0.15)]">
            
            {/* 1. 홈 버튼 (Main) */}
            <button 
                onClick={() => setActiveTab("home")} 
                className={`flex-1 h-full flex items-center justify-center rounded-[24px] transition-all duration-300 ${
                    activeTab === "home" 
                    ? "bg-[#051E96] text-white shadow-md" 
                    : "bg-transparent text-[#051E96] hover:bg-blue-50"
                }`}
            >
                <Home strokeWidth={2.5} className="w-6 h-6" />
            </button>

            {/* 2. 스케줄 버튼 (Schedule) */}
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

            {/* 3. 마이페이지 버튼 (MyPage) */}
            <button 
                onClick={() => { setActiveTab("mypage"); router.push("/mypage"); }} 
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

      {/* [수정 3] Dialog 위치 변경 (div 내부로 이동하여 문법 에러 해결) */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="w-[90%] max-w-md rounded-[20px] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#051E96]">
              {selectedUser?.nickname}님에게<br/>룸메이트 신청하기
            </DialogTitle>
             <DialogDescription className="text-xs text-slate-400">
               상대방에게 보여질 메시지와 연락처를 남겨주세요.
             </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            {/* 유저 성향 아이콘 요약 */}
            {selectedUser && (
               <div className="flex gap-2 justify-center py-2 bg-[#F8F9FF] rounded-xl">
                 {[getIcons(selectedUser).sleepIcon, getIcons(selectedUser).noiseIcon, getIcons(selectedUser).cleanIcon, getIcons(selectedUser).smokeIcon].map((src, i) => (
                    <div key={i} className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-[#E5E8FF]">
                      <Image src={src} alt="icon" width={24} height={24} />
                    </div>
                 ))}
               </div>
            )}

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
              className="w-full bg-[#051E96] hover:bg-[#041675] text-white font-bold h-12 rounded-xl mt-2"
            >
              신청 보내기 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}