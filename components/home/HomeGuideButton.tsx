"use client";

import { useState } from "react";

export default function HomeGuideButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="hero-primary-button home-guide-open-button"
        onClick={() => setOpen(true)}
      >
        이용안내
      </button>

      {open ? (
        <div
          className="home-guide-backdrop"
          onClick={() => setOpen(false)}
        >
          <div
            className="home-guide-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="이용안내"
          >
            <div className="home-guide-modal-head">
              <div className="home-guide-modal-title-row">
                <span className="material-symbols-rounded home-guide-modal-icon">
                  info
                </span>
                <div>
                  <h3 className="home-guide-modal-title">이용안내</h3>
                  <p className="home-guide-modal-sub">
                    사이트 이용 전에 읽어주세요
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="home-guide-modal-close"
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="home-guide-modal-body">
              <div className="home-guide-info-box">
                <p>
                  본 아카이브 사이트는 백기유연 CP 중심 백업공간이며,
                  일부 자료는 미업로드·미번역 상태일 수 있습니다.
                  현재 사이트도 완성되어 있지는 않습니다.
                </p>

                <p>
                  비전문가가 AI를 사용해서 만든 공간이기 때문에
                  서버가 불안정해 URL 이미지 삽입이 가능한 폼을 사용하고 있습니다.
                </p>

                <p>
                  백업은 시간이 나는 대로 업로드합니다.
                  1부까지는 가능한 모든 캐릭터를 백업할 예정입니다.
                </p>

                <p>
                  참고로 <strong>휴대폰</strong> 카테고리는 프로필란에
                  이름과 프사를 바꿔서 적용시킬 수 있습니다.
                  단, 내용은 바꿀 수 없습니다.
                </p>

                <p>
                  <strong>커스텀</strong> 카테고리는 익명 분들도
                  자체 제작 가능하게 만들어놓았으며,
                  하루 정도 로그인이 유지됩니다.
                  비밀번호를 요구하는 방식은 아닙니다.
                </p>

                <p className="home-guide-info-alert">
                  단, 공식이 아닌 내용을 올리실 경우
                  공식이 아니라는 점을 반드시 명시해주세요.
                </p>
              </div>

              <button
                type="button"
                className="home-guide-confirm"
                onClick={() => setOpen(false)}
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}