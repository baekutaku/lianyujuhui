"use client";

import { useMemo, useState } from "react";
import { parseMomentBulk } from "@/lib/admin/phoneBulkParsers";

export default function MomentBulkInput() {
  const [raw, setRaw] = useState("");

  const parsed = useMemo(() => {
    try {
      return parseMomentBulk(raw);
    } catch {
      return [];
    }
  }, [raw]);

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={22}
        placeholder="모멘트 붙여넣기"
        style={{ width: "100%", padding: "16px", fontFamily: "monospace" }}
      />

      <div className="archive-card">
        <strong>posts: {parsed.length}</strong>
        <pre style={{ marginTop: "12px", overflowX: "auto", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(parsed, null, 2)}
        </pre>
      </div>
    </div>
  );
}