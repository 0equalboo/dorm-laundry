import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // --- [STEP 1] Supabase에서 데이터 가져오기 ---

    // 1. 내 프로필 조회
    const { data: myProfile, error: myError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (myError || !myProfile) {
      return NextResponse.json({ error: "내 프로필을 찾을 수 없습니다." }, { status: 404 });
    }

    // 2. 후보자 프로필 조회 (나 제외, 같은 성별, 룸메 구하는 중)
    const { data: candidates, error: candError } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", userId)
      .eq("gender", myProfile.gender)
      .eq("status", "seeking"); // 구하는 중인 사람만

    if (candError || !candidates) {
      return NextResponse.json({ error: "후보자 데이터를 가져오는데 실패했습니다." }, { status: 500 });
    }

    // --- [STEP 2] 데이터 포장 (AI 서버용) ---
    const formatProfile = (row: any) => ({
      // 매칭에 필요한 ID와 닉네임 꼭 포함
      id: row.id, 
      nickname: row.nickname || "알수없음",
      gender: row.gender || "male",
      smoke: row.smoke ?? false,
      sleep_habit: row.sleep_habit || "none",
      sleep_time_val: row.sleep_time_val || 0.5,
      wake_time_val: row.wake_time_val || 0.5,
      clean_cycle_val: row.clean_cycle_val || 0.5,
      hvac_val: row.hvac_val || 0.5,
      alarm_val: row.alarm_val || 0.5,
      outing_val: row.outing_val || 0.5,
      block_smoke: row.block_smoke ?? false,
      block_sleep_habit: row.block_sleep_habit ?? false,
      w_sleep: row.w_sleep ?? 1.0,
      w_clean_cycle: row.w_clean_cycle ?? 1.0,
      w_hvac: row.w_hvac ?? 1.0,
      w_noise: row.w_noise ?? 1.0,
      w_outing: row.w_outing ?? 1.0,
    });

    const payload = {
      user_profile: formatProfile(myProfile),
      candidates: (candidates as any[]).map(formatProfile),
    };

    console.log(`🚀 AI 요청 보냄: 후보자 ${candidates.length}명`);

    // --- [STEP 3] Python AI 서버로 전송 ---
    const aiResponse = await fetch(`${process.env.AI_SERVER_URL}/api/v1/match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(payload),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI 서버 에러:", errorText);
      throw new Error(`AI Server Error: ${aiResponse.status}`);
    }

    // 👉 여기가 질문하신 부분입니다!
    const aiResults = await aiResponse.json(); // 1. AI가 준 점수 리스트 받기

    // --- [STEP 4] 점수 + 상세 정보 합치기 (Merge) ---
    const finalResults = aiResults.map((aiItem: any) => {
      // 닉네임이 같은 사람을 DB 목록(candidates)에서 찾습니다.
      // (만약 AI가 id를 돌려준다면 .find(c => c.id === aiItem.id)가 더 안전합니다)
      const originalProfile = candidates.find((c) => c.nickname === aiItem.nickname);
      
      // DB정보(...) + AI점수(score, risks) 합쳐서 리턴
      return {
        ...originalProfile, 
        score: aiItem.score,
        risks: aiItem.risks
      };
    });

    // 최종적으로 합쳐진 데이터를 프론트로 보냅니다.
    return NextResponse.json(finalResults);

  } catch (error: any) {
    console.error("매칭 프로세스 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}