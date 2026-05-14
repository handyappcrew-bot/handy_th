// 가입 신청 완료 화면. SignupCompletePage 와 동일한 중앙정렬 layout 패턴 사용.
// 헤더/뒤로가기 버튼 없음 (다음 단계 = 사장 승인 알림 대기, 즉시 종료).

const RegistrationComplete = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center px-5">
        {/* 체크 아이콘 (sign-in-check.png, 80×80) */}
        <img
          src="/images/icon/sign-in-check.png"
          alt="가입 신청 완료"
          width={80}
          height={80}
          className="mb-8"
          draggable={false}
        />

        {/* 제목 — SignupCompletePage 와 동일한 #19191B / semibold / 24 / -2% */}
        <h1
          className="text-center"
          style={{ color: '#19191B', fontWeight: 600, fontSize: '24px', letterSpacing: '-0.02em', lineHeight: 1.4 }}
        >
          작성한 회원 정보가
        </h1>
        <h1
          className="text-center"
          style={{ color: '#19191B', fontWeight: 600, fontSize: '24px', letterSpacing: '-0.02em', lineHeight: 1.4 }}
        >
          사장님에게 전달됐어요
        </h1>

        {/* 부제 — #7488FE / medium / 16 / -2% */}
        <p
          className="mt-4 text-center"
          style={{ color: '#7488FE', fontWeight: 500, fontSize: '16px', letterSpacing: '-0.02em', lineHeight: 1.6 }}
        >
          사장님이 가입 정보를 확인하고 있어요
          <br />
          승인되면 알림으로 알려드릴게요
        </p>
      </div>
    </div>
  );
};

export default RegistrationComplete;
