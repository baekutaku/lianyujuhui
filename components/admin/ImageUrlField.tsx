"use client";

import { useMemo, useState } from "react";

type ImageUrlFieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
};

function normalizeImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed;
}

export default function ImageUrlField({
  label,
  name,
  defaultValue = "",
  placeholder,
}: ImageUrlFieldProps) {
  const [value, setValue] = useState(defaultValue);

  const previewUrl = useMemo(() => normalizeImageUrl(value), [value]);

  return (
    <label className="form-field form-field-full">
      <span>{label}</span>
      <input
        name={name}
        type="url"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />

      {previewUrl ? (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            borderRadius: "14px",
            background: "#f6f8fb",
            border: "1px solid #d9e2ef",
          }}
        >
          <img
            src={previewUrl}
            alt={label}
            style={{
              display: "block",
              width: "100%",
              maxHeight: "280px",
              objectFit: "contain",
              borderRadius: "10px",
              background: "#fff",
            }}
          />
        </div>
      ) : null}
    </label>
  );
}