const loadingMessages = [
  "Accessing Memory...",
  "Syncing Phone Data...",
  "Loading Archive...",
];

export default function Loading() {
  return (
    <div className="archive-loading-screen">
      <div className="archive-loading-panel">
        <div className="archive-loading-title">
          연모고 동창회 / Baiqi Archive
        </div>

        <div className="archive-loading-bar">
          <div className="archive-loading-bar-fill" />
        </div>

        <div className="archive-loading-messages">
          {loadingMessages.map((message, index) => (
            <div
              key={message}
              className="archive-loading-message"
              style={{ animationDelay: `${index * 0.22}s` }}
            >
              {message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}