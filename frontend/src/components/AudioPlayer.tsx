interface AudioPlayerProps {
  src: string;
  title?: string;
}

export default function AudioPlayer({ src, title }: AudioPlayerProps) {
  return (
    <div className="bg-gray-900/80 border border-gray-800/50 rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center shrink-0">
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-medium text-white truncate">{title}</p>
          )}
          <audio
            controls
            className="w-full mt-2"
            preload="metadata"
            style={{ height: '40px' }}
          >
            <source src={src} />
          </audio>
        </div>
      </div>
    </div>
  );
}
