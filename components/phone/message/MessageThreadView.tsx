type MessageEntry =
  | {
      type: "text";
      side: "left" | "right";
      text: string;
    }
  | {
      type: "image";
      side: "left" | "right";
      url: string;
      caption?: string;
    }
  | {
      type: "system";
      text: string;
    };

type MessageThreadViewProps = {
  avatarUrl: string;
  entries: MessageEntry[];
};

export default function MessageThreadView({
  avatarUrl,
  entries,
}: MessageThreadViewProps) {
  return (
    <>
      <div className="thread-wrap">
        {entries.map((entry, index) => {
          if (entry.type === "system") {
            return (
              <div key={index} className="thread-date">
                {entry.text}
              </div>
            );
          }

          if (entry.type === "image") {
            return (
              <div key={index} className={`thread-row ${entry.side}`}>
                {entry.side === "left" ? (
                  <img src={avatarUrl} alt="" className="thread-mini-avatar" />
                ) : null}

                <div className="thread-bubble thread-image-bubble">
                  <img
                    src={entry.url}
                    alt={entry.caption ?? "message image"}
                    className="thread-image"
                  />
                  {entry.caption ? (
                    <div className="thread-image-caption">{entry.caption}</div>
                  ) : null}
                </div>
              </div>
            );
          }

          return (
            <div key={index} className={`thread-row ${entry.side}`}>
              {entry.side === "left" ? (
                <img src={avatarUrl} alt="" className="thread-mini-avatar" />
              ) : null}

              <div className="thread-bubble">{entry.text}</div>
            </div>
          );
        })}
      </div>

      <div className="thread-toolbar">
        <button type="button" className="thread-toolbar-btn">🔊</button>
        <div className="thread-toolbar-line" />
        <button type="button" className="thread-toolbar-btn">☺</button>
        <button type="button" className="thread-toolbar-btn">＋</button>
      </div>
    </>
  );
}