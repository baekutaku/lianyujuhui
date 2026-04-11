import Link from "next/link";

const tabs = [
  {
    href: "/phone-items/messages",
    label: "메시지",
    icon: "chat_bubble",
  },
  {
    href: "/phone-items/moments",
    label: "모멘트",
    icon: "local_florist",
  },
  {
    href: "/phone-items/calls",
    label: "음성",
    icon: "volume_up",
  },
  {
    href: "/phone-items/articles",
    label: "핫이슈",
    icon: "feed",
  },
  {
    href: "/phone-items/me",
    label: "나",
    icon: "person",
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
              <span className="material-symbols-rounded phone-tab-icon">
                {tab.icon}
              </span>
            </span>
            <span className="phone-tab-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}