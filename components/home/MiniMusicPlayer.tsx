"use client";

import { useMemo } from "react";
import { useGlobalMusic } from "@/components/music/GlobalMusicProvider";

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MiniMusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    autoplayEnabled,
    setVolume,
    setCurrentTime,
    setIsSeeking,
    commitSeek,
    togglePlay,
    prevTrack,
    nextTrack,
    enableAutoplay,
    disableAutoplay,
  } = useGlobalMusic();

  const progressPercent = useMemo(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  return (
    <div className="music-widget-player">
      <div className="music-widget-card">
        <div className="music-widget-card-top">
          <span className="music-widget-now">Playing now</span>

          <button
            type="button"
            className={`music-widget-toggle ${autoplayEnabled ? "is-on" : ""}`}
            onClick={() => {
              if (autoplayEnabled) disableAutoplay();
              else enableAutoplay();
            }}
          >
            자동재생 {autoplayEnabled ? "ON" : "OFF"}
          </button>
        </div>

        <div className="music-widget-disc-row">
          <div className={`music-widget-vinyl ${isPlaying ? "is-spinning" : ""}`}>
            <div className="music-widget-vinyl-disc">
              <img
                src={currentTrack.cover}
                alt={currentTrack.title}
                className="music-widget-vinyl-cover"
              />
            </div>
            <div className="music-widget-vinyl-center" />
          </div>

          <div className="music-widget-volume">
            <span className="music-widget-volume-label">VOL</span>
            <input
              className="music-widget-volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="볼륨"
            />
          </div>
        </div>

        <div className="music-widget-meta">
          <strong className="music-widget-title-text">{currentTrack.title}</strong>
          <span className="music-widget-artist">{currentTrack.artist}</span>
        </div>

        <div className="music-widget-progress">
          <span>{formatTime(currentTime)}</span>

          <div className="music-widget-progress-track">
            <div
              className="music-widget-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
            <input
              className="music-widget-progress-input"
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onMouseDown={() => setIsSeeking(true)}
              onTouchStart={() => setIsSeeking(true)}
              onChange={(e) => setCurrentTime(Number(e.target.value))}
              onMouseUp={(e) =>
                commitSeek(Number((e.target as HTMLInputElement).value))
              }
              onTouchEnd={() => commitSeek(currentTime)}
              aria-label="재생 위치"
            />
          </div>

          <span>{formatTime(duration)}</span>
        </div>

        <div className="music-widget-controls">
          <button
            type="button"
            className="music-widget-icon-btn"
            onClick={prevTrack}
            aria-label="이전 곡"
          >
            ‹‹
          </button>

          <button
            type="button"
            className="music-widget-play-btn"
            onClick={togglePlay}
            aria-label={isPlaying ? "일시정지" : "재생"}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>

          <button
            type="button"
            className="music-widget-icon-btn"
            onClick={nextTrack}
            aria-label="다음 곡"
          >
            ››
          </button>
        </div>
      </div>
    </div>
  );
}