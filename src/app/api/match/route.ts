import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // --- [STEP 1] Supabase에서 데이터 가져오기 (3개 테이블 조인) ---

    // 1. 내 프로필 + 라이프스타일 + 페르소나(가중치) 조회
    const { data: myProfile, error: myError } = await supabase
      .from("profiles")
      .select("*, user_lifestyles(*), user_personas(*)") 
      .eq("id", userId)
      .single();

    if (myError || !myProfile) {
      return NextResponse.json({ error: "내 프로필을 찾을 수 없습니다." }, { status: 404 });
    }

    // 2. 후보자 조회 (나 제외, 같은 성별, 구하는 중)
    const { data: candidates, error: candError } = await supabase
      .from("profiles")
      .select("*, user_lifestyles(*), user_personas(*)")
      .neq("id", userId)
      .eq("gender", myProfile.gender)
      .eq("status", "seeking");

    if (candError || !candidates) {
      return NextResponse.json({ error: "후보자 데이터를 가져오는데 실패했습니다." }, { status: 500 });
    }

    // --- [STEP 2] 데이터 포장 (DB 컬럼 -> AI 변수명 매핑) ---
    const formatProfile = (row: any) => {
      const life = row.user_lifestyles || {};
      const persona = row.user_personas || {};

      return {
        // [신원 정보]
        id: row.id,
        nickname: row.nickname || "알수없음",
        gender: row.gender,

        // [라이프스타일 값] (DB: user_lifestyles -> AI: UserProfile)
        smoke: life.smoke ?? false,
        sleep_habit: life.game_voice ? "yes" : "no", // 예시 매핑
        sleep_time_val: life.sleep_time_val ?? 0.5,
        wake_time_val: life.wake_time_val ?? 0.5,
        clean_cycle_val: life.clean_cycle_val ?? 0.5,
        hvac_val: life.hvac_val ?? 0.5,
        alarm_val: life.sound_sensitivity_val ?? 0.5, 
        outing_val: life.outing_val ?? 0.5, // DB에 없으면 기본값

        // [현재 가중치] (DB: user_personas -> AI: UserProfile)
        // DB 컬럼명(pref_...)과 AI 변수명(w_...)을 연결합니다.
        w_sleep: persona.pref_schedule ?? 0.233,
        w_smoke: persona.pref_smoke ?? 0.167,
        w_sleep_habit: persona.pref_habit ?? 0.113,
        w_hvac: persona.pref_temp ?? 0.133,
        w_clean_cycle: persona.pref_cleanliness ?? 0.147,
        w_noise: persona.pref_noise ?? 0.173,
        w_outing: persona.pref_drink ?? 0.033, // *DB 매핑 주의 (pref_drink 사용중)

        // [필터]
        block_smoke: false,
        block_sleep_habit: false,
      };
    };

    // 라이프스타일 정보가 없는(설문 안 한) 유령 회원은 제외
    const validCandidates = candidates.filter(c => c.user_lifestyles !== null);

    const payload = {
      user_profile: formatProfile(myProfile),
      candidates: validCandidates.map(formatProfile),
    };

    console.log(`🚀 AI 요청 보냄: 후보자 ${validCandidates.length}명`);

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
      const errText = await aiResponse.text();
      console.error("AI Error:", errText);
      throw new Error(`AI Server Error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const { results: aiResults, updated_weights: newWeights } = aiData;

    // --- [STEP 4] 가중치 업데이트 (AI 제안 반영) ---
    if (newWeights) {
      console.log("🔄 AI 제안 가중치 업데이트:", newWeights);

      // AI가 준 키(w_...)를 DB 컬럼(pref_...)으로 변환해야 함
      const updatePayload = {
        pref_schedule: newWeights.w_sleep,
        pref_smoke: newWeights.w_smoke,
        pref_habit: newWeights.w_sleep_habit,
        pref_temp: newWeights.w_hvac,
        pref_cleanliness: newWeights.w_clean_cycle,
        pref_noise: newWeights.w_noise,
        pref_drink: newWeights.w_outing, // *매핑 주의
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("user_personas")
        .update(updatePayload)
        .eq("user_id", userId);

      if (updateError) {
        console.error("⚠️ 가중치 업데이트 실패:", updateError);
      }
    }

    // --- [STEP 5] 결과 합치기 (DB정보 + AI점수) ---
    const finalResults = aiResults.map((aiItem: any) => {
      const originalProfile = validCandidates.find((c) => c.nickname === aiItem.nickname);
      
      return {
        id: originalProfile?.id,
        nickname: originalProfile?.nickname,
        gender: originalProfile?.gender,
        
        // 상세 정보 펼쳐주기 (프론트에서 쓰기 편하게)
        ...originalProfile?.user_lifestyles,
        
        score: aiItem.score,
        risks: aiItem.risks
      };
    });

    // 점수 높은 순 정렬
    finalResults.sort((a: any, b: any) => b.score - a.score);

    return NextResponse.json(finalResults);

  } catch (error: any) {
    console.error("매칭 프로세스 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}