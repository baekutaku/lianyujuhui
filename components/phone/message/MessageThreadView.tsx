type ThreadMessage = {
  side: "left" | "right";
  text: string;
};

type MessageThreadViewProps = {
  avatarUrl: string;
  messages: ThreadMessage[];
};

export default function MessageThreadView({
  avatarUrl,
  messages,
}: MessageThreadViewProps) {
  return (
    <>
      <div className="thread-wrap">
        <div className="thread-date">오늘</div>

        {messages.map((message, index) => (
          <div key={index} className={`thread-row ${message.side}`}>
            {message.side === "left" ? (
              <img src={avatarUrl} alt="" className="thread-mini-avatar" />
            ) : null}

            <div className="thread-bubble">{message.text}</div>
          </div>
        ))}
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