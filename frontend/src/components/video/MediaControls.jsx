import { Mic, MicOff, SkipForward, Video, VideoOff } from "lucide-react";
import Button from "../ui/Button.jsx";
import { useQueue } from "../../hooks/useQueue.js";
import { useWebRTC } from "../../hooks/useWebRTC.js";
import { useAppStore } from "../../store/appStore.js";
import { SESSION_STATUS } from "../../utils/constants.js";
import { cn } from "../../utils/helpers.js";

export default function MediaControls({ compact = false, className }) {
  const audioEnabled = useAppStore((state) => state.audioEnabled);
  const videoEnabled = useAppStore((state) => state.videoEnabled);
  const localStream = useAppStore((state) => state.localStream);
  const partnerDisconnected = useAppStore((state) => state.partnerDisconnected);
  const queueStatus = useAppStore((state) => state.queueStatus);
  const isSwitchingPartner = useAppStore((state) => state.isSwitchingPartner);
  const { toggleAudio, toggleVideo } = useWebRTC();
  const { nextPartner } = useQueue();

  const hasAudio = Boolean(localStream?.getAudioTracks().length);
  const hasVideo = Boolean(localStream?.getVideoTracks().length);
  const nextDisabled = isSwitchingPartner || queueStatus === SESSION_STATUS.SEARCHING;

  return (
    <div
      className={cn(
        "safe-bottom flex shrink-0 flex-nowrap items-center justify-center rounded-full border border-black/[0.08] bg-white/[0.82] px-6 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.10)] backdrop-blur-[20px]",
        compact ? "gap-2 [--safe-bottom-padding:0.25rem]" : "gap-3 [--safe-bottom-padding:0.5rem]",
        className
      )}
    >
      <Button type="button" variant={audioEnabled ? "subtle" : "danger"} size="icon" className="h-11 w-11 border-0 shadow-none" disabled={!hasAudio} onClick={toggleAudio} aria-label="Toggle microphone">
        {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>
      <Button type="button" variant={videoEnabled ? "subtle" : "danger"} size="icon" className="h-11 w-11 border-0 shadow-none" disabled={!hasVideo} onClick={toggleVideo} aria-label="Toggle camera">
        {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>
      <Button
        type="button"
        variant={partnerDisconnected ? "success" : "subtle"}
        className={cn("min-w-0 px-4", compact ? "h-11 max-w-[9rem] flex-1 sm:flex-none sm:min-w-[9rem]" : "min-w-[7.5rem] sm:min-w-[9rem]")}
        onClick={nextPartner}
        disabled={nextDisabled}
      >
        <SkipForward className="h-4 w-4" />
        <span className="truncate">{nextDisabled ? "Searching..." : partnerDisconnected ? "Find next" : "Next"}</span>
      </Button>
    </div>
  );
}
