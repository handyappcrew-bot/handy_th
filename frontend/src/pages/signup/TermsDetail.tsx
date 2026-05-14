import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

const TERMS_CONTENT: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  service: {
    title: "서비스 이용약관",
    sections: [
      {
        heading: "제1조 (목적)",
        body: "본 약관은 Handy Staff App(이하 \"회사\")이 제공하는 근태/급여/매출 관리 서비스(이하 \"서비스\") 이용과 관련하여 회사와 회원의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.",
      },
      {
        heading: "제2조 (용어의 정의)",
        body: "\"회원\"이란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자를 말합니다. \"매장\"이란 사장 회원이 등록하여 직원 관리 단위로 사용하는 사업장을 말합니다.",
      },
      {
        heading: "제3조 (약관의 효력 및 변경)",
        body: "본 약관은 회원가입 시 동의함으로써 효력이 발생하며, 회사는 관련 법령을 준수하는 범위 내에서 본 약관을 변경할 수 있습니다.",
      },
      {
        heading: "제4조 (회원의 의무)",
        body: "회원은 본 약관과 관계 법령에서 정한 사항을 준수하여야 하며, 타인의 정보를 도용하거나 서비스 운영을 방해하는 행위를 하여서는 안 됩니다.",
      },
    ],
  },
  privacy: {
    title: "개인정보 수집 · 이용 동의",
    sections: [
      {
        heading: "1. 수집 항목",
        body: "회사는 서비스 제공을 위하여 다음의 개인정보를 수집합니다: 휴대폰 번호, 이름, 생년월일, 성별, 프로필 사진(선택).",
      },
      {
        heading: "2. 수집 및 이용 목적",
        body: "회원 식별 및 본인 확인, 서비스 제공 및 운영, 근태/급여 기록 관리, 고객 문의 응대.",
      },
      {
        heading: "3. 보유 및 이용 기간",
        body: "회원 탈퇴 시까지 보유하며, 탈퇴 후 30일이 경과하면 모든 개인정보를 영구 삭제합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관됩니다.",
      },
      {
        heading: "4. 동의 거부 권리 및 불이익",
        body: "이용자는 개인정보 수집·이용 동의를 거부할 권리가 있으나, 거부 시 회원가입 및 서비스 이용이 제한됩니다.",
      },
    ],
  },
  thirdParty: {
    title: "개인정보 제 3자 제공 동의",
    sections: [
      {
        heading: "1. 제공받는 자",
        body: "회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 다만, 서비스 제공에 반드시 필요한 경우 아래의 제3자에게 제공할 수 있습니다.",
      },
      {
        heading: "2. 제공 목적",
        body: "결제 처리(PG사), 본인 확인(SMS 인증 사업자), 클라우드 인프라(Cloud Provider).",
      },
      {
        heading: "3. 제공 항목",
        body: "휴대폰 번호, 이름, 생년월일.",
      },
      {
        heading: "4. 보유 기간",
        body: "위 제3자 제공 목적 달성 시까지 또는 회원 탈퇴 시까지.",
      },
    ],
  },
  location: {
    title: "위치 정보 이용 동의",
    sections: [
      {
        heading: "1. 위치 정보 수집 항목",
        body: "회원의 단말기에서 수집되는 위치 정보(GPS 신호, Wi-Fi 접속 정보 등).",
      },
      {
        heading: "2. 이용 목적",
        body: "매장 출퇴근 인증, GPS 반경 기반 출근 가능 여부 판단.",
      },
      {
        heading: "3. 위치 정보 보유 기간",
        body: "출퇴근 기록 목적 달성 시 즉시 파기 또는 회원 탈퇴 시까지.",
      },
      {
        heading: "4. 동의 거부 시 불이익",
        body: "위치 정보 동의를 거부하면 GPS 반경 기반 출퇴근 인증 기능 사용이 제한됩니다.",
      },
    ],
  },
};

const TermsDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const term = (id && TERMS_CONTENT[id]) || null;

  if (!term) {
    return (
      <PageLayout headerTitle="약관" title="약관을 찾을 수 없어요" onBack={() => navigate(-1)}>
        <p className="text-[14px] text-muted-foreground">요청하신 약관이 존재하지 않습니다.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      headerTitle={term.title}
      title={
        <h2 className="text-[22px] font-bold leading-tight text-foreground">{term.title}</h2>
      }
      onBack={() => navigate(-1)}
    >
      <div className="flex flex-col gap-5 pb-10">
        {term.sections.map((section, idx) => (
          <section key={idx}>
            <h3 className="text-[16px] font-semibold text-foreground mb-2">{section.heading}</h3>
            <p className="text-[14px] leading-relaxed text-muted-foreground whitespace-pre-line">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </PageLayout>
  );
};

export default TermsDetail;
