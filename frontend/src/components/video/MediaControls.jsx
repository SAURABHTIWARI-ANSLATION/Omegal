import { Mic, MicOff, SkipForward, Video, VideoOff } from "lucide-react";
import Button from "../ui/Button.jsx";
import { useQueue } from "../../hooks/useQueue.js";
import { useWebRTC } from "../../hooks/useWebRTC.js";
import { useAppStore } from "../../store/appStore.js";

export default function MediaControls() {
  const audioEnabled = useAppStore((state) => state.audioEnabled);
  const videoEnabled = useAppStore((state) => state.videoEnabled);
  const localStream = useAppStore((state) => state.localStream);
  const partnerDisconnected = useAppStore((state) => state.partnerDisconnected);
  const { toggleAudio, toggleVideo } = useWebRTC();
  const { nextPartner } = useQueue();

  const hasAudio = Boolean(localStream?.getAudioTracks().length);
  const hasVideo = Boolean(localStream?.getVideoTracks().length);

  return (
    <div className="safe-bottom flex flex-wrap items-center justify-center gap-3 rounded-[2rem] border border-white/10 bg-slate-950/65 p-3 backdrop-blur-xl">
      <Button type="button" variant={audioEnabled ? "secondary" : "danger"} size="icon" disabled={!hasAudio} onClick={toggleAudio} aria-label="Toggle microphone">
        {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>
      <Button type="button" variant={videoEnabled ? "secondary" : "danger"} size="icon" disabled={!hasVideo} onClick={toggleVideo} aria-label="Toggle camera">
        {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>
      <Button type="button" variant={partnerDisconnected ? "primary" : "subtle"} onClick={nextPartner}>
        <SkipForward className="h-4 w-4" />
        {partnerDisconnected ? "Find next" : "Next"}
      </Button>
    </div>
  );
}