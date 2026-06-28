import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { mediaApi } from '../api/client';
import MediaGrid from '../components/MediaGrid';

export default function Home() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: mediaApi.stats,
  });

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ['media', 'recent'],
    queryFn: () => mediaApi.list({ sort: 'recent', per_page: 12 }),
  });

  const { data: topRated, isLoading: topLoading } = useQuery({
    queryKey: ['media', 'top'],
    queryFn: () => mediaApi.list({ sort: 'rating', per_page: 12 }),
  });

  const statCards = [
    { label: 'Total', value: stats?.total, color: 'from-primary-600 to-primary-900', border: 'border-primary-500/30', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', link: '/library' },
    { label: 'Films', value: stats?.movies, color: 'from-blue-600 to-blue-900', border: 'border-blue-500/30', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z', link: '/library/movie' },
    { label: 'Séries', value: stats?.tv, color: 'from-green-600 to-green-900', border: 'border-green-500/30', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', link: '/library/tv' },
    { label: 'Musique', value: stats?.music, color: 'from-purple-600 to-purple-900', border: 'border-purple-500/30', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3', link: '/library/music' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Accueil</h1>
          <p className="text-gray-500 mt-1">Bienvenue sur votre serveur multimédia</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Link
              key={card.label}
              to={card.link}
              className={`relative overflow-hidden bg-gradient-to-br ${card.color} rounded-xl p-5 border ${card.border} hover:scale-[1.03] transition-all duration-300 shadow-lg group`}
            >
              <svg className="absolute right-2 top-2 w-12 h-12 text-white/5 group-hover:text-white/10 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d={card.icon} />
              </svg>
              <p className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{card.value}</p>
              <p className="text-sm text-white/70 mt-1 font-medium">{card.label}</p>
            </Link>
          ))}
        </div>
      )}

      {recent && recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Ajoutés récemment</h2>
            <Link to="/library?sort=recent" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">Voir tout</Link>
          </div>
          <MediaGrid items={recent} isLoading={recentLoading} />
        </section>
      )}

      {topRated && topRated.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Mieux notés</h2>
            <Link to="/library?sort=rating" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">Voir tout</Link>
          </div>
          <MediaGrid items={topRated} isLoading={topLoading} />
        </section>
      )}
    </div>
  );
}
