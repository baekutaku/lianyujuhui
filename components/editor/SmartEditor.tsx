"use client";

type Props = {
  name: string;
  initialValue?: string;
  label?: string;
  height?: string;
};

export default function SmartEditor({
  name,
  initialValue = "",
  label,
  height = "700px",
}: Props) {
  return (
    <div className="form-field form-field-full">
      {label && <span>{label}</span>}
      <textarea
        name={name}
        defaultValue={initialValue}
        rows={20}
        style={{
          width: "100%",
          minHeight: height,
          resize: "vertical",
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid #cfd8e3",
          background: "#fff",
          color: "#111",
          lineHeight: 1.6,
        }}
      />
    </div>
  );
}