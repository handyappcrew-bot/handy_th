import { useEffect, useState } from "react";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFaq } from "@/api/public";

const categories = ["전체", "계정", "서비스이용", "멤버십", "기타"];

type FAQItem = {
  category: string;
  question: string;
  answer: string;
};



const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  "멤버십": { bg: '#F0F7FF', color: '#4261FF' },
  "계정": { bg: '#ECFFF1', color: '#1EDC83' },
  "서비스이용": { bg: '#FDF9DF', color: '#FFB300' },
  "기타": { bg: '#F7F7F8', color: '#AAB4BF' },
};

const FAQ = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqData, setFaqData] = useState<FAQItem[]>([]);

  const filtered = activeCategory === "전체" ? faqData : faqData.filter((f) => f.category === activeCategory);

  useEffect(() => {
    const fetchFaq = async () => {
      try {
        const data = await getFaq();
        const mapped: FAQItem[] = data.map((item: any) => ({
          category: item.type,
          question: item.question,
          answer: item.answer,
        }));
        setFaqData(mapped);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFaq();
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-lg" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>자주 묻는 질문</h1>
      </div>
      <div className="border-b border-border" />

      {/* 배경 영역 */}
      <div style={{ backgroundColor: '#F7F7F8', minHeight: '100vh' }}>
        {/* 카테고리 필터 */}
        <div className="flex gap-2 px-5 pt-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button key={cat} onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
                className="flex-shrink-0 rounded-full px-3 py-1.5"
                style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '-0.02em', whiteSpace: 'nowrap', border: `1px solid ${isActive ? '#4261FF' : '#DBDCDF'}`, backgroundColor: isActive ? '#E8F3FF' : '#FFFFFF', color: isActive ? '#4261FF' : '#AAB4BF' }}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* FAQ 아이템 */}
        <div className="px-5 pb-8 flex flex-col gap-3">
          {filtered.map((item, i) => {
            const isOpen = openIndex === i;
            const catStyle = CATEGORY_COLORS[item.category] || { bg: '#F7F7F8', color: '#AAB4BF' };
            return (
              <div key={i} className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
                <button className="w-full flex items-start justify-between p-4"
                  onClick={() => setOpenIndex(isOpen ? null : i)}>
                  <div className="text-left flex-1 pr-3">
                    <span className="inline-block rounded-md px-2 py-0.5 mb-2"
                      style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '-0.02em', backgroundColor: catStyle.bg, color: catStyle.color }}>
                      {item.category}
                    </span>
                    <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', color: '#19191B', lineHeight: '1.5' }}>
                      Q. {item.question}
                    </p>
                  </div>
                  <ChevronDown className={`h-5 w-5 flex-shrink-0 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    style={{ color: '#AAB4BF' }} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4" style={{ borderTop: '1px solid #F7F7F8' }}>
                    <p className="pt-3 whitespace-pre-line"
                      style={{ fontSize: '14px', color: '#70737B', lineHeight: '1.7', letterSpacing: '-0.02em' }}>
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <span style={{ fontSize: '14px', color: '#AAB4BF' }}>해당 카테고리의 질문이 없어요.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
