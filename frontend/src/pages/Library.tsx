import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { mediaApi } from '../api/client';
import MediaGrid from '../components/MediaGrid';
import SearchBar from '../components/SearchBar';

export default function Library() {
  const { type } = useParams();
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('title');
  const [page, setPage] = useState(1);

  const { data: types } = useQuery({
    queryKey: ['mediaTypes'],
    queryFn: mediaApi.types,
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: mediaApi.genres,
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['media', type, search, genre, sort, page],
    queryFn: () =>
      mediaApi.list({
        media_type: type,
        search: search || undefined,
        genre: genre || undefined,
        sort,
        page,
        per_page: 48,
      }),
  });

  const tabs = [
    { label: 'Tout', path: '/library', active: !type },
    { label: 'Films', path: '/library/movie', active: type === 'movie' },
    { label: 'Séries', path: '/library/tv', active: type === 'tv' },
    { label: 'Musique', path: '/library/music', active: type === 'music' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bibliothèque</h1>
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un titre..." />
      </div>

      <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab.active ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex gap-4">
        {genres && genres.length > 0 && (
          <select
            value={genre}
            onChange={(e) => { setGenre(e.target.value); setPage(1); }}
            className="input w-auto"
          >
            <option value="">Tous les genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        )}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input w-auto"
        >
          <option value="title">Titre (A-Z)</option>
          <option value="year">Année</option>
          <option value="rating">Note</option>
          <option value="recent">Récent</option>
        </select>
      </div>

      <MediaGrid items={items || []} isLoading={isLoading} />
    </div>
  );
}
