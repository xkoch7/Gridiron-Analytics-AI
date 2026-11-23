import type { Metadata } from "next";
import { PageHead, Panel, SampleNotice, Tabs, ui } from "@/components/ui/kit";
import { nflTeams, type NflTeam } from "@/data/nflTeams";
import styles from "./teams.module.css";

export const metadata: Metadata = { title: "Team Stats | Gridiron Analytics AI" };

const DIVISIONS: NflTeam["division"][] = ["East", "North", "South", "West"];
const COLUMNS = ["W", "L", "T", "PCT", "PF", "PA", "STRK"];

// League leaders, filled in once season data is connected
const LEADERS = ["Points per game", "Fewest points allowed", "Total yards per game", "Turnover differential"];

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ conf?: string }> }) {
  const { conf } = await searchParams;
  const active = conf === "AFC" || conf === "NFC" ? conf : "ALL";
  const conferences = active === "ALL" ? (["AFC", "NFC"] as const) : ([active] as const);

  return (
    <>
      <PageHead title="Team Stats" sub="Standings, scores and team trends for all 32 teams." />

      <Tabs
        active={active}
        tabs={[
          { key: "ALL", label: "All teams", href: "/teams" },
          { key: "AFC", label: "AFC", href: "/teams?conf=AFC" },
          { key: "NFC", label: "NFC", href: "/teams?conf=NFC" },
        ]}
      />

      <SampleNotice>Standings and stats will fill in once the season data feed is connected.</SampleNotice>

      <section className={styles.leaders}>
        {LEADERS.map((label) => (
          <div key={label} className={styles.leader}>
            <div className={styles.leaderLabel}>{label}</div>
            <div className={styles.leaderValue}>—</div>
            <div className={ui.secondaryText}>League leader</div>
          </div>
        ))}
      </section>

      {conferences.map((c) => (
        <section key={c} className={styles.conference}>
          <h2 className={styles.conferenceTitle}>{c}</h2>
          <div className={styles.divisions}>
            {DIVISIONS.map((d) => (
              <Panel key={d} title={`${c} ${d}`} flush>
                <div className={ui.tableWrap}>
                  <table className={`${ui.table} ${styles.compact}`}>
                    <thead>
                      <tr>
                        <th>Team</th>
                        {COLUMNS.map((col) => (
                          <th key={col} className={ui.num}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nflTeams
                        .filter((team) => team.conference === c && team.division === d)
                        .map((team) => (
                          <tr key={team.abbr}>
                            <td>
                              <div className={styles.team}>
                                <span className={styles.abbr}>{team.abbr}</span>
                                <span className={styles.teamName}>{team.name}</span>
                              </div>
                            </td>
                            {COLUMNS.map((col) => (
                              <td key={col} className={`${ui.num} ${ui.muted}`}>
                                —
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
