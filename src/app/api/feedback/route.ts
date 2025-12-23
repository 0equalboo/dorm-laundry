import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, feedbackText } = body;

    if (!userId || !feedbackText) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    console.log(`📝 피드백 접수: ${userId} - "${feedbackText}"`);

    // --- [STEP 1] Supabase에서 내 프로필 가져오기 ---
    const { data: myProfile, error: myError } = await supabase
      .from("profiles")
      .select("*, user_lifestyles(*), user_personas(*)") 
      .eq("id", userId)
      .single();

    if (myError || !myProfile) {
      return NextResponse.json({ error: "내 프로필을 찾을 수 없습니다." }, { status: 404 });
    }

    // Python UserProfile 스키마에 맞게 변환
    const formatProfile = (row: any) => {
      const life = row.user_lifestyles || {};
      const persona = row.user_personas || {};

      return {
        id: row.id,
        nickname: row.nickname || "알수없음",
        gender: row.gender,
        
        // [User Profile Fields]
        smoke: life.smoke ?? false,
        sleep_habit: life.game_voice ? "yes" : "no", // 예시 매핑
        sleep_time_val: life.sleep_time_val ?? 0.5,
        wake_time_val: life.wake_time_val ?? 0.5,
        clean_cycle_val: life.clean_cycle_val ?? 0.5,
        hvac_val: life.hvac_val ?? 0.5,
        alarm_val: life.sound_sensitivity_val ?? 0.5, 
        outing_val: life.outing_val ?? 0.5,
        
        // [Current Weights] - DB 컬럼(pref_...)을 Python(w_...)으로 매핑
        w_sleep: persona.pref_schedule ?? 0.0,
        w_smoke: persona.pref_smoke ?? 0.0,
        w_sleep_habit: persona.pref_habit ?? 0.0,
        w_hvac: persona.pref_temp ?? 0.0,
        w_clean_cycle: persona.pref_cleanliness ?? 0.0,
        w_noise: persona.pref_noise ?? 0.0,
        w_outing: persona.pref_drink ?? 0.0,
        
        // [Filters]
        block_smoke: false,
        block_sleep_habit: false,
      };
    };

    const formattedUserProfile = formatProfile(myProfile);

    // --- [STEP 2] Python AI 서버로 전송 (스키마 완벽 일치시키기) ---
    // Python의 FeedbackRequest 모델을 따릅니다.
    const payload = {
        user_profile: formattedUserProfile,
        target_profile: formattedUserProfile, // 텍스트 피드백이므로 대상이 없음 -> 나 자신을 더미로 넣음
        score: 0.5, // 텍스트 피드백이므로 점수는 중립(0.5) 혹은 0으로 설정
        label: 0,   // 만족(1)/불만족(0) -> 텍스트 피드백은 보통 개선 요구이므로 0으로 설정하거나 무시됨
        review_text: feedbackText, // 👈 [중요] Python은 'review_text'로 받음
        eta: 0.05
    };

    const aiResponse = await fetch(`${process.env.AI_SERVER_URL}/api/v1/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(payload),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Feedback Error:", errText);
      throw new Error(`AI 서버 통신 실패: ${aiResponse.status}`);
    }

    // 👈 [중요] Python은 { updated_weights: ... }가 아니라 가중치 객체를 바로 반환함
    const newWeights = await aiResponse.json(); 
    
    // --- [STEP 3] DB 업데이트 ---
    if (newWeights) {
      console.log("🔄 피드백 반영 가중치 업데이트:", newWeights);

      const updatePayload = {
        pref_schedule: newWeights.w_sleep,
        pref_smoke: newWeights.w_smoke,
        pref_habit: newWeights.w_sleep_habit,
        pref_temp: newWeights.w_hvac,
        pref_cleanliness: newWeights.w_clean_cycle,
        pref_noise: newWeights.w_noise,
        pref_drink: newWeights.w_outing, 
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("user_personas")
        .update(updatePayload)
        .eq("user_id", userId);

      if (updateError) {
        throw new Error("DB 업데이트 실패");
      }
    }

    return NextResponse.json({ success: true, message: "피드백이 반영되었습니다." });

  } catch (error: any) {
    console.error("피드백 처리 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}