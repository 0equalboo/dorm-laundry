"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; // shadcn Textarea 필요
import { toast } from "sonner";
import { MessageSquarePlus, ChevronLeft, Loader2 } from "lucide-react";

export default function SchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  
  // 피드백 관련 상태
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      setLoading(false);
    }
    init();
  }, [router]);

  // 피드백 전송 핸들러
  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error("내용을 입력해주세요!");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, feedbackText }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("피드백이 AI에 반영되었습니다! 🧠");
      setFeedbackText("");
      setIsFeedbackOpen(false); // 모달 닫기
    } catch (e) {
      console.error(e);
      toast.error("피드백 전송에 실패했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">로딩중...</div>;

  return (
    <div className="h-full w-full bg-white flex flex-col font-sans">
      
      {/* 1. 헤더 (메뉴바 역할) */}
      <div className="px-6 pt-12 pb-4 flex justify-between items-center bg-white border-b border-slate-50 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-slate-50 rounded-full">
          <ChevronLeft className="w-6 h-6 text-slate-800" />
        </button>
        <h1 className="text-lg font-bold text-[#051E96]">스케줄 & 피드백</h1>
        
        {/* ✨ [추가된 부분] 피드백 버튼 및 모달 ✨ */}
        <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
          <DialogTrigger asChild>
            <button className="p-2 -mr-2 hover:bg-slate-50 rounded-full text-[#051E96]">
              <MessageSquarePlus className="w-6 h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="w-[90%] max-w-md rounded-[20px] bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#051E96]">
                AI 가중치 업데이트
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                지난 룸메이트와의 경험을 자유롭게 적어주세요.<br/>
                AI가 내용을 분석해 내 성향(가중치)을 조정합니다.
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              <Textarea 
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="예: 저번 룸메이트는 새벽에 너무 시끄러웠어. 소음에 예민한 편인 것 같아."
                className="resize-none h-32 bg-slate-50 border-slate-200 focus:border-[#051E96] rounded-xl p-3 text-sm"
              />
              
              <Button 
                onClick={handleSendFeedback} 
                disabled={isSending}
                className="w-full bg-[#051E96] hover:bg-[#041675] text-white font-bold h-12 rounded-xl"
              >
                {isSending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 분석 중...</>
                ) : (
                  "피드백 보내기 🚀"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 2. 본문 (스케줄 내용 등) */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="text-center text-slate-400 mt-20 text-sm">
          여기에 시간표 기능이 들어갑니다.
        </div>
      </div>

    </div>
  );
}