import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "기숙사 룸메이트 매칭",
  description: "딱 맞는 룸메이트를 찾아보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-slate-100 flex justify-center items-center min-h-screen py-10">
        {/* 모바일 목업 프레임 */}
        <div className="w-[375px] h-[812px] bg-white shadow-2xl rounded-[40px] overflow-hidden border-[8px] border-slate-900 relative">
          
          {/* 상단 노치 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[30px] bg-slate-900 rounded-b-2xl z-50 pointer-events-none"></div>
          
          {/* 실제 앱 콘텐츠 영역 */}
          {/* [수정] pt-8 제거 -> 페이지(children)가 알아서 패딩을 줄 것입니다 */}
          <div className="h-full w-full overflow-y-auto overflow-x-hidden scrollbar-hide">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}