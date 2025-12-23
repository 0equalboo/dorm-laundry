// src/app/api/calibration/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { dummyProfiles } from "@/data/dummies";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, selectedIds } = body;

    // 1. 내 현재 프로필(설문값) 가져오기
    const { data: myProfile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !myProfile) throw new Error("프로필 조회 실패");

    // 2. 사용자가 선택한 더미 데이터들만 가져오기
    const selectedDummies = dummyProfiles.filter((d) => selectedIds.includes(d.id));

    // 3. 가중치 업데이트 로직
    // 기본값에서 시작
    let newWeights = {
      w_sleep: myProfile.w_sleep || 1.0,
      w_clean_cycle: myProfile.w_clean_cycle || 1.0,
      w_smoke: myProfile.w_smoke || 1.0,
      w_outing: myProfile.w_outing || 1.0,
    };

    // 선택한 모델들을 하나씩 분석하며 내 성향과 비교
    selectedDummies.forEach((dummy) => {
      // (1) 수면 시간: 나와 차이가 큰데도 선택했다면 -> 중요하지 않음 (가중치 감소)
      const sleepDiff = Math.abs(myProfile.sleep_time_val - dummy.sleep_time_val);
      if (sleepDiff > 0.4) { 
        newWeights.w_sleep -= 0.2; // 차이가 큰데 골랐으니 관대함
      } else {
        newWeights.w_sleep += 0.1; // 비슷해서 고른듯
      }

      // (2) 청소 주기
      const cleanDiff = Math.abs(myProfile.clean_cycle_val - dummy.clean_cycle_val);
      if (cleanDiff > 0.4) {
        newWeights.w_clean_cycle -= 0.2;
      } else {
        newWeights.w_clean_cycle += 0.1;
      }

      // (3) 흡연 여부: 나와 다른데 선택했다면 -> 아주 관대함
      if (myProfile.smoke !== dummy.smoke) {
        newWeights.w_smoke -= 0.5; // 흡연 여부 별로 안 따지는 사람임
      }
    });

    // 4. 가중치가 0 이하로 떨어지지 않게 보정
    Object.keys(newWeights).forEach((key) => {
      // @ts-ignore
      if (newWeights[key] < 0.1) newWeights[key] = 0.1;
      // @ts-ignore
      if (newWeights[key] > 2.0) newWeights[key] = 2.0; // 최대값 제한
    });

    // 5. DB 업데이트
    const { error: updateError } = await supabase
      .from("profiles")
      .update(newWeights)
      .eq("id", userId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, newWeights });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}