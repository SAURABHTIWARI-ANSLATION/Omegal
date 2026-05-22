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
  const [isCinemaLayout, setIsCinemaLayout] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const localStream = useAppStore((state) => state.localStream);
  const remoteStream = useAppStore((state) => state.remoteStream);
  const rtcConnectionState = useAppStore((state) => state.rtcConnectionState);
  const iceConnectionState = useAppStore((state) => state.iceConnectionState);

  const isConnected = rtcConnectionState === "connected" || iceConnectionState === "connected";
  const isImmersive = isCinemaLayout;
  const localPreviewClass = cn(
    "absolute right-3 z-20 aspect-video w-[min(42vw,17rem)] min-w-[7.5rem] rounded-[1.6rem] border-2 border-white/90 bg-white/[0.70] shadow-[0_4px_20px_rgba(0,0,0,0.12)] backdrop-blur-2xl sm:right-6 sm:w-[min(28vw,21rem)] sm:min-w-[10rem]",
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
        "video-stage-panel relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-[#f7f5ef] text-[#111115]",
        isFullscreen && "h-screen w-screen"
      )}
    >
      <div className="video-stage-header pointer-events-none absolute inset-x-3 top-3 z-40 flex shrink-0 items-center justify-between gap-2 sm:inset-x-5 sm:top-5">
        <div className="min-w-0">
          <p className="liquid-pill hidden items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#6e6e73] sm:flex">
            <Sparkles className="h-3.5 w-3.5" />
            Private room
          </p>
          <h2 className="video-stage-title mt-2 hidden truncate text-2xl font-semibold tracking-[-0.04em] text-[#111115] sm:block">Video conversation</h2>
        </div>
        <div className="pointer-events-auto flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <Badge variant="dark" className="hidden max-w-[10rem] sm:inline-flex lg:max-w-full">
            {isConnected ? <SignalHigh className="h-3.5 w-3.5 text-[#34c759]" /> : <Radio className="h-3.5 w-3.5 text-[#0071e3]" />}
            <span className="truncate">WebRTC {rtcConnectionState}</span>
          </Badge>
          <span className={cn("h-2.5 w-2.5 rounded-full sm:hidden", isConnected ? "bg-[#34c759]" : "bg-[#0071e3]")} aria-label={`WebRTC ${rtcConnectionState}`} />
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
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#eef1f7]">
          <VideoTile stream={remoteStream} label="Stranger" className="absolute inset-3 h-auto w-auto rounded-[20px] sm:inset-4" />
          <VideoTile stream={localStream} label="You" muted local fit="contain" className={localPreviewClass} />
          <div className="pointer-events-none absolute inset-x-3 bottom-4 z-30 flex justify-center sm:bottom-6">
            <MediaControls compact className="pointer-events-auto w-full max-w-[34rem]" />
          </div>
        </div>
      ) : (
        <>
          <div className="video-tile-grid grid min-h-0 flex-1 grid-cols-2 grid-rows-1 gap-2 p-3 pt-24 sm:gap-4 sm:p-5 sm:pt-32">
            <VideoTile stream={remoteStream} label="Stranger" fit="contain" className="h-full min-h-0 rounded-[2rem]" />
            <VideoTile stream={localStream} label="You" muted local fit="contain" className="h-full min-h-0 rounded-[2rem]" />
          </div>
          <div className="absolute inset-x-3 bottom-4 z-30 flex justify-center sm:bottom-6">
            <MediaControls compact className="w-full max-w-[34rem]" />
          </div>
        </>
      )}
    </section>
  );
}
