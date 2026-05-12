export interface Post {
  id: number;
  title: string;
  category: string;
  content: string;
  author: string;
  role: string;
  date: string;
  comments: number;
}

export const DUMMY_POSTS: Post[] = [
  { id: 1, title: "마감 시 주의사항", category: "공지사항", content: "1. 요즘 날씨가 많이 추워져서 퇴근 시에 싱크대 수도 아주 약하게 틀어주세요. (배관 어는 거...", author: "사장님", role: "", date: "2025.10.20", comments: 3 },
  { id: 2, title: "겨울시즌 신메뉴 레시피", category: "공지사항", content: "겨울 딸기시즌 신메뉴 레시피 공지합니다.\n베이스 및 토핑들 위치도 참고해주세요.", author: "사장님", role: "", date: "2025.10.19", comments: 3 },
  { id: 3, title: "발주 필요 물품", category: "비품관리", content: "곡물파우더 (반봉지 남음)\n감자빵 (2개 남음)...", author: "정수민", role: "알바생", date: "1시간 전", comments: 0 },
  { id: 4, title: "대타 구해요", category: "대타요청", content: "11월 06일 10:00~18:00 대타 가능하신 분 있나요?", author: "정수민", role: "알바생", date: "1시간 전", comments: 3 },
  { id: 5, title: "대타 구해요", category: "대타요청", content: "11월 06일 10:00~18:00 대타 가능하신 분 있나요?", author: "정수민", role: "알바생", date: "1시간 전", comments: 0 },
];

// 홈화면 매장 공지 영역용 - 공지사항 카테고리만 최신 2개
export const getStoreNotices = () =>
  DUMMY_POSTS
    .filter(p => p.category === "공지사항")
    .slice(0, 2)
    .map(p => ({
      id: String(p.id),
      author: p.author,
      timeAgo: p.date,
      content: p.content.split('\n')[0], // 첫 줄만
    }));
