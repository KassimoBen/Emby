import type { Media } from '../types';
import MediaCard from './MediaCard';

interface MediaGridProps {
  items: Media[];
  isLoading?: boolean;
}

export default function MediaGrid({ items, isLoading }: MediaGridProps) {
  if (isLoading) {
    return (
      <div className="perspective-1024 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-[2/3] bg-gray-800" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-lg">Aucun média trouvé</p>
        <p className="text-sm mt-1">Lancez un scan depuis la page d'administration</p>
      </div>
    );
  }

  return (
    <div className="perspective-1024 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((media, i) => (
        <div key={media.id} className="animate-fadeIn" style={{ animationDelay: `${(i % 12) * 50}ms`, animationFillMode: 'backwards' }}>
          <MediaCard media={media} />
        </div>
      ))}
    </div>
  );
}
