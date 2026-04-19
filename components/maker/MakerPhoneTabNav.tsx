import Link from "next/link";

type TabKey = "messages" | "moments" | "me";

const tabs = [
  {
    key: "messages" as const,
    href: "/maker/messages",
    label: "메세지",
    icon: "/images/phone/message-before.png",
    activeIcon: "/images/phone/message-after.png",
    width: 35,
    height: 35,
  },
  {
    key: "moments" as const,
    href: "/maker/moments",
    label: "모멘트",
    icon: "/images/phone/moment-before.png",
    activeIcon: "/images/phone/moment-after.png",
    width: 40,
    height: 40,
  },
  {
    key: "me" as const,
    href: "/maker/me",
    label: "나",
    icon: "/images/phone/me-before.png",
    activeIcon: "/images/phone/me-after.png",
    width: 35,
    height: 35,
  },
];

export default function MakerPhoneTabNav({ active }: { active: TabKey }) {
  return (
    <nav className="phone-tabbar phone-tabbar-maker-3col">
      {tabs.map((tab) => {
        const isActive = active === tab.key;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`phone-tab ${isActive ? "active" : ""}`}
          >
            <span className="phone-tab-icon-wrap">
              <img
                src={isActive ? tab.activeIcon : tab.icon}
                alt=""
                aria-hidden="true"
                className="phone-tab-icon-image"
                style={{
                  width: tab.width,
                  height: tab.height,
                }}
              />
            </span>
            <span className="phone-tab-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}