"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { tracks, type Track } from "@/components/music/music-tracks";

const AUTOPLAY_KEY = "baiqi_music_autoplay_enabled";
const VOLUME_KEY = "baiqi_music_volume";
const TRACK_INDEX_KEY = "baiqi_music_track_index";

function getTimeKey(trackId: string) {
  return `baiqi_music_current_time_${trackId}`;
}

function formatNumber(value: string | null, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

type MusicContextValue = {
  tracks: Track[];
  trackIndex: number;
  currentTrack: Track;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  autoplayEnabled: boolean;
  isSeeking: boolean;
  setCurrentTime: (value: number) => void;
  setIsSeeking: (value: boolean) => void;
  commitSeek: (value: number) => void;
  togglePlay: () => Promise<void>;
  prevTrack: () => void;
  nextTrack: () => void;
  setVolume: (value: number) => void;
  enableAutoplay: () => void;
  disableAutoplay: () => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function useGlobalMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error("useGlobalMusic must be used inside GlobalMusicProvider");
  }
  return ctx;
}

export default function GlobalMusicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldResumeAfterStoryRef = useRef(false);

  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(0.75);
  const [isSeeking, setIsSeeking] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const currentTrack = tracks[trackIndex];

  /* 초기 설정 로드 */
  useEffect(() => {
    const savedAutoplay = window.localStorage.getItem(AUTOPLAY_KEY);
    const savedVolume = window.localStorage.getItem(VOLUME_KEY);
    const savedTrackIndex = window.localStorage.getItem(TRACK_INDEX_KEY);

    setAutoplayEnabled(savedAutoplay === "true");
    setVolumeState(formatNumber(savedVolume, 0.75));

    const parsedIndex = formatNumber(savedTrackIndex, 0);
    const safeIndex =
      parsedIndex >= 0 && parsedIndex < tracks.length ? parsedIndex : 0;
    setTrackIndex(safeIndex);

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    window.localStorage.setItem(VOLUME_KEY, String(volume));
  }, [volume, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    window.localStorage.setItem(TRACK_INDEX_KEY, String(trackIndex));
  }, [trackIndex, isInitialized]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  /* 현재 트랙의 재생 시간 저장 */
  useEffect(() => {
    if (!isInitialized) return;
    window.localStorage.setItem(getTimeKey(currentTrack.id), String(currentTime));
  }, [currentTime, currentTrack.id, isInitialized]);

  /* 오디오 이벤트 */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);

      const savedTime = formatNumber(
        window.localStorage.getItem(getTimeKey(currentTrack.id)),
        0
      );

      if (savedTime > 0 && savedTime < (audio.duration || 0)) {
        audio.currentTime = savedTime;
        setCurrentTime(savedTime);
      }
    };

    const onTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime || 0);
      }
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
  }, [currentTrack.id, isSeeking]);

  /* 트랙이 바뀔 때만 src 교체 */
  useEffect(() => {
    if (!isInitialized) return;

    const audio = audioRef.current;
    if (!audio) return;

    const wasPlaying = !audio.paused || isPlaying;

    audio.src = currentTrack.src;
    audio.load();

    setDuration(0);
    setCurrentTime(0);

    const savedTime = formatNumber(
      window.localStorage.getItem(getTimeKey(currentTrack.id)),
      0
    );

    const applyTime = () => {
      if (savedTime > 0 && savedTime < (audio.duration || 0)) {
        audio.currentTime = savedTime;
        setCurrentTime(savedTime);
      }
    };

    audio.addEventListener("loadedmetadata", applyTime, { once: true });

    if (wasPlaying) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    } else {
      setIsPlaying(false);
    }
  }, [trackIndex, currentTrack.src, currentTrack.id, isInitialized]);

  /* 스토리 들어가면 일시정지 */
  useEffect(() => {
    const isStoryPage = pathname.startsWith("/stories/");
    const audio = audioRef.current;
    if (!audio) return;

    if (isStoryPage) {
      shouldResumeAfterStoryRef.current = !audio.paused;
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (shouldResumeAfterStoryRef.current && autoplayEnabled) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
      shouldResumeAfterStoryRef.current = false;
    }
  }, [pathname, autoplayEnabled]);

  const enableAutoplay = useCallback(() => {
    window.localStorage.setItem(AUTOPLAY_KEY, "true");
    setAutoplayEnabled(true);
  }, []);

  const disableAutoplay = useCallback(() => {
    window.localStorage.setItem(AUTOPLAY_KEY, "false");
    setAutoplayEnabled(false);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
  }, []);

  const togglePlay = useCallback(async () => {
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
      /* 재생 버튼 누른다고 autoplay 설정을 강제로 바꾸지 않음 */
    } catch {
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const prevTrack = useCallback(() => {
    setTrackIndex((prev) => (prev <= 0 ? tracks.length - 1 : prev - 1));
  }, []);

  const nextTrack = useCallback(() => {
    setTrackIndex((prev) => (prev >= tracks.length - 1 ? 0 : prev + 1));
  }, []);

  const commitSeek = useCallback((next: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = next;
    setCurrentTime(next);
    setIsSeeking(false);
  }, []);

  const value = useMemo<MusicContextValue>(
    () => ({
      tracks,
      trackIndex,
      currentTrack,
      isPlaying,
      duration,
      currentTime,
      volume,
      autoplayEnabled,
      isSeeking,
      setCurrentTime,
      setIsSeeking,
      commitSeek,
      togglePlay,
      prevTrack,
      nextTrack,
      setVolume,
      enableAutoplay,
      disableAutoplay,
    }),
    [
      trackIndex,
      currentTrack,
      isPlaying,
      duration,
      currentTime,
      volume,
      autoplayEnabled,
      isSeeking,
      commitSeek,
      togglePlay,
      prevTrack,
      nextTrack,
      setVolume,
      enableAutoplay,
      disableAutoplay,
    ]
  );

  return (
    <MusicContext.Provider value={value}>
      <audio ref={audioRef} preload="metadata" hidden />
      {children}
    </MusicContext.Provider>
  );
}