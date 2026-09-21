import { useEffect, useState } from "react";
import { getTournaments } from "../services/tournaments/tournamentService.js";

export function useTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadTournaments() {
      try {
        setLoading(true);
        setError(null);

        const data = await getTournaments();

        if (active) {
          setTournaments(data);
        }
      } catch (err) {
        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTournaments();

    const refreshTimer = window.setInterval(loadTournaments, 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  return {
    tournaments,
    loading,
    error,
  };
}
