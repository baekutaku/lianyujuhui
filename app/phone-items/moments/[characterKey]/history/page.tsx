import Link from "next/link";

const tabs = [
  {
    href: "/phone-items/messages",
    label: "메시지",
    icon: "/images/phone/message-before.png",
    activeIcon: "/images/phone/message-after.png",
  },
  {
    href: "/phone-items/moments",
    label: "모멘트",
    icon: "/images/phone/moment-before.png",
    activeIcon: "/images/phone/moment-after.png",
  },
  {
    href: "/phone-items/calls",
    label: "음성",
    icon: "/images/phone/call-before.png",
    activeIcon: "/images/phone/call-after.png",
  },
  {
    href: "/phone-items/articles",
    label: "핫이슈",
    icon: "/images/phone/articles-before.png",
    activeIcon: "/images/phone/articles-after.png",
  },
  {
    href: "/phone-items/me",
    label: "나",
    icon: "/images/phone/me-before.png",
    activeIcon: "/images/phone/me-after.png",
  },
];

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
              />
            </span>
            <span className="phone-tab-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}