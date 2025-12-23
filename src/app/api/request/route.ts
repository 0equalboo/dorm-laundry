import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, receiverId, message, contactInfo } = body;

    // 이미 신청한 적 있는지 확인 (중복 신청 방지)
    const { data: existing } = await supabase
      .from("matches")
      .select("*")
      .eq("sender_id", senderId)
      .eq("receiver_id", receiverId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "이미 신청을 보냈습니다." }, { status: 400 });
    }

    // 매칭 신청 저장
    const { error } = await supabase.from("matches").insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
      message: `[연락처: ${contactInfo}] ${message}`, // 연락처와 메시지 합쳐서 저장
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}