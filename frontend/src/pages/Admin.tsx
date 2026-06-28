import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scanApi, authApi, configApi } from '../api/client';

export default function Admin() {
  const [scanPath, setScanPath] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [rescraping, setRescraping] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: configApi.get,
  });

  useEffect(() => {
    if (config?.media_dir && !scanPath) {
      setScanPath(config.media_dir);
    }
  }, [config]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  const { data: scans, refetch: refetchScans } = useQuery({
    queryKey: ['scans'],
    queryFn: scanApi.status,
    refetchInterval: 5000,
  });

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.listUsers,
  });

  const handleScan = async () => {
    if (!scanPath.trim()) return;
    setScanning(true);
    setScanError('');
    try {
      await scanApi.start(scanPath.trim());
      setScanPath('');
    } catch (err: any) {
      setScanError(err.response?.data?.detail || 'Erreur lors du scan');
    } finally {
      setScanning(false);
      refetchScans();
    }
  };

  const handleAddUser = async () => {
    if (!newUsername || !newPassword) return;
    try {
      await authApi.register(newUsername, newPassword, newRole);
      setNewUsername('');
      setNewPassword('');
      setNewRole('viewer');
      refetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur');
    }
  };

  const lastScan = scans && scans.length > 0 ? scans[0] : null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Administration</h1>

      <section className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Scan de la bibliothèque</h2>
        <p className="text-sm text-gray-500 mb-3">Configure <code className="text-primary-400">MEDIA_DIR</code> dans <code className="text-primary-400">backend\.env</code> ou entre un chemin ci-dessous</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={scanPath}
            onChange={(e) => setScanPath(e.target.value)}
            placeholder="D:\Mes\Films"
            className="input flex-1 font-mono text-sm"
          />
          <button
            onClick={handleScan}
            disabled={scanning || !scanPath.trim()}
            className="btn-primary"
          >
            {scanning ? 'Scan en cours...' : 'Lancer le scan'}
          </button>
        </div>
        {scanError && <p className="text-red-400 text-sm mt-2">{scanError}</p>}

        <div className="mt-4">
          <button
            onClick={async () => {
              setRescraping(true);
              try {
                await scanApi.rescrape();
              } finally {
                setRescraping(false);
              }
            }}
            disabled={rescraping}
            className="btn-secondary"
          >
            {rescraping ? 'Mise à jour...' : 'Re-scraper les métadonnées manquantes'}
          </button>
        </div>

        {lastScan && (
          <div className="mt-4 bg-gray-800 rounded-lg p-4 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-500">Dossier</p>
                <p className="font-mono text-xs truncate">{lastScan.scan_path}</p>
              </div>
              <div>
                <p className="text-gray-500">Statut</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  lastScan.status === 'completed' ? 'bg-green-900 text-green-400' :
                  lastScan.status === 'running' ? 'bg-blue-900 text-blue-400' :
                  'bg-red-900 text-red-400'
                }`}>
                  {lastScan.status}
                </span>
              </div>
              <div>
                <p className="text-gray-500">Fichiers trouvés</p>
                <p className="font-semibold">{lastScan.files_found}</p>
              </div>
              <div>
                <p className="text-gray-500">Identifiés / Scrapés</p>
                <p className="font-semibold">{lastScan.files_identified} / {lastScan.files_scraped}</p>
              </div>
            </div>
            {lastScan.error_message && (
              <p className="text-red-400 mt-2">{lastScan.error_message}</p>
            )}
          </div>
        )}
      </section>

      <section className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Historique des scans</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4">Date</th>
                <th className="text-left py-2 pr-4">Dossier</th>
                <th className="text-left py-2 pr-4">Trouvés</th>
                <th className="text-left py-2 pr-4">Identifiés</th>
                <th className="text-left py-2 pr-4">Statut</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scans?.map((s) => (
                <tr key={s.id} className="border-b border-gray-800/50">
                  <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">{new Date(s.started_at).toLocaleString()}</td>
                  <td className="py-2 pr-4 font-mono text-xs max-w-xs truncate">{s.scan_path}</td>
                  <td className="py-2 pr-4">{s.files_found}</td>
                  <td className="py-2 pr-4">{s.files_identified}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs font-medium ${
                      s.status === 'completed' ? 'text-green-400' :
                      s.status === 'running' ? 'text-blue-400' : 'text-red-400'
                    }`}>{s.status}</span>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={async () => {
                        if (confirm('Supprimer ce scan ?')) {
                          await scanApi.delete(s.id);
                          refetchScans();
                        }
                      }}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {(!scans || scans.length === 0) && (
                <tr><td colSpan={6} className="py-4 text-center text-gray-600">Aucun scan effectué</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Gestion des utilisateurs</h2>
        <div className="flex gap-3 items-end mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nom d'utilisateur</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rôle</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="input"
            >
              <option value="viewer">Viewer</option>
              <option value="downloader">Downloader</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button onClick={handleAddUser} className="btn-primary">Ajouter</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4">Utilisateur</th>
                <th className="text-left py-2 pr-4">Rôle</th>
                <th className="text-left py-2 pr-4">Actif</th>
                <th className="text-left py-2">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/50">
                  <td className="py-2 pr-4">{u.username}</td>
                  <td className="py-2 pr-4 capitalize">{u.role}</td>
                  <td className="py-2 pr-4">{u.is_active ? '✓' : '✗'}</td>
                  <td className="py-2 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
