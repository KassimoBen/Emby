import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const MIME_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  webm: 'video/webm',
  m4v: 'video/mp4',
};

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  type?: string;
}

export default function VideoPlayer({ src, poster, title, type }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    const ext = type || src.split('.').pop()?.split('?')[0]?.toLowerCase() || 'mp4';
    const player = videojs(videoRef.current, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      fluid: true,
      sources: [{ src, type: MIME_TYPES[ext] || 'video/mp4' }],
      poster: poster || undefined,
    });
    return () => {
      if (player) player.dispose();
    };
  }, [src, poster]);

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-big-play-centered" title={title} />
    </div>
  );
}
