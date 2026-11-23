// All 32 NFL teams by conference and division

export interface NflTeam {
  abbr: string;
  name: string;
  conference: "AFC" | "NFC";
  division: "East" | "North" | "South" | "West";
}

const t = (abbr: string, name: string, conference: NflTeam["conference"], division: NflTeam["division"]): NflTeam => ({
  abbr,
  name,
  conference,
  division,
});

export const nflTeams: NflTeam[] = [
  t("BUF", "Buffalo Bills", "AFC", "East"),
  t("MIA", "Miami Dolphins", "AFC", "East"),
  t("NE", "New England Patriots", "AFC", "East"),
  t("NYJ", "New York Jets", "AFC", "East"),
  t("BAL", "Baltimore Ravens", "AFC", "North"),
  t("CIN", "Cincinnati Bengals", "AFC", "North"),
  t("CLE", "Cleveland Browns", "AFC", "North"),
  t("PIT", "Pittsburgh Steelers", "AFC", "North"),
  t("HOU", "Houston Texans", "AFC", "South"),
  t("IND", "Indianapolis Colts", "AFC", "South"),
  t("JAX", "Jacksonville Jaguars", "AFC", "South"),
  t("TEN", "Tennessee Titans", "AFC", "South"),
  t("DEN", "Denver Broncos", "AFC", "West"),
  t("KC", "Kansas City Chiefs", "AFC", "West"),
  t("LV", "Las Vegas Raiders", "AFC", "West"),
  t("LAC", "Los Angeles Chargers", "AFC", "West"),
  t("DAL", "Dallas Cowboys", "NFC", "East"),
  t("NYG", "New York Giants", "NFC", "East"),
  t("PHI", "Philadelphia Eagles", "NFC", "East"),
  t("WAS", "Washington Commanders", "NFC", "East"),
  t("CHI", "Chicago Bears", "NFC", "North"),
  t("DET", "Detroit Lions", "NFC", "North"),
  t("GB", "Green Bay Packers", "NFC", "North"),
  t("MIN", "Minnesota Vikings", "NFC", "North"),
  t("ATL", "Atlanta Falcons", "NFC", "South"),
  t("CAR", "Carolina Panthers", "NFC", "South"),
  t("NO", "New Orleans Saints", "NFC", "South"),
  t("TB", "Tampa Bay Buccaneers", "NFC", "South"),
  t("ARI", "Arizona Cardinals", "NFC", "West"),
  t("LAR", "Los Angeles Rams", "NFC", "West"),
  t("SF", "San Francisco 49ers", "NFC", "West"),
  t("SEA", "Seattle Seahawks", "NFC", "West"),
];

export const teamName = (abbr: string) => nflTeams.find((team) => team.abbr === abbr)?.name ?? abbr;
