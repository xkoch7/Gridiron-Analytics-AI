// SAMPLE DATA for page previews until the backend feed is connected.
// Player names are made up; numbers are placeholders, not real projections or odds.

import type { Matchup, PlayerProjection, PropLine } from "@/types";

// ----- Fantasy -----

export interface RosterSpot {
  slot: string;
  player: PlayerProjection & {
    opponent: string;
    status?: "Q" | "O";
    advice?: "Start" | "Sit";
  };
}

const p = (
  playerId: string,
  name: string,
  team: string,
  position: string,
  projectedPoints: number,
  opponent: string,
  extra: Partial<Pick<RosterSpot["player"], "status" | "advice">> = {}
) => ({ playerId, name, team, position, projectedPoints, opponent, ...extra });

export const sampleFantasy = {
  week: 12,
  team: { name: "Your Team", record: "0-0", standing: "—" },
  opponent: { name: "Opponent", record: "0-0", projected: 104.6 },
  winProbability: 0.58,
  starters: [
    { slot: "QB", player: p("1", "Marcus Hill", "BAL", "QB", 21.4, "@CLE", { advice: "Start" }) },
    { slot: "RB", player: p("2", "Devin Brooks", "DET", "RB", 15.2, "vs CHI", { advice: "Start" }) },
    { slot: "RB", player: p("3", "Tyler Owens", "SF", "RB", 12.8, "@SEA", { status: "Q" }) },
    { slot: "WR", player: p("4", "Jalen Rivers", "MIA", "WR", 16.1, "vs NYJ", { advice: "Start" }) },
    { slot: "WR", player: p("5", "Chris Lane", "CIN", "WR", 13.9, "@PIT") },
    { slot: "TE", player: p("6", "Sam Park", "KC", "TE", 9.7, "vs LV") },
    { slot: "FLEX", player: p("7", "Andre Grant", "MIN", "WR", 11.3, "@GB", { advice: "Sit" }) },
    { slot: "D/ST", player: p("8", "Steelers D/ST", "PIT", "D/ST", 7.0, "vs CIN") },
    { slot: "K", player: p("9", "Ricky Diaz", "BUF", "K", 8.5, "vs NE") },
  ] satisfies RosterSpot[],
  bench: [
    { slot: "BE", player: p("10", "Noah Fields", "LAR", "RB", 10.9, "vs ARI", { advice: "Start" }) },
    { slot: "BE", player: p("11", "Isaiah Ward", "TB", "WR", 9.4, "@NO") },
    { slot: "BE", player: p("12", "Cole Bennett", "DEN", "QB", 16.2, "@KC") },
    { slot: "BE", player: p("13", "Luis Ortega", "HOU", "TE", 6.1, "vs IND", { status: "O" }) },
  ] satisfies RosterSpot[],
  waivers: [
    { name: "Kendrick Moss", team: "ATL", position: "RB", rostered: 0.12, projectedPoints: 11.8 },
    { name: "Darius Cole", team: "WAS", position: "WR", rostered: 0.21, projectedPoints: 10.6 },
    { name: "Eli Turner", team: "CAR", position: "TE", rostered: 0.08, projectedPoints: 7.9 },
    { name: "Ravens D/ST", team: "BAL", position: "D/ST", rostered: 0.34, projectedPoints: 8.4 },
  ],
  trades: [
    { give: "Chris Lane (WR)", get: "Devonte Ray (RB)", reason: "Your RB depth is thin with Owens questionable." },
    { give: "Cole Bennett (QB)", get: "Mason Hart (WR)", reason: "Bench QB has more value as a trade chip." },
  ],
};

// ----- Betting -----

export interface Market extends Matchup {
  kickoff: string;
  bookHomeProbability: number;
  spread: { model: number; book: number }; // home team spread
  total: { model: number; book: number };
}

export const sampleMarkets: Market[] = [
  {
    gameId: "g1", awayTeam: "BAL", homeTeam: "CLE", kickoff: "Sun 1:00 PM",
    homeWinProbability: 0.38, bookHomeProbability: 0.42, projectedHomeScore: 19.5, projectedAwayScore: 24.0,
    spread: { model: 4.5, book: 2.5 }, total: { model: 43.5, book: 45.5 },
  },
  {
    gameId: "g2", awayTeam: "KC", homeTeam: "BUF", kickoff: "Sun 4:25 PM",
    homeWinProbability: 0.55, bookHomeProbability: 0.52, projectedHomeScore: 26.0, projectedAwayScore: 24.5,
    spread: { model: -1.5, book: -1.0 }, total: { model: 50.5, book: 48.5 },
  },
  {
    gameId: "g3", awayTeam: "DAL", homeTeam: "PHI", kickoff: "Sun 8:20 PM",
    homeWinProbability: 0.67, bookHomeProbability: 0.6, projectedHomeScore: 27.0, projectedAwayScore: 20.5,
    spread: { model: -6.5, book: -4.5 }, total: { model: 47.5, book: 47.0 },
  },
  {
    gameId: "g4", awayTeam: "SF", homeTeam: "SEA", kickoff: "Mon 8:15 PM",
    homeWinProbability: 0.41, bookHomeProbability: 0.4, projectedHomeScore: 21.0, projectedAwayScore: 23.5,
    spread: { model: 2.5, book: 2.5 }, total: { model: 44.0, book: 46.5 },
  },
];

export const sampleProps: (PropLine & { name: string; team: string; opponent: string })[] = [
  { playerId: "1", name: "Marcus Hill", team: "BAL", opponent: "@CLE", stat: "Passing yards", line: 224.5, projection: 241.0 },
  { playerId: "2", name: "Devin Brooks", team: "DET", opponent: "vs CHI", stat: "Rushing yards", line: 71.5, projection: 64.0 },
  { playerId: "4", name: "Jalen Rivers", team: "MIA", opponent: "vs NYJ", stat: "Receiving yards", line: 68.5, projection: 77.5 },
  { playerId: "6", name: "Sam Park", team: "KC", opponent: "vs LV", stat: "Receptions", line: 4.5, projection: 5.2 },
  { playerId: "14", name: "Trey Wallace", team: "PHI", opponent: "vs DAL", stat: "Rushing TDs", line: 0.5, projection: 0.62 },
  { playerId: "15", name: "Owen Price", team: "SEA", opponent: "vs SF", stat: "Passing TDs", line: 1.5, projection: 1.3 },
];
