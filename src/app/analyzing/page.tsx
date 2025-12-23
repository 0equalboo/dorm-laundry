"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AnalyzingPage() {
  const router = useRouter();

  useEffect(() => {
    // 3초 뒤에 메인 페이지로 이동 (API 호출이 있다면 여기서 처리 가능)
    const timer = setTimeout(() => {
      router.push("/main");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    // 배경: 딥블루 -> 라벤더 그라데이션
    // h-full: 모바일 프레임에 꽉 차게
    <div className="h-full w-full bg-gradient-to-b from-[#2E409A] to-[#B9BEFF] flex flex-col justify-center items-center relative overflow-hidden">
      
      {/* 유령 아이콘 + 둥둥 떠다니는 애니메이션 (globals.css의 animate-float 필요) */}
      <div className="relative w-40 h-40 mb-8 animate-float">
        <Image
          src="/images/ghost_icon.png"
          alt="분석중인 유령"
          fill
          style={{ objectFit: "contain" }}
          priority
        />
      </div>

      {/* 바닥 그림자 */}
      <div className="w-24 h-3 bg-[#051E96] rounded-[100%] opacity-30 blur-sm mb-20 animate-pulse" />

      {/* 텍스트 */}
      <h2 className="text-white text-lg font-medium text-center animate-pulse">
        AI가 나에게 딱 맞는<br/>
        룸메이트를 찾고 있어요...
      </h2>
    </div>
  );
}