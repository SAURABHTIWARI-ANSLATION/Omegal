import { useEffect, useRef } from "react";
import { Camera, UserRound } from "lucide-react";
import { cn } from "../../utils/helpers.js";

export default function VideoTile({ stream, label, muted = false, local = false, fit = "cover", className }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream || null;
  }, [stream]);

  return (
    <div className={cn("group relative isolate min-h-0 overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]", className)}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={cn("h-full w-full bg-slate-950", fit === "contain" ? "object-contain" : "object-cover")}
        />
      ) : (
        <div className="relative flex h-full min-h-full flex-col items-center justify-center overflow-hidden bg-slate-900 text-center text-slate-400">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(20,184,166,0.12),transparent_28%)]" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/10 shadow-[0_0_34px_rgba(20,184,166,0.12)]">
            {local ? <Camera className="h-7 w-7" /> : <UserRound className="h-7 w-7" />}
          </span>
          <p className="relative mt-4 px-4 text-sm">{local ? "Camera preview unavailable" : "Waiting for remote video"}</p>
        </div>
      )}
      <div className="absolute top-3 left-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-md border border-white/10 bg-black/60 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-xl sm:top-4 sm:left-4 sm:px-3">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", stream ? "bg-teal-300 shadow-[0_0_12px_rgba(94,234,212,0.9)]" : "bg-slate-500")} />
        {label}
      </div>
    </div>
  );
}
