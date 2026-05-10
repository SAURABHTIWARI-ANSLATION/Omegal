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
        "safe-bottom flex shrink-0 flex-nowrap items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-xl",
        compact ? "gap-1.5 p-1.5 [--safe-bottom-padding:0.25rem] sm:gap-2 sm:p-2" : "gap-2 p-2 [--safe-bottom-padding:0.5rem] sm:gap-3",
        className
      )}
    >
      <Button type="button" variant={audioEnabled ? "secondary" : "danger"} size="icon" className={cn(compact && "h-9 w-9 sm:h-10 sm:w-10")} disabled={!hasAudio} onClick={toggleAudio} aria-label="Toggle microphone">
        {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>
      <Button type="button" variant={videoEnabled ? "secondary" : "danger"} size="icon" className={cn(compact && "h-9 w-9 sm:h-10 sm:w-10")} disabled={!hasVideo} onClick={toggleVideo} aria-label="Toggle camera">
        {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>
      <Button
        type="button"
        variant={partnerDisconnected ? "success" : "subtle"}
        className={cn("min-w-0 px-3", compact ? "h-9 max-w-[8rem] flex-1 sm:h-10 sm:flex-none sm:min-w-[8rem]" : "min-w-[7.5rem] sm:min-w-[9rem]")}
        onClick={nextPartner}
        disabled={nextDisabled}
      >
        <SkipForward className="h-4 w-4" />
        <span className="truncate">{nextDisabled ? "Searching..." : partnerDisconnected ? "Find next" : "Next"}</span>
      </Button>
    </div>
  );
}
