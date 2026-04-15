const loadingMessages = [
  "Accessing Memory...",

];

export default function Loading() {
  return (
    <div className="archive-loading-screen">
      <div className="archive-loading-panel">
        <div className="archive-loading-title">
          🐺🍃💌🐰
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