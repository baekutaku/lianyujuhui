type PhoneContentAdminPanelProps = {
  title: string;
  subtype: string;
  isPublished?: boolean;
  editHref: string;
  newHref?: string;
  onDelete?: () => void;
};

export default function PhoneContentAdminPanel({
  title,
  subtype,
  isPublished,
  editHref,
  newHref,
  onDelete,
}: PhoneContentAdminPanelProps) {
  return (
    <div className="phone-admin-card">
      <div className="phone-admin-eyebrow">PHONE CONTENT ADMIN</div>
      <h2 className="phone-admin-title">{title}</h2>

      <div className="phone-admin-meta">
        <span className="phone-admin-pill">type: {subtype}</span>
        <span className="phone-admin-pill">
          {isPublished ? "공개" : "비공개"}
        </span>
      </div>

      <div className="phone-admin-actions">
        <a href={editHref} className="phone-admin-button primary">
          수정
        </a>

        {newHref ? (
          <a href={newHref} className="phone-admin-button">
            새로 추가
          </a>
        ) : null}

        <button
          type="button"
          className="phone-admin-button danger"
          onClick={onDelete}
        >
          삭제
        </button>
      </div>

      <div className="phone-admin-section">
        <div className="phone-admin-section-title">연결</div>
        <p className="phone-admin-text">
          관련 카드 / 스토리 / 이벤트 / 휴대폰 콘텐츠 연결 예정
        </p>
      </div>

      <div className="phone-admin-section">
        <div className="phone-admin-section-title">주의</div>
        <p className="phone-admin-text">
          삭제는 바로 실행하지 말고 확인 모달 후 처리.
          가능하면 완전삭제보다 비공개 전환 우선.
        </p>
      </div>
    </div>
  );
}