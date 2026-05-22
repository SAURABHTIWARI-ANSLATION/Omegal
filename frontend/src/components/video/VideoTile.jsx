import { useEffect, useRef, useState } from "react";
import { Camera, Volume2, UserRound } from "lucide-react";
import { cn } from "../../utils/helpers.js";

export default function VideoTile({ stream, label, muted = false, local = false, fit = "cover", className }) {
  const videoRef = useRef(null);
  const [audioUnlockNeeded, setAudioUnlockNeeded] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);

  const playVideo = async ({ allowMutedFallback = true } = {}) => {
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
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    setAudioUnlockNeeded(false);
    setPlaybackBlocked(false);

    video.srcObject = stream || null;
    video.muted = Boolean(muted);
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    if (!stream) return undefined;

    const handleReady = () => {
      void playVideo({ allowMutedFallback: true });
    };

    video.addEventListener("loadedmetadata", handleReady);
    video.addEventListener("canplay", handleReady);
    void playVideo({ allowMutedFallback: true });

    return () => {
      video.removeEventListener("loadedmetadata", handleReady);
      video.removeEventListener("canplay", handleReady);
      video.srcObject = null;
    };
  }, [muted, stream]);

  const unlockPlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (audioUnlockNeeded) {
      video.muted = false;
      video.volume = 1;
    }

    const didPlay = await playVideo({ allowMutedFallback: false });
    if (didPlay) setAudioUnlockNeeded(false);
  };

  const shouldShowPlaybackPrompt = Boolean(stream && (audioUnlockNeeded || playbackBlocked));

  return (
    <div
      className={cn("group relative isolate min-h-0 overflow-hidden rounded-[1.6rem] border border-white/12 bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_70px_rgba(0,0,0,0.34)] backdrop-blur-2xl", className)}
      onClick={shouldShowPlaybackPrompt ? unlockPlayback : undefined}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          webkit-playsinline="true"
          muted={muted || audioUnlockNeeded}
          controls={false}
          preload="auto"
          className={cn("h-full w-full bg-slate-950", fit === "contain" ? "object-contain" : "object-cover")}
        />
      ) : (
        <div className="relative flex h-full min-h-full flex-col items-center justify-center overflow-hidden bg-black/28 text-center text-white/48">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_68%_62%,rgba(34,197,94,0.12),transparent_32%)]" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/16 bg-white/12 shadow-[0_0_44px_rgba(96,165,250,0.18)] backdrop-blur-2xl">
            {local ? <Camera className="h-7 w-7" /> : <UserRound className="h-7 w-7" />}
          </span>
          <p className="relative mt-4 px-4 text-sm">{local ? "Camera preview unavailable" : "Waiting for remote video"}</p>
        </div>
      )}
      {shouldShowPlaybackPrompt ? (
        <button
          type="button"
          className="absolute inset-x-3 bottom-3 z-20 inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-black/65 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-xl transition hover:bg-black/75 sm:inset-x-auto sm:right-3 sm:left-3"
          onClick={(event) => {
            event.stopPropagation();
            void unlockPlayback();
          }}
        >
          <Volume2 className="h-4 w-4 text-teal-200" />
          {audioUnlockNeeded ? "Tap for audio" : "Tap to start video"}
        </button>
      ) : null}
      <div className="liquid-pill absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 px-2.5 py-1 text-xs font-semibold text-white/90 sm:left-4 sm:top-4 sm:px-3">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", stream ? "bg-teal-300 shadow-[0_0_12px_rgba(94,234,212,0.9)]" : "bg-slate-500")} />
        {label}
      </div>
    </div>
  );
}
