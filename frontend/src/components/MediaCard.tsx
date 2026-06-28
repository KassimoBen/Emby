import { Link } from 'react-router-dom';
import type { Media } from '../types';

const PLACEHOLDER_COLORS = [
  'from-blue-600 to-indigo-900',
  'from-purple-600 to-pink-900',
  'from-green-600 to-teal-900',
  'from-red-600 to-rose-900',
  'from-amber-500 to-orange-900',
  'from-pink-600 to-purple-900',
  'from-indigo-600 to-blue-900',
  'from-teal-500 to-cyan-900',
  'from-orange-500 to-red-900',
  'from-cyan-500 to-blue-900',
];

const TYPE_BADGE: Record<string, string> = {
  movie: 'bg-blue-600/80',
  tv: 'bg-green-600/80',
  music: 'bg-purple-600/80',
};

interface MediaCardProps {
  media: Media;
}

export default function MediaCard({ media }: MediaCardProps) {
  const posterUrl = media.poster_path
    ? `/posters/${media.poster_path.split(/[\\/]/).pop()}`
    : null;

  const initial = (media.title || '?')[0].toUpperCase();
  const colorIndex = media.id % PLACEHOLDER_COLORS.length;

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(1)} Go` : `${(bytes / (1024 * 1024)).toFixed(0)} Mo`;
  };

  return (
    <Link to={`/detail/${media.id}`} className="card group relative">
      <div className="preserve-3d transition-3d hover-3d aspect-[2/3] bg-gray-800 relative overflow-hidden rounded-t-xl">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={media.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${PLACEHOLDER_COLORS[colorIndex]} flex flex-col items-center justify-center p-4 transition-transform duration-500 group-hover:scale-105`}>
            <span className="text-5xl font-bold text-white/80 drop-shadow-lg">{initial}</span>
            <span className="text-xs text-white/60 text-center mt-2 line-clamp-2 px-2">{media.title}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <span className="text-sm text-white font-medium">{formatSize(media.file_size)}</span>
        </div>

        {/* Rating badge */}
        {media.rating && (
          <div className="absolute top-2 right-2 bg-black/80 text-yellow-400 text-xs px-2 py-1 rounded-lg font-bold backdrop-blur-sm shadow-lg">
            <span className="flex items-center gap-0.5">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              {media.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${TYPE_BADGE[media.media_type] || 'bg-gray-600/80'} text-white shadow-lg`}>
            {media.media_type}
          </span>
        </div>
      </div>

      <div className="p-3 bg-gray-900/95">
        <h3 className="font-semibold truncate text-sm text-gray-100 group-hover:text-primary-400 transition-colors">{media.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          {media.year && <span className="text-xs text-gray-500">{media.year}</span>}
        </div>
      </div>
    </Link>
  );
}
