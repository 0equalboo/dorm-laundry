export interface PersonaCard {
  id: number;
  tags: {
    sleep: string; smoke: string; habit: string; 
    temp: string; clean: string; drink: string; noise: string;
  };
  // 마스크 연산을 위한 이진 속성 (1: 해당 성향 강함 / 0: 해당 성향 약함 or 보통)
  attributes: {
    sleep: 0 | 1;
    smoke: 0 | 1;
    habit: 0 | 1;
    temp: 0 | 1;
    clean: 0 | 1;
    noise: 0 | 1;
    drink: 0 | 1;
  };
}

export const CALIBRATION_ROUNDS: PersonaCard[][] = [
  // --- [Round 1] ---
  [
    {
      id: 1,
      tags: { sleep: "보통", smoke: "비흡연자", habit: "잠버릇 무", temp: "적당", clean: "깔끔형", drink: "알쓰", noise: "예민해요" },
      attributes: { sleep: 0, smoke: 0, habit: 0, temp: 0, clean: 1, drink: 0, noise: 1 }
    },
    {
      id: 2,
      tags: { sleep: "새벽형", smoke: "흡연자", habit: "잠버릇 유", temp: "파워냉방", clean: "자유로운 영혼", drink: "알콜 중독자", noise: "둔해요" },
      attributes: { sleep: 1, smoke: 1, habit: 1, temp: 1, clean: 0, drink: 1, noise: 0 }
    },
    {
      id: 3,
      tags: { sleep: "보통", smoke: "비흡연자", habit: "잠버릇 유", temp: "냉방싫어요", clean: "깔끔형", drink: "알콜중독자", noise: "둔해요" },
      // 냉방싫어요도 '온도에 대한 강한 주장'이므로 1로 처리 (혹은 파워냉방만 1로 할지 결정 필요)
      attributes: { sleep: 0, smoke: 0, habit: 1, temp: 1, clean: 1, drink: 1, noise: 0 }
    }
  ],

  // --- [Round 2] ---
  [
    {
      id: 4,
      tags: { sleep: "새벽형", smoke: "비흡연자", habit: "잠버릇 무", temp: "파워냉방", clean: "깔끔형", drink: "알콜중독자", noise: "둔해요" },
      attributes: { sleep: 1, smoke: 0, habit: 0, temp: 1, clean: 1, drink: 1, noise: 0 }
    },
    {
      id: 5,
      tags: { sleep: "보통", smoke: "흡연자", habit: "잠버릇 무", temp: "파워냉방", clean: "깔끔형", drink: "알콜중독자", noise: "둔해요" },
      attributes: { sleep: 0, smoke: 1, habit: 0, temp: 1, clean: 1, drink: 1, noise: 0 }
    },
    {
      id: 6,
      tags: { sleep: "새벽형", smoke: "비흡연자", habit: "잠버릇 유", temp: "냉방싫어요", clean: "자유로운 영혼", drink: "알쓰", noise: "예민해요" },
      attributes: { sleep: 1, smoke: 0, habit: 1, temp: 1, clean: 0, drink: 0, noise: 1 }
    }
  ],

  // --- [Round 3] ---
  [
    {
      id: 7,
      tags: { sleep: "보통", smoke: "비흡연자", habit: "잠버릇 무", temp: "파워냉방", clean: "자유로운 영혼", drink: "알쓰", noise: "둔해요" },
      attributes: { sleep: 0, smoke: 0, habit: 0, temp: 1, clean: 0, drink: 0, noise: 0 }
    },
    {
      id: 8,
      tags: { sleep: "새벽형", smoke: "흡연자", habit: "잠버릇 무", temp: "적당", clean: "깔끔형", drink: "알콜중독자", noise: "예민해요" },
      attributes: { sleep: 1, smoke: 1, habit: 0, temp: 0, clean: 1, drink: 1, noise: 1 }
    },
    {
      id: 9,
      tags: { sleep: "보통", smoke: "비흡연자", habit: "잠버릇 유", temp: "냉방싫어요", clean: "깔끔형", drink: "알쓰", noise: "둔해요" },
      attributes: { sleep: 0, smoke: 0, habit: 1, temp: 1, clean: 1, drink: 0, noise: 0 }
    }
  ]
];