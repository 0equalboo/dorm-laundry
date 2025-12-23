import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    // [핵심] h-full: 프레임 꽉 채움, pt-12: 노치 회피, justify-between: 위/중간/아래 배분
    <main className="h-full w-full bg-white px-6 pt-12 pb-6 flex flex-col justify-between overflow-hidden">
      
      {/* 1. 상단: 타이틀 및 카피 (공간 고정: shrink-0) */}
      <div className="shrink-0 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-[25px] leading-[1.3] text-slate-900 tracking-tight">
          내게 <span className="font-extrabold">딱</span> 맞는 <span className="font-extrabold text-[#051E96]">룸메이트</span>,<br />
          기숙사 유령이 찾아줄게요!
        </h1>
        <p className="text-[#7A82AB] text-sm leading-relaxed font-medium">
          수면 패턴부터 청소 습관까지,<br />
          데이터로 분석해 매칭해 드려요.
        </p>
      </div>

      {/* 2. 중단: 유령 캐릭터 이미지 및 장식 (남는 공간 차지: flex-1) */}
      <div className="relative flex-1 flex justify-center items-center w-full animate-in zoom-in duration-1000 delay-300">
        
        {/* 장식용 원 (큰 것) - 우측 상단 */}
        <div className="absolute top-1/4 right-8 w-10 h-10 bg-[#7d8ae6] rounded-full opacity-80 animate-bounce delay-100" />
        
        {/* 장식용 원 (작은 것) - 우측 상단 */}
        <div className="absolute top-[35%] right-4 w-6 h-6 bg-[#7d8ae6] rounded-full opacity-60 animate-bounce delay-300" />
        
        {/* 장식용 원 (중간 것) - 좌측 하단 */}
        <div className="absolute bottom-1/4 left-6 w-12 h-12 bg-[#7d8ae6] rounded-full opacity-70 animate-bounce delay-700" />
        
        {/* 메인 캐릭터 이미지 (크기 w-40으로 고정하여 넘침 방지) */}
        <div className="relative w-40 h-40 drop-shadow-2xl">
           <Image 
            src="/images/ghost_icon.png" 
            alt="기숙사 유령 캐릭터"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
        
        {/* 캐릭터 그림자 */}
        <div className="absolute bottom-[25%] w-24 h-3 bg-[#051E96] rounded-[100%] opacity-20 blur-md" />
      </div>

      {/* 3. 하단: 회원가입 버튼 (공간 고정: shrink-0) */}
      <div className="shrink-0 space-y-3 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
        <Link href="/signup" className="w-full block">
          <Button 
            size="lg" 
            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-[#051E96] hover:bg-[#041675] hover:scale-[1.02] transition-all text-white"
          >
            회원가입하기
          </Button>
        </Link>
        
        <div className="text-center pb-2">
          <span className="text-sm text-[#7A82AB]">이미 계정이 있나요? </span>
          <Link href="/login" className="text-sm font-semibold text-[#7A82AB] underline underline-offset-4 hover:text-[#051E96]">
            로그인하기
          </Link>
        </div>
      </div>
    </main>
  );
}