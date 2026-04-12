import { ReactNode } from "react";

type PhoneShellProps = {
  children: ReactNode;
};

export default function PhoneShell({ children }: PhoneShellProps) {
  return (
    <section
      style={{
        width: "100%",
        maxWidth: 470,
        height: "min(94vh, 1000px)",
        minHeight: 880,
        margin: "0 auto",
        borderRadius: 34,
        overflow: "hidden",
        background: "#f8f5f8",
        boxShadow: "0 18px 40px rgba(120, 110, 130, 0.14)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {children}
    </section>
  );
}