"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SurveyIntroPage() {
  const router = useRouter();

  useEffect(() => {
    // 2.5초 뒤에 실제 설문조사 페이지로 이동
    const timer = setTimeout(() => {
      router.push("/survey");
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    // 배경: 위쪽 짙은 블루 -> 아래쪽 라벤더 그라데이션
    <div className="h-full w-full bg-gradient-to-b from-[#2E409A] to-[#B9BEFF] flex flex-col justify-center items-center relative overflow-hidden">
      
      {/* 유령 아이콘 (인트로에서는 가만히 있거나, 원하시면 animate-float 추가 가능) */}
      <div className="relative w-40 h-40 mb-8">
        <Image
          src="/images/ghost_icon.png"
          alt="기숙사 유령"
          fill
          style={{ objectFit: "contain" }}
          priority
          // 인트로 화면의 유령은 가만히 있는 게 정적인 느낌을 줄 수 있습니다.
          // 움직이게 하려면 className="animate-float" 를 추가하세요.
        />
      </div>

      {/* 그림자 */}
      <div className="w-24 h-3 bg-[#051E96] rounded-[100%] opacity-30 blur-sm mb-12" />

      {/* 텍스트 */}
      <h2 className="text-white text-lg font-medium text-center leading-relaxed animate-in fade-in duration-1000">
        매칭을 위해<br />
        몇가지 물어볼게요!
      </h2>
    </div>
  );
}