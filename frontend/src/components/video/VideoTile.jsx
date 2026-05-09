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
    <div className={cn("relative isolate min-h-[18rem] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900", className)}>
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-[18rem] flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.14),transparent_22rem)] text-slate-400">
          {local ? <Camera className="h-10 w-10" /> : <UserRound className="h-10 w-10" />}
          <p className="mt-4 text-sm">{local ? "Camera preview unavailable" : "Waiting for remote video"}</p>
        </div>
      )}
      <div className="absolute top-4 left-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xl">
        {label}
      </div>
    </div>
  );
}