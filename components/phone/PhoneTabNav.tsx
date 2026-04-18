import Link from "next/link";

const tabs = [
  {
    href: "/phone-items/messages",
    label: "메시지",
    icon: "/images/phone/message-before.png",
    activeIcon: "/images/phone/message-after.png",
    width: 35,
    height: 35,
  },
  {
    href: "/phone-items/moments",
    label: "모멘트",
    icon: "/images/phone/moment-before.png",
    activeIcon: "/images/phone/moment-after.png",
    width: 40,
    height: 40,
  },
  {
    href: "/phone-items/calls",
    label: "음성",
    icon: "/images/phone/call-before.png",
    activeIcon: "/images/phone/call-after.png",
    width: 30,
    height: 30,
  },
  {
    href: "/phone-items/articles",
    label: "핫이슈",
    icon: "/images/phone/articles-before.png",
    activeIcon: "/images/phone/articles-after.png",
    width: 40,
    height: 30,
  },
  {
    href: "/phone-items/me",
    label: "나",
    icon: "/images/phone/me-before.png",
    activeIcon: "/images/phone/me-after.png",
    width: 35,
    height: 35,
  },
] as const;

type Props = {
  currentPath: string;
};

export default function PhoneTabNav({ currentPath }: Props) {
  return (
    <nav className="phone-tabbar">
      {tabs.map((tab) => {
        const active = currentPath === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`phone-tab ${active ? "active" : ""}`}
          >
            <span className="phone-tab-icon-wrap">
              <img
                src={active ? tab.activeIcon : tab.icon}
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