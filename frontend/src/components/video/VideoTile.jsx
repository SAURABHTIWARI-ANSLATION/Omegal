import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Volume2 } from "lucide-react";
import { cn } from "../../utils/helpers.js";
import chatUiStudio from "../../assets/studio/chat-ui-studio.jpg";

let globalAudioUnlockAttached = false;

function attachGlobalAudioUnlock(callback) {
  if (globalAudioUnlockAttached) return;
  globalAudioUnlockAttached = true;

  const unlock = () => {
    globalAudioUnlockAttached = false;
    document.removeEventListener("pointerdown", unlock, { capture: true });
    document.removeEventListener("keydown", unlock);
    document.removeEventListener("touchstart", unlock);
    callback();
  };

  document.addEventListener("pointerdown", unlock, { capture: true });
  document.addEventListener("keydown", unlock);
  document.addEventListener("touchstart", unlock);
}

export default function VideoTile({ stream, label, muted = false, local = false, fit = "cover", className }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [audioUnlockNeeded, setAudioUnlockNeeded] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);

  const playVideo = useCallback(async ({ allowMutedFallback = true } = {}) => {
    const video = videoRef.current;
    if (!video || !stream) return false;

    try {
      await video.play();
      setPlaybackBlocked(false);
      return true;
    } catch (error) {
      if (!muted && allowMutedFallback) {
        try {
          video.muted = true;
          await video.play();
          setAudioUnlockNeeded(true);
          setPlaybackBlocked(false);
          return true;
        } catch {
          // The explicit user-tap overlay below handles stricter mobile autoplay policies.
        }
      }

      setPlaybackBlocked(true);
      return false;
    }
  }, [muted, stream]);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (video) {
      if (video.srcObject !== (stream || null)) {
        video.srcObject = stream || null;
      }
    }

    if (audio && !local && stream) {
      if (audio.srcObject !== stream) {
        audio.srcObject = stream;
      }
    }

    if (stream) {
      // Attempt immediate play. On some browsers (especially Safari and
      // Android WebView) the video element is not yet ready when srcObject
      // is first assigned, so play() will be rejected. The loadedmetadata
      // and canplay listeners below serve as reliable fallback triggers.
      void playVideo();
      if (audio && !local && !muted) {
        audio.play().catch(() => {});
      }

      // Fallback: retry play() when the element has decoded enough data.
      // This covers Safari's stricter media pipeline initialization.
      const handleLoadedMetadata = () => {
        void playVideo();
      };
      const handleCanPlay = () => {
        const v = videoRef.current;
        if (v && v.paused) void playVideo();
      };

      video?.addEventListener("loadedmetadata", handleLoadedMetadata);
      video?.addEventListener("canplay", handleCanPlay);

      return () => {
        video?.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video?.removeEventListener("canplay", handleCanPlay);
      };
    } else {
      setAudioUnlockNeeded(false);
      setPlaybackBlocked(false);
    }

    return undefined;
  }, [stream, playVideo, local, muted]);


  const unlockPlayback = useCallback(async () => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (video) {
      if (audioUnlockNeeded) {
        video.muted = false;
        video.volume = 1;
      }
      const didPlay = await playVideo({ allowMutedFallback: false });
      if (didPlay) setAudioUnlockNeeded(false);
    }

    if (audio && !local) {
      audio.muted = false;
      audio.volume = 1;
      audio.play().catch(() => {});
    }
  }, [audioUnlockNeeded, playVideo, local]);

  const unlockRef = useRef(unlockPlayback);
  unlockRef.current = unlockPlayback;

  useEffect(() => {
    if (!stream || muted) return undefined;

    attachGlobalAudioUnlock(() => {
      void unlockRef.current();
    });

    return undefined;
  }, [muted, stream]);

  const shouldShowPlaybackPrompt = Boolean(stream && (audioUnlockNeeded || playbackBlocked));

  return (
    <div
      className={cn("video-tile group relative isolate min-h-0 overflow-hidden rounded-[1.6rem] border border-white/90 bg-[#eef1f7] shadow-[0_4px_20px_rgba(0,0,0,0.08)] backdrop-blur-2xl", className)}
      onClick={shouldShowPlaybackPrompt ? unlockPlayback : undefined}
    >
      {!local && stream ? (
        <audio ref={audioRef} autoPlay playsInline muted={false} style={{ display: "none" }} />
      ) : null}
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          webkit-playsinline="true"
          muted={true}
          controls={false}
          preload="auto"
          className={cn("h-full w-full bg-[#eef1f7] object-center", fit === "contain" ? "object-contain" : "object-cover")}
        />
      ) : (
        <div className="video-placeholder relative flex h-full min-h-full flex-col items-center justify-center overflow-hidden bg-[#eef1f7] text-center text-[#62626c]">
          <img src={chatUiStudio} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-45 blur-[1px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(0,113,227,0.18),transparent_30%),radial-gradient(circle_at_68%_62%,rgba(255,55,95,0.10),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.50),rgba(255,255,255,0.82))]" />
          {local ? (
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/90 bg-white/[0.72] shadow-[0_8px_32px_rgba(0,113,227,0.10)] backdrop-blur-2xl">
              <Camera className="h-5 w-5" />
            </span>
          ) : (
            <span className="relative flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/90 bg-white/78 shadow-[0_18px_45px_rgba(0,113,227,0.18)] backdrop-blur-2xl">
              <Camera className="h-9 w-9 text-[#0071e3]" />
            </span>
          )}
          <p className="relative mt-4 px-4 text-sm">{local ? "Camera preview unavailable" : "Waiting for remote video"}</p>
        </div>
      )}
      {shouldShowPlaybackPrompt ? (
        <button
          type="button"
          className="absolute inset-x-3 bottom-3 z-20 inline-flex items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-white/[0.88] px-3 py-2 text-xs font-semibold text-[#1d1d1f] shadow-lg backdrop-blur-xl transition hover:bg-white sm:inset-x-auto sm:right-3 sm:left-3"
          onClick={(event) => {
            event.stopPropagation();
            void unlockPlayback();
          }}
        >
          <Volume2 className="h-4 w-4 text-[#0071e3]" />
          {audioUnlockNeeded ? "Tap for audio" : "Tap to start video"}
        </button>
      ) : null}
      <div className="video-tile-label liquid-pill absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 px-2.5 py-1 text-xs font-semibold text-[#1d1d1f] sm:left-4 sm:top-4 sm:px-3">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", stream ? "bg-[#34c759]" : "bg-[#86868b]")} />
        {label}
      </div>
    </div>
  );
}
