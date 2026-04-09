import Link from "next/link";

const tabs = [
  { href: "/phone-items/messages", label: "메시지", icon: "💬" },
  { href: "/phone-items/moments", label: "모멘트", icon: "✿" },
  { href: "/phone-items/calls", label: "음성", icon: "🔊" },
  { href: "/phone-items/articles", label: "핫이슈", icon: "👤" },
  { href: "/phone-items/me", label: "나", icon: "👥" },
];

export default function PhoneTabNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="phone-tabbar">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`phone-tab ${currentPath === tab.href ? "active" : ""}`}
        >
          <span className="phone-tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}