"use client";

import { useEffect, useState } from "react";

type Player = {
  player_id: string;
  name: string;
  team: string;
  position: string;
  projected_points: number;
};

export default function FantasyPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/fantasy/projections")
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: "white" }}>Loading projections...</div>;

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", color: "white" }}>
      <h1>Fantasy Projections (ML)</h1>
      <p>Top projected players this week</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #555", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Pos</th>
            <th style={{ padding: 8 }}>Team</th>
            <th style={{ padding: 8 }}>Projected Pts</th>
          </tr>
        </thead>
        <tbody>
          {players.slice(0, 50).map((p) => (
            <tr key={p.player_id} style={{ borderBottom: "1px solid #333" }}>
              <td style={{ padding: 8 }}>{p.name}</td>
              <td style={{ padding: 8 }}>{p.position}</td>
              <td style={{ padding: 8 }}>{p.team}</td>
              <td style={{ padding: 8 }}>{p.projected_points.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
