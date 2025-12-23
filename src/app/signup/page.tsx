"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    phone: "",
    password: "",
    age: "",
    gender: "male"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleGenderChange = (value: string) => {
    setFormData({ ...formData, gender: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const email  = `${formData.studentId.trim()}@sejong.ac.kr`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("회원가입 실패");

      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        nickname: formData.name,
        gender: formData.gender,
      });

      if (profileError) throw profileError;

      toast.success("가입 성공! 생활 패턴을 입력해주세요.");
      router.push("/survey/intro");

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // [핵심 1] h-full: 부모(휴대폰 프레임 812px) 높이를 꽉 채움
    // [핵심 2] pt-12: 노치(30px)를 피하기 위해 상단 패딩 추가
    <div className="h-full w-full bg-[#B9BEFF] px-6 pt-12 pb-6 flex flex-col justify-between overflow-hidden">
      
      {/* 1. 상단 타이틀 */}
      <div className="shrink-0 mb-2">
        <h2 className="text-3xl font-black text-[#051E96] uppercase tracking-wide">
          Sign Up
        </h2>
      </div>

      {/* 2. 폼 영역 (간격 최적화) */}
      <form 
        onSubmit={handleSubmit} 
        className="flex-1 flex flex-col justify-center gap-2" // gap을 2로 줄여서 촘촘하게
      >
        
        {/* 이름 */}
        <div className="space-y-1">
          <Label htmlFor="name" className="text-[#051E96] font-bold pl-1 text-xs">이름</Label>
          <Input 
            id="name" 
            placeholder="홍길동" 
            required 
            value={formData.name} 
            onChange={handleChange} 
            className="bg-white border-0 h-10 rounded-lg text-slate-800 focus-visible:ring-[#051E96] text-sm shadow-sm"
          />
        </div>

        {/* 학번 */}
        <div className="space-y-1">
          <Label htmlFor="studentId" className="text-[#051E96] font-bold pl-1 text-xs">학번</Label>
          <Input 
            id="studentId" 
            placeholder="20240001" 
            type="number" 
            required 
            value={formData.studentId} 
            onChange={handleChange} 
            className="bg-white border-0 h-10 rounded-lg text-slate-800 focus-visible:ring-[#051E96] text-sm shadow-sm"
          />
        </div>
        
        {/* 연락처 */}
        <div className="space-y-1">
          <Label htmlFor="phone" className="text-[#051E96] font-bold pl-1 text-xs">연락처</Label>
          <Input 
            id="phone" 
            placeholder="010-0000-0000" 
            type="tel" 
            required 
            value={formData.phone} 
            onChange={handleChange} 
            className="bg-white border-0 h-10 rounded-lg text-slate-800 focus-visible:ring-[#051E96] text-sm shadow-sm"
          />
        </div>

        {/* 비밀번호 */}
        <div className="space-y-1">
          <Label htmlFor="password" className="text-[#051E96] font-bold pl-1 text-xs">비밀번호</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="******" 
            required 
            value={formData.password} 
            onChange={handleChange} 
            className="bg-white border-0 h-10 rounded-lg text-slate-800 focus-visible:ring-[#051E96] text-sm shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {/* 나이 */}
          <div className="space-y-1">
            <Label htmlFor="age" className="text-[#051E96] font-bold pl-1 text-xs">나이</Label>
            <Input 
              id="age" 
              type="number" 
              placeholder="20" 
              required 
              value={formData.age} 
              onChange={handleChange} 
              className="bg-white border-0 h-10 rounded-lg text-slate-800 focus-visible:ring-[#051E96] text-sm shadow-sm"
            />
          </div>

          {/* 성별 */}
          <div className="space-y-1">
            <Label className="text-[#051E96] font-bold pl-1 text-xs">성별</Label>
            <RadioGroup value={formData.gender} onValueChange={handleGenderChange} className="flex gap-2 h-10 items-center bg-white/50 rounded-lg px-2">
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="male" id="male" className="bg-white border-[#051E96] text-[#051E96]" />
                <Label htmlFor="male" className="font-bold text-[#051E96] cursor-pointer text-xs">남자</Label>
              </div>
              <div className="w-px h-4 bg-[#051E96]/20 mx-1"></div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="female" id="female" className="bg-white border-[#051E96] text-[#051E96]" />
                <Label htmlFor="female" className="font-bold text-[#051E96] cursor-pointer text-xs">여자</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </form>

      {/* 3. 버튼 영역 */}
      <div className="shrink-0 mt-4">
        <Button 
          onClick={handleSubmit}
          className="w-full h-12 text-lg font-bold bg-white text-[#051E96] rounded-full hover:bg-white/90 shadow-lg transition-transform active:scale-95 border-2 border-transparent hover:border-[#051E96]/10" 
          disabled={loading}
        >
          {loading ? "가입 중..." : "회원가입 완료"}
        </Button>
      </div>
    </div>
  );
}