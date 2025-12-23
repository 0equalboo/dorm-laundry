"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Suspense로 감싸야 useSearchParams 에러가 안 납니다.
function QRActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const machineId = searchParams.get("id"); // URL에서 ?id=1 가져오기
  const [status, setStatus] = useState("QR 코드 확인 중...");

  useEffect(() => {
    const processQR = async () => {
      if (!machineId) {
        toast.error("잘못된 QR 코드입니다.");
        router.push("/main");
        return;
      }

      try {
        // 1. 사용자 정보 확인
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("로그인이 필요합니다!");
          router.push("/login");
          return;
        }

        // 2. 사용자 성별 가져오기
        const { data: profile } = await supabase
          .from("profiles")
          .select("gender")
          .eq("id", user.id)
          .single();

        // 3. 기계 정보 가져오기
        const { data: machine } = await supabase
          .from("laundry_machines")
          .select("*")
          .eq("id", machineId)
          .single();

        if (!machine) throw new Error("존재하지 않는 기계입니다.");

        // --- 검증 로직 ---

        // A. 성별 체크
        if (machine.gender !== profile?.gender) {
          toast.error(`출입 불가: 이 기계는 ${machine.gender === 'male' ? '남성' : '여성'} 전용입니다.`);
          router.push("/main");
          return;
        }

        // B. 상태 변경 로직 (Toggle)
        if (machine.status === 'idle') {
          // [시작] 빈 기계 -> 사용 시작
          const endTime = new Date();
          endTime.setMinutes(endTime.getMinutes() + 50); // 50분 타이머

          await supabase.from("laundry_machines").update({
            status: 'running',
            user_id: user.id,
            end_time: endTime.toISOString()
          }).eq("id", machineId);

          toast.success(`${machine.label} 사용을 시작합니다! (50분)`);

        } else if (machine.status === 'running') {
          // [종료] 돌고 있는 기계 -> 내꺼면 종료
          if (machine.user_id === user.id) {
            await supabase.from("laundry_machines").update({
              status: 'idle',
              user_id: null,
              end_time: null
            }).eq("id", machineId);

            toast.success("사용을 종료했습니다. 세탁물을 챙겨주세요!");
          } else {
            // 남의 꺼면 에러
            toast.error("다른 학우가 사용 중인 기계입니다.");
          }
        }

        // 모든 처리 후 메인으로 이동
        router.push("/main");

      } catch (error: any) {
        console.error(error);
        toast.error("오류가 발생했습니다.");
        router.push("/main");
      }
    };

    processQR();
  }, [machineId, router]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#B9BEFF]">
      <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#051E96] animate-spin" />
        <p className="text-[#051E96] font-bold text-lg">{status}</p>
      </div>
    </div>
  );
}

export default function QRActionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QRActionContent />
    </Suspense>
  );
}