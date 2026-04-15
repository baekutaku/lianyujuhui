"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Track = {
  id: string;
  title: string;
  artist: string;
  src: string;
  cover: string;
};

const tracks: Track[] = [
  {
    id: "track-1",
    title: "소리없는 고백",
    artist: "VK.",
    src: "/audio/00-소리없는-고백.mp3",
    cover: "/images/music/00-소리없는-고백.png",
  },
  {
    id: "track-2",
    title: "푸른 온도",
    artist: "VK.",
    src: "/audio/01-푸른-온도.mp3",
    cover: "/images/music/01-푸른-온도.jpg",
  },

  {
    id: "track-3",
    title: "시간 사이",
    artist: "VK.",
    src: "/audio/02-시간-사이.mp3",
    cover: "/images/music/02-시간-사이.jpg",
  },

   {
    id: "track-4",
    title: "어둠 속 불꽃",
    artist: "VK.",
    src: "/audio/03-어둠-속-불꽃.mp3",
    cover: "/images/music/03-어둠-속-불꽃.jpg",
  },

  {
    id: "track-5",
    title: "달콤한 공범",
    artist: "VK.",
    src: "/audio/04-달콤한-공범.mp3",
    cover: "/images/music/04-달콤한-공범.jpg",
  },

   {
    id: "track-6",
    title: "천둥과 번개",
    artist: "VK.",
    src: "/audio/05-천둥과-번개.mp3",
    cover: "/images/music/05-천둥과-번개.jpg",
  },

   {
    id: "track-7",
    title: "마음을 빼앗긴 연가",
    artist: "VK.",
    src: "/audio/06-마음을-빼앗긴-연가.mp3",
    cover: "/images/music/06-마음을-빼앗긴-연가.jpg",
  },

   {
    id: "track-8",
    title: "사랑의 입맞춤",
    artist: "VK.",
    src: "/audio/07-사랑의-입맞춤.mp3",
    cover: "/images/music/07-사랑의-입맞춤.jpg",
  },
];

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const AUTOPLAY_KEY = "baiqi_music_autoplay_enabled";

export default function MiniMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isSeeking, setIsSeeking] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);

  const currentTrack = tracks[trackIndex];

  useEffect(() => {
    const saved = window.localStorage.getItem(AUTOPLAY_KEY);
    setAutoplayEnabled(saved === "true");
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onTimeUpdate = () => {
      if (!isSeeking) setCurrentTime(audio.currentTime || 0);
    };

    const onEnded = () => {
      setTrackIndex((prev) => (prev >= tracks.length - 1 ? 0 : prev + 1));
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [isSeeking]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = currentTrack.src;
    audio.load();
    setCurrentTime(0);
    setDuration(0);

    if (autoplayEnabled) {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    } else {
      setIsPlaying(false);
    }
  }, [trackIndex, autoplayEnabled, currentTrack]);

  const progressPercent = useMemo(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const enableAutoplay = () => {
    window.localStorage.setItem(AUTOPLAY_KEY, "true");
    setAutoplayEnabled(true);
  };

  const disableAutoplay = () => {
    window.localStorage.setItem(AUTOPLAY_KEY, "false");
    setAutoplayEnabled(false);
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
      if (!autoplayEnabled) enableAutoplay();
    } catch {
      setIsPlaying(false);
    }
  };

  const prevTrack = () => {
    setTrackIndex((prev) => (prev <= 0 ? tracks.length - 1 : prev - 1));
  };

  const nextTrack = () => {
    setTrackIndex((prev) => (prev >= tracks.length - 1 ? 0 : prev + 1));
  };

  const commitSeek = (next: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = next;
    setCurrentTime(next);
    setIsSeeking(false);
  };

  return (
  <div className="music-widget-player">
    <audio ref={audioRef} preload="metadata" />

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