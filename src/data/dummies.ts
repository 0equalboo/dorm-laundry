// src/data/dummies.ts

export const dummyProfiles = [
  // --- PAGE 1 ---
  {
    id: "dummy-1",
    nickname: "도서관지박령 📚",
    gender: "male", // 성별은 보여주기용 (실제 로직에선 사용자 성별에 맞춰 필터링한다고 가정)
    smoke: false,
    sleep_time_val: 0.1, // 밤 10시 취침 (아침형)
    wake_time_val: 0.1,  // 아침 6시 기상
    clean_cycle_val: 0.8, // 깔끔함
    outing_val: 0.2, // 집순이/집돌이
    intro: "시험기간엔 기숙사에 거의 없어요. 조용히 지내요."
  },
  {
    id: "dummy-2",
    nickname: "새벽롤장인 🎮",
    gender: "male",
    smoke: true,
    sleep_time_val: 0.9, // 새벽 4시 취침 (올빼미)
    wake_time_val: 0.9,  // 오후 1시 기상
    clean_cycle_val: 0.2, // 좀 더러움
    outing_val: 0.1, // 방에서 게임만 함
    intro: "키보드 소리 좀 날 수 있어요. 같이 듀오 하실 분?"
  },
  {
    id: "dummy-3",
    nickname: "매일배달파티 🍕",
    gender: "male",
    smoke: false,
    sleep_time_val: 0.5, // 1시쯤
    wake_time_val: 0.5,  // 9시쯤
    clean_cycle_val: 0.4, // 보통
    outing_val: 0.5, 
    intro: "야식 같이 드실 분 환영합니다! 혼밥 싫어요."
  },
  {
    id: "dummy-4",
    nickname: "3대500 헬창 💪",
    gender: "male",
    smoke: false,
    sleep_time_val: 0.2, // 11시 취침
    wake_time_val: 0.2,  // 7시 기상 (운동감)
    clean_cycle_val: 0.9, // 매우 깔끔 (단백질 파우더 날림 싫어함)
    outing_val: 0.8, // 헬스장 가느라 방에 없음
    intro: "근손실 오기 전에 자야합니다. 소등 철저."
  },
  {
    id: "dummy-5",
    nickname: "술톤 🍺",
    gender: "male",
    smoke: true,
    sleep_time_val: 0.8, // 새벽 3시
    wake_time_val: 0.8, // 12시 기상
    clean_cycle_val: 0.3, // 정리 잘 안함
    outing_val: 0.9, // 매일 술약속
    intro: "인생 뭐 있나요~ 기숙사는 잠만 자는 곳이죠."
  },
  // --- PAGE 2 ---
  {
    id: "dummy-6",
    nickname: "ASMR 장인 🤫",
    gender: "male",
    smoke: false,
    sleep_time_val: 0.4, 
    wake_time_val: 0.4, 
    clean_cycle_val: 0.6,
    outing_val: 0.3,
    intro: "소음에 예민해요. 이어폰 필수입니다."
  },
  {
    id: "dummy-7",
    nickname: "향기테라피 🌸",
    gender: "male",
    smoke: false,
    sleep_time_val: 0.5,
    wake_time_val: 0.5,
    clean_cycle_val: 1.0, // 결벽증 수준
    outing_val: 0.5,
    intro: "방에서 항상 좋은 향기가 났으면 좋겠어요. 청소 당번 철저!"
  },
  {
    id: "dummy-8",
    nickname: "넷플릭스중독 📺",
    gender: "male",
    smoke: false,
    sleep_time_val: 0.7, // 새벽 2시
    wake_time_val: 0.7, // 11시
    clean_cycle_val: 0.5, 
    outing_val: 0.2, 
    intro: "드라마 정주행하느라 밤 샐 때가 많아요."
  },
  {
    id: "dummy-9",
    nickname: "풀소유 맥시멀 🛍️",
    gender: "male",
    smoke: false,
    sleep_time_val: 0.5,
    wake_time_val: 0.5,
    clean_cycle_val: 0.3, // 짐이 많아서 어수선
    outing_val: 0.6,
    intro: "택배가 좀 많이 와요.. 짐 둘 공간이 필요해요."
  },
  {
    id: "dummy-10",
    nickname: "유령회원 👻",
    gender: "male",
    smoke: false,
    sleep_time_val: 0.5,
    wake_time_val: 0.5,
    clean_cycle_val: 0.5,
    outing_val: 1.0, // 방에 아예 안 들어옴
    intro: "기숙사비 냈는데 집이 가까워서 잘 안 와요."
  }
];