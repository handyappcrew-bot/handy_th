import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

type MemberType = "owner" | "employee";

interface CardProps {
  type: MemberType;
  iconSrc: string;
  title: string;
  description: string;
  selected: boolean;
  onSelect: (type: MemberType) => void;
}

const TypeCard = ({ type, iconSrc, title, description, selected, onSelect }: CardProps) => {
  const containerStyle: React.CSSProperties = selected
    ? { borderColor: '#7488FE', backgroundColor: '#EEF2FF' }
    : { borderColor: '#DBDCDF', backgroundColor: '#FFFFFF' };

  const titleColor = selected ? '#7488FE' : '#19191B';

  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className="pressable w-full rounded-2xl border-2 px-5 py-5 text-left transition-colors"
      style={containerStyle}
      aria-pressed={selected}
    >
      <div className="flex items-center gap-4">
        <img
          src={iconSrc}
          alt=""
          aria-hidden="true"
          width={76}
          height={76}
          draggable={false}
          className="flex-shrink-0"
        />
        <div className="flex-1">
          <p
            className="text-[18px] font-bold mb-1"
            style={{ color: titleColor, letterSpacing: '-0.02em' }}
          >
            {title}
          </p>
          <p
            className="text-[14px] whitespace-pre-line"
            style={{ color: '#70737B', letterSpacing: '-0.02em', lineHeight: 1.4 }}
          >
            {description}
          </p>
        </div>
      </div>
    </button>
  );
};

const MemberTypePage = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<MemberType | null>(null);

  const handleNext = () => {
    if (!selected) return;
    if (selected === "owner") navigate("/owner/business-verify");
    else navigate("/employee/business-verify");
  };

  return (
    <PageLayout
      hideBackButton
      title={
        <>
          <h2 className="text-[22px] font-bold leading-tight text-foreground">회원 유형을</h2>
          <h2 className="text-[22px] font-bold leading-tight text-foreground">선택해 주세요</h2>
        </>
      }
      subtitle="서비스 이용을 위해 회원 유형을 선택해 주세요"
      bottom={
        <button
          onClick={handleNext}
          disabled={!selected}
          className={`pressable w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${selected
            ? "bg-primary text-primary-foreground"
            : "btn-disabled"
            }`}
        >
          다음
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <TypeCard
          type="owner"
          iconSrc="/images/icon/owner.png"
          title="사장 회원"
          description={"핸디에 매장을 등록하실\n사장님이라면 선택해 주세요"}
          selected={selected === "owner"}
          onSelect={setSelected}
        />
        <TypeCard
          type="employee"
          iconSrc="/images/icon/staff.png"
          title="직원 회원"
          description={"핸디를 사용중인 매장의\n직원이라면 선택해 주세요"}
          selected={selected === "employee"}
          onSelect={setSelected}
        />
      </div>
    </PageLayout>
  );
};

export default MemberTypePage;
