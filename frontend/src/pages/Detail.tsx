import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { mediaApi, downloadApi } from '../api/client';
import VideoPlayer from '../components/VideoPlayer';
import AudioPlayer from '../components/AudioPlayer';

const TYPE_COLORS: Record<string, string> = {
  movie: 'from-blue-600 to-blue-900',
  tv: 'from-green-600 to-green-900',
  music: 'from-purple-600 to-purple-900',
};

export default function Detail() {
  const { id } = useParams();
  const [showTrailer, setShowTrailer] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const { data: media, isLoading } = useQuery({
    queryKey: ['media', id],
    queryFn: () => mediaApi.get(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-[50vh] bg-gray-800 rounded-xl" />
        <div className="flex gap-6">
          <div className="w-48 aspect-[2/3] bg-gray-800 rounded-xl hidden md:block" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/3" />
            <div className="h-4 bg-gray-800 rounded w-1/4" />
            <div className="h-20 bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!media) {
    return <div className="text-center py-16 text-gray-500">Média non trouvé</div>;
  }

  const posterUrl = media.poster_path
    ? `/posters/${media.poster_path.split(/[\\/]/).pop()}`
    : '';

  const backdropUrl = media.backdrop_path
    ? `/posters/${media.backdrop_path.split(/[\\/]/).pop()}`
    : '';

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(1)} Go` : `${(bytes / (1024 * 1024)).toFixed(0)} Mo`;
  };

  const isVideo = ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(media.file_extension);
  const isMusic = media.media_type === 'music';
  const typeColor = TYPE_COLORS[media.media_type] || 'from-gray-600 to-gray-900';
  const scrollToPlayer = () => {
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8">
      {/* Hero backdrop */}
      <div className="relative -mx-4 -mt-6 px-4 pt-6 pb-12 overflow-hidden">
        {backdropUrl && (
          <>
            <img src={backdropUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-gray-950/40" />
          </>
        )}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link to="/library" className="hover:text-white transition-colors">Bibliothèque</Link>
            <span>/</span>
            <Link to={`/library/${media.media_type}`} className="hover:text-white transition-colors capitalize">{media.media_type}</Link>
            <span>/</span>
            <span className="text-gray-300">{media.title}</span>
          </div>
          <div className="flex gap-6 items-end">
            {posterUrl && (
              <div className="w-40 md:w-56 shrink-0 hidden md:block shadow-2xl rounded-xl overflow-hidden -mb-20 relative">
                <img src={posterUrl} alt={media.title} className="w-full" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{media.title}</h1>
              {media.original_title && media.original_title !== media.title && (
                <p className="text-lg text-gray-400 mb-3">{media.original_title}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {media.year && <span className="text-gray-300 font-medium">{media.year}</span>}
                <span className={`uppercase text-xs font-bold px-2 py-1 rounded bg-gradient-to-r ${typeColor} text-white`}>
                  {media.media_type}
                </span>
                {media.resolution && (
                  <span className="text-gray-400">{media.resolution}</span>
                )}
                {media.rating && (
                  <span className="flex items-center gap-1 text-yellow-400 font-semibold bg-yellow-400/10 px-2 py-1 rounded">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {media.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video player */}
      {isVideo && (
        <div ref={playerRef} className="rounded-xl overflow-hidden bg-black shadow-2xl border border-gray-800/50">
          <VideoPlayer
            src={downloadApi.url(media.id)}
            poster={posterUrl}
            title={media.title}
            type={media.file_extension}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Mobile poster */}
        {posterUrl && (
          <div className="md:hidden w-32 shrink-0 shadow-lg rounded-xl overflow-hidden">
            <img src={posterUrl} alt={media.title} className="w-full" />
          </div>
        )}

        <div className="flex-1 space-y-6">
          {/* Genres */}
          {media.genres && (
            <div className="flex flex-wrap gap-2">
              {media.genres.split(', ').map((g) => (
                <span key={g} className="bg-gray-800/80 text-gray-300 px-3 py-1 rounded-full text-sm border border-gray-700/50">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {media.description && (
            <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-5">
              <p className="text-gray-300 leading-relaxed">{media.description}</p>
            </div>
          )}

          {/* Info cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Taille</p>
              <p className="text-lg font-semibold text-white">{formatSize(media.file_size)}</p>
            </div>
            {media.duration && (
              <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Durée</p>
                <p className="text-lg font-semibold text-white">{Math.floor(media.duration / 60)} min</p>
              </div>
            )}
            {media.codec && (
              <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Codec</p>
                <p className="text-lg font-semibold text-white">{media.codec}</p>
              </div>
            )}
            <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Format</p>
              <p className="text-lg font-semibold text-white uppercase">{media.file_extension}</p>
            </div>
          </div>

          {/* Cast */}
          {media.cast_str && (
            <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Casting</h3>
              <div className="flex flex-wrap gap-2">
                {media.cast_str.split(', ').map((actor) => (
                  <span key={actor} className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm">{actor}</span>
                ))}
              </div>
            </div>
          )}

          {/* Director */}
          {media.director && (
            <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Réalisateur</h3>
              <p className="text-white font-medium">{media.director}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {isVideo && (
              <button onClick={scrollToPlayer} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-600/20">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Regarder
              </button>
            )}
            {media.trailer_url && (
              <button onClick={() => setShowTrailer(true)} className="btn-secondary flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Bande-annonce
              </button>
            )}
            <a href={downloadApi.url(media.id)} className="btn-secondary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger
            </a>
          </div>
        </div>
      </div>

      {/* Audio player */}
      {isMusic && (
        <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-800/50">
          <AudioPlayer
            src={downloadApi.url(media.id)}
            title={media.title}
          />
        </div>
      )}

      {/* Trailer modal */}
      {showTrailer && media.trailer_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setShowTrailer(false)}>
          <div className="relative w-full max-w-5xl mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowTrailer(false)} className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src={media.trailer_url + '?autoplay=1'}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Bande-annonce"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
