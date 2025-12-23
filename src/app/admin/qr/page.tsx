"use client";

import { QRCodeSVG } from "qrcode.react";

export default function QRGenPage() {
  // 🚨 중요: 배포 후에는 이 주소를 실제 배포 도메인(https://...)으로 바꿔야 작동합니다.
  // 로컬 테스트용: "http://localhost:3000"
  const BASE_URL = "https://dorm-laundry-pi.vercel.app"; 
  
  // 남자 기숙사 (ID 1~12)
  const maleMachines = Array.from({ length: 12 }, (_, i) => i + 1);
  // 여자 기숙사 (ID 13~24)
  const femaleMachines = Array.from({ length: 12 }, (_, i) => i + 13);

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <div className="max-w-2xl mx-auto text-center mb-8 print:hidden">
        <h1 className="text-3xl font-bold mb-2">🖨️ 세탁기 QR 코드 출력</h1>
        <p className="text-gray-500">Ctrl + P (맥은 Cmd + P)를 눌러 인쇄하세요.</p>
      </div>
      
      <div className="space-y-12">
        {/* 남자 구역 */}
        <section className="break-after-page">
          <h2 className="text-2xl font-bold text-blue-600 mb-6 border-b-2 border-blue-600 pb-2 text-center print:text-black">
            남자 기숙사 (Male Zone)
          </h2>
          {/* 한 줄로 정렬 (flex-col) */}
          <div className="flex flex-col gap-8 items-center">
            {maleMachines.map((id) => (
              <div 
                key={id} 
                className="flex flex-col items-center border-2 border-dashed border-gray-300 p-8 rounded-xl w-full max-w-sm break-inside-avoid"
              >
                <div className="font-black text-2xl mb-4 bg-blue-100 px-4 py-1 rounded-full text-blue-800 print:bg-transparent print:text-black">
                  {id <= 8 ? `세탁기 ${id}번` : `건조기 ${id-8}번`}
                </div>
                
                <QRCodeSVG 
                  value={`${BASE_URL}/laundry/action?id=${id}`} 
                  size={200} // 사이즈를 좀 더 키워서 찍기 편하게 함
                  level={"H"}
                  includeMargin={true}
                />
                
                <p className="text-sm text-gray-400 mt-4 font-mono">ID: {id}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 여자 구역 */}
        <section>
          <h2 className="text-2xl font-bold text-pink-500 mb-6 border-b-2 border-pink-500 pb-2 text-center print:text-black">
            여자 기숙사 (Female Zone)
          </h2>
          {/* 한 줄로 정렬 (flex-col) */}
          <div className="flex flex-col gap-8 items-center">
            {femaleMachines.map((id) => (
              <div 
                key={id} 
                className="flex flex-col items-center border-2 border-dashed border-gray-300 p-8 rounded-xl w-full max-w-sm break-inside-avoid"
              >
                <div className="font-black text-2xl mb-4 bg-pink-100 px-4 py-1 rounded-full text-pink-800 print:bg-transparent print:text-black">
                  {id <= 20 ? `세탁기 ${id-12}번` : `건조기 ${id-20}번`}
                </div>
                
                <QRCodeSVG 
                  value={`${BASE_URL}/laundry/action?id=${id}`} 
                  size={200}
                  level={"H"}
                  includeMargin={true}
                />
                
                <p className="text-sm text-gray-400 mt-4 font-mono">ID: {id}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}