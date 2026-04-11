"use client";

import { useMemo, useState } from "react";
import { parseMessageBulk } from "@/lib/admin/phoneBulkParsers";

export default function MessageBulkInput() {
  const [raw, setRaw] = useState("");

  const parsed = useMemo(() => {
    try {
      return parseMessageBulk(raw);
    } catch {
      return null;
    }
  }, [raw]);

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={18}
        placeholder="메시지 붙여넣기"
        style={{ width: "100%", padding: "16px", fontFamily: "monospace" }}
      />

      {parsed ? (
        <div className="archive-card" style={{ whiteSpace: "pre-wrap" }}>
          <div>entries: {parsed.length}</div>
          <pre style={{ marginTop: "12px", overflowX: "auto" }}>
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}