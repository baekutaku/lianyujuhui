import { ReactNode } from "react";

type PhoneShellProps = {
  children: ReactNode;
};

export default function PhoneShell({ children }: PhoneShellProps) {
  return (
    <section className="phone-shell-wrap">
      <div className="phone-shell-backdrop" aria-hidden="true" />
      <section className="phone-shell">
        <div className="phone-shell-inner">{children}</div>
      </section>
    </section>
  );
}