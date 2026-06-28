export interface Media {
  id: number;
  title: string;
  original_title: string | null;
  year: number | null;
  media_type: 'movie' | 'tv' | 'music';
  file_path: string;
  file_size: number;
  file_extension: string;
  duration: number | null;
  resolution: string | null;
  codec: string | null;
  description: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  rating: number | null;
  genres: string | null;
  cast_str: string | null;
  director: string | null;
  tmdb_id: number | null;
  trailer_url: string | null;
  musicbrainz_id: string | null;
  nfo_path: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ScanStatus {
  id: number;
  scan_path: string;
  files_found: number;
  files_identified: number;
  files_scraped: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface User {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface MediaStats {
  total: number;
  movies: number;
  tv: number;
  music: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
