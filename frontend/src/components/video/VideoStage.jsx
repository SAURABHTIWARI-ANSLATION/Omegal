import { useEffect, useRef, useState } from "react";
import { Columns2, Maximize2, Minimize2, Radio, SignalHigh, Sparkles } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import VideoTile from "./VideoTile.jsx";
import MediaControls from "./MediaControls.jsx";
import { useAppStore } from "../../store/appStore.js";
import { cn } from "../../utils/helpers.js";

export default function VideoStage() {
  const stageRef = useRef(null);
  const [isCinemaLayout, setIsCinemaLayout] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const localStream = useAppStore((state) => state.localStream);
  const remoteStream = useAppStore((state) => state.remoteStream);
  const rtcConnectionState = useAppStore((state) => state.rtcConnectionState);
  const iceConnectionState = useAppStore((state) => state.iceConnectionState);

  const isConnected = rtcConnectionState === "connected" || iceConnectionState === "connected";
  const isImmersive = isCinemaLayout;
  const localPreviewClass = cn(
    "absolute right-2 z-20 aspect-video w-[min(46vw,16rem)] min-w-[7.5rem] border-teal-300/50 bg-slate-950 shadow-[0_20px_70px_rgba(0,0,0,0.5)] sm:right-4 sm:w-[min(30vw,21rem)] sm:min-w-[10rem]",
    isFullscreen
      ? "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] sm:bottom-[calc(6.25rem+env(safe-area-inset-bottom))]"
      : "bottom-[calc(5.25rem+env(safe-area-inset-bottom))] sm:bottom-[calc(5.75rem+env(safe-area-inset-bottom))]"
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === stageRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!stageRef.current) return;

    try {
      if (document.fullscreenElement === stageRef.current) {
        await document.exitFullscreen();
      } else {
        await stageRef.current.requestFullscreen();
      }
    } catch {
      setIsFullscreen(false);
    }
  };

  return (
    <section
      ref={stageRef}
      className={cn(
        "video-stage-panel media-panel relative flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden rounded-lg p-1.5 text-white sm:gap-3 sm:p-3 lg:p-4",
        isFullscreen && "h-screen w-screen rounded-none border-0 bg-slate-950 p-2 sm:p-4"
      )}
    >
      <div className="video-stage-header flex shrink-0 items-center justify-between gap-2 border-b border-white/10 pb-1.5 sm:gap-3 sm:pb-3">
        <div className="min-w-0">
          <p className="hidden items-center gap-2 text-xs font-semibold text-teal-200 sm:flex sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Private room
          </p>
          <h2 className="video-stage-title truncate text-sm font-bold sm:mt-1 sm:text-2xl">Video conversation</h2>
        </div>
        <div className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <Badge variant="dark" className="hidden max-w-[10rem] sm:inline-flex lg:max-w-full">
            {isConnected ? <SignalHigh className="h-3.5 w-3.5 text-teal-300" /> : <Radio className="h-3.5 w-3.5 text-indigo-300" />}
            <span className="truncate">WebRTC {rtcConnectionState}</span>
          </Badge>
          <span className={cn("h-2.5 w-2.5 rounded-full sm:hidden", isConnected ? "bg-teal-300 shadow-[0_0_14px_rgba(94,234,212,0.9)]" : "bg-indigo-300")} aria-label={`WebRTC ${rtcConnectionState}`} />
          <Button type="button" variant="subtle" size="sm" className="h-9 px-2.5 sm:h-9 sm:px-3" onClick={() => setIsCinemaLayout((value) => !value)}>
            {isCinemaLayout ? <Columns2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{isCinemaLayout ? "Split" : "Maximize"}</span>
          </Button>
          <Button type="button" variant="subtle" size="sm" className="h-9 px-2.5 sm:h-9 sm:px-3" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit full" : "Full screen"}</span>
          </Button>
        </div>
      </div>

      {isImmersive ? (
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-slate-950">
          <VideoTile stream={remoteStream} label="Stranger" className="absolute inset-0 h-full w-full rounded-none border-0" />
          <VideoTile stream={localStream} label="You" muted local fit="contain" className={localPreviewClass} />
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex justify-center sm:bottom-4">
            <MediaControls compact className="pointer-events-auto w-full max-w-[38rem] bg-slate-900/88 px-3 shadow-[0_18px_60px_rgba(0,0,0,0.38)] ring-1 ring-white/10" />
          </div>
        </div>
      ) : (
        <>
          <div className="video-tile-grid grid min-h-0 flex-1 grid-cols-2 grid-rows-1 gap-1.5 sm:gap-3">
            <VideoTile stream={remoteStream} label="Stranger" fit="contain" className="h-full min-h-0" />
            <VideoTile stream={localStream} label="You" muted local fit="contain" className="h-full min-h-0" />
          </div>
          <MediaControls compact />
        </>
      )}
    </section>
  );
}
