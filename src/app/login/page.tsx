"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const email = `${studentId}@sejong.ac.kr`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("로그인 성공!");
      router.push("/analyzing"); 
    } catch (error: any) {
      toast.error("학번 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 1. h-full & bg-[#B9BEFF]: 프레임 꽉 채우고 라벤더색 배경 적용
    // 2. justify-center: 내용물이 적으므로 화면 정중앙에 배치
    <div className="h-full w-full bg-[#B9BEFF] px-8 flex flex-col justify-center">
      
      {/* 타이틀 영역 */}
      <div className="mb-10">
        <h2 className="text-[32px] font-black text-[#051E96] uppercase tracking-wide">
          Log In
        </h2>
      </div>

      {/* 로그인 폼 */}
      <form onSubmit={handleLogin} className="space-y-6">
        
        {/* 학번 입력 */}
        <div className="space-y-2">
          <Label htmlFor="studentId" className="text-[#051E96] font-bold pl-1 text-sm">학번</Label>
          <Input 
            id="studentId" 
            placeholder="20240001" 
            type="number" 
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required 
            // 디자인: 흰색 배경, 테두리 없음, 둥근 모서리, 파란색 포커스링
            className="bg-white border-0 h-12 rounded-lg text-slate-800 placeholder:text-slate-300 focus-visible:ring-[#051E96] text-base shadow-sm"
          />
        </div>

        {/* 비밀번호 입력 */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#051E96] font-bold pl-1 text-sm">비밀번호</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="******" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            className="bg-white border-0 h-12 rounded-lg text-slate-800 placeholder:text-slate-300 focus-visible:ring-[#051E96] text-base shadow-sm"
          />
        </div>

        {/* 로그인 버튼 */}
        <div className="pt-6">
          <Button 
            type="submit" 
            disabled={loading}
            // 디자인: 흰색 배경, 파란 글씨, 완전 둥근 모양(rounded-full)
            className="w-full h-14 text-lg font-bold bg-white text-[#051E96] rounded-full hover:bg-white/90 shadow-lg transition-transform active:scale-95"
          >
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </div>
      </form>
    </div>
  );
}