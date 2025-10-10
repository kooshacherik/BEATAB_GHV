// src/hooks/useSongs.js
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function useSongs({ q, artistId, limit = 500 } = {}) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data } = await axios.get('/api/songs', {
          params: { q, artistId, limit },
        });
        if (!cancelled) setSongs(data?.data || []);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [q, artistId, limit]);

  return { songs, loading, err };
}