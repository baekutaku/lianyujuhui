import {
  addMakerCustomProfile,
  deleteMakerCustomProfile,
  resetMakerProfileImage,
  selectMakerProfileImage,
  updateMakerDisplayName,
} from "@/lib/maker/profile-actions";

type BaseProfileRow = {
  id: string;
  image_url: string;
};

type CustomProfileRow = {
  id: string;
  image_url: string;
};

type Props = {
  displayName: string;
  avatarUrl: string;
  baseProfileOptions: BaseProfileRow[];
  customProfileOptions: CustomProfileRow[];
  selectedSourceType: "option" | "custom" | null;
  selectedSourceId: string | null;
  messageCount: number;
  momentCount: number;
};

export default function MakerProfileScreen({
  displayName,
  avatarUrl,
  baseProfileOptions,
  customProfileOptions,
  selectedSourceType,
  selectedSourceId,
  messageCount,
  momentCount,
}: Props) {
  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <section className="archive-card" style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            display: "grid",
            justifyItems: "center",
            gap: 10,
            textAlign: "center",
          }}
        >
          <img
            src={avatarUrl}
            alt={displayName}
            style={{
              width: 110,
              height: 110,
              borderRadius: 999,
              objectFit: "cover",
              border: "1px solid rgba(0,0,0,0.08)",
              background: "#fff",
            }}
          />
          <div style={{ fontSize: 22, fontWeight: 800 }}>{displayName}</div>
          <div className="meta-row" style={{ justifyContent: "center" }}>
            <span className="meta-pill">메세지 {messageCount}</span>
            <span className="meta-pill">모멘트 {momentCount}</span>
          </div>
        </div>

        <form action={updateMakerDisplayName} className="form-grid">
          <label className="form-field form-field-full">
            <span>이름 변경</span>
            <input
              name="displayName"
              defaultValue={displayName}
              placeholder="이름 입력"
            />
          </label>
          <button type="submit" className="primary-button">
            이름 저장
          </button>
        </form>
      </section>

      <section className="archive-card" style={{ display: "grid", gap: 12 }}>
        <strong>기본 프사</strong>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {baseProfileOptions.map((item) => {
            const isSelected =
              selectedSourceType === "option" && selectedSourceId === item.id;

            return (
              <form key={item.id} action={selectMakerProfileImage}>
                <input type="hidden" name="sourceType" value="option" />
                <input type="hidden" name="sourceId" value={item.id} />
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    borderRadius: 16,
                    border: isSelected
                      ? "2px solid #7ea7c9"
                      : "1px solid rgba(0,0,0,0.08)",
                    background: "#fff",
                    padding: 10,
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={item.image_url}
                    alt=""
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderRadius: 12,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </button>
              </form>
            );
          })}
        </div>

        <form action={resetMakerProfileImage}>
          <button type="submit" className="nav-link">
            기본 유연 프사로 초기화
          </button>
        </form>
      </section>

      <section className="archive-card" style={{ display: "grid", gap: 12 }}>
        <strong>커스텀 프사 추가</strong>

        <form action={addMakerCustomProfile} className="form-grid">
          <label className="form-field form-field-full">
            <span>이미지 주소</span>
            <input
              name="imageUrl"
              placeholder="https://... 또는 /images/..."
            />
          </label>
          <button type="submit" className="primary-button">
            커스텀 프사 저장
          </button>
        </form>

        {customProfileOptions.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {customProfileOptions.map((item) => {
              const isSelected =
                selectedSourceType === "custom" &&
                selectedSourceId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    border: isSelected
                      ? "2px solid #7ea7c9"
                      : "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 16,
                    background: "#fff",
                    padding: 10,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <img
                    src={item.image_url}
                    alt=""
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderRadius: 12,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  <form action={selectMakerProfileImage}>
                    <input type="hidden" name="sourceType" value="custom" />
                    <input type="hidden" name="sourceId" value={item.id} />
                    <button
                      type="submit"
                      className="nav-link"
                      style={{ width: "100%" }}
                    >
                      선택
                    </button>
                  </form>

                  <form action={deleteMakerCustomProfile}>
                    <input type="hidden" name="customId" value={item.id} />
                    <button
                      type="submit"
                      className="nav-link"
                      style={{
                        width: "100%",
                        color: "#8c4d4d",
                        borderColor: "#e8caca",
                        background: "#fff7f7",
                      }}
                    >
                      삭제
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="phone-empty" style={{ padding: 0 }}>
            아직 추가한 커스텀 프사가 없음
          </div>
        )}
      </section>
    </div>
  );
}