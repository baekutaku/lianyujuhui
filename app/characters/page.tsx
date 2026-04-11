import Link from "next/link";

const CHARACTERS = [
  {
    key: "baiqi",
    label: "백기",
    subtitle: "Baiqi Archive",
    affinity: 51,
  },
  {
    key: "lizeyan",
    label: "이택언",
    subtitle: "Lizeyan Archive",
    affinity: 43,
  },
  {
    key: "zhouqiluo",
    label: "주기락",
    subtitle: "Zhou Qiluo Archive",
    affinity: 41,
  },
  {
    key: "xumo",
    label: "허묵",
    subtitle: "Xumo Archive",
    affinity: 40,
  },
  {
    key: "lingxiao",
    label: "연시호",
    subtitle: "Lingxiao Archive",
    affinity: 17,
  },
];

export default function CharactersIndexPage() {
  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Characters</div>
        <h1 className="page-title">캐릭터 허브</h1>
        <p className="page-desc">
          남주별 카드, 스토리, 휴대폰 기록을 캐릭터 기준으로 모아봅니다.
        </p>
      </header>

      <section className="quick-grid">
        {CHARACTERS.map((character) => (
          <Link
            key={character.key}
            href={`/characters/${character.key}`}
            className="quick-card"
          >
            <span className="quick-card-label">{character.subtitle}</span>
            <h2 className="quick-card-title">{character.label}</h2>
            <p className="quick-card-text">
              호감도 {character.affinity} · 카드 / 스토리 / 휴대폰 허브로 이동
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}