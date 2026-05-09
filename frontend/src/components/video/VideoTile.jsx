import { useEffect, useRef } from "react";
import { Camera, UserRound } from "lucide-react";
import { cn } from "../../utils/helpers.js";

export default function VideoTile({ stream, label, muted = false, local = false, className }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream || null;
  }, [stream]);

  return (
    <div className={cn("relative isolate min-h-0 overflow-hidden rounded-lg border border-white/10 bg-slate-950", className)}>
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-56 flex-col items-center justify-center bg-slate-900 text-slate-400">
          <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/10">
            {local ? <Camera className="h-7 w-7" /> : <UserRound className="h-7 w-7" />}
          </span>
          <p className="mt-4 text-sm">{local ? "Camera preview unavailable" : "Waiting for remote video"}</p>
        </div>
      )}
      <div className="absolute top-4 left-4 rounded-md border border-white/10 bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xl">
        {label}
      </div>
    </div>
  );
}
