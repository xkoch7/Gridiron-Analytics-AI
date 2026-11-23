import type { Metadata } from "next";
import { Badge, PageHead, Panel, ProbabilityBar, SampleNotice, ui } from "@/components/ui/kit";
import { sampleFantasy as data, type RosterSpot } from "@/data/sample";
import styles from "./fantasy.module.css";

export const metadata: Metadata = { title: "Fantasy | Gridiron Analytics AI" };

const sum = (spots: RosterSpot[]) => spots.reduce((total, s) => total + s.player.projectedPoints, 0);

function RosterRows({ spots }: { spots: RosterSpot[] }) {
  return spots.map(({ slot, player }) => (
    <tr key={player.playerId}>
      <td className={styles.slot}>{slot}</td>
      <td>
        <div className={styles.player}>
          <span className={styles.avatar}>{player.position}</span>
          <div>
            <div className={ui.primaryText}>
              {player.name}{" "}
              {player.status && <Badge tone="red">{player.status}</Badge>}
            </div>
            <div className={ui.secondaryText}>
              {player.team} · {player.position}
            </div>
          </div>
        </div>
      </td>
      <td className={ui.muted}>{player.opponent}</td>
      <td className={ui.num}>{player.projectedPoints.toFixed(1)}</td>
      <td className={ui.num}>
        {player.advice === "Start" && <Badge tone="green">Start</Badge>}
        {player.advice === "Sit" && <Badge tone="red">Sit</Badge>}
      </td>
    </tr>
  ));
}

export default function FantasyPage() {
  const projected = sum(data.starters);
  const win = data.winProbability;

  return (
    <>
      <PageHead title="Fantasy" sub="Projections, start/sit calls and moves for your lineup.">
        <div className={styles.weekNav}>
          <button type="button" disabled aria-label="Previous week">‹</button>
          <span>Week {data.week}</span>
          <button type="button" disabled aria-label="Next week">›</button>
        </div>
      </PageHead>

      <SampleNotice />

      {/* Matchup header */}
      <section className={styles.matchup}>
        <div className={styles.side}>
          <span className={styles.teamMark}>YT</span>
          <div>
            <div className={styles.teamName}>{data.team.name}</div>
            <div className={ui.secondaryText}>{data.team.record}</div>
          </div>
          <div className={styles.score}>{projected.toFixed(1)}</div>
        </div>

        <div className={styles.center}>
          <div className={styles.vs}>Projected</div>
          <ProbabilityBar value={win} />
          <div className={styles.winLabels}>
            <span>{Math.round(win * 100)}%</span>
            <span>Win probability</span>
            <span>{Math.round((1 - win) * 100)}%</span>
          </div>
        </div>

        <div className={`${styles.side} ${styles.sideRight}`}>
          <div className={styles.score}>{data.opponent.projected.toFixed(1)}</div>
          <div>
            <div className={styles.teamName}>{data.opponent.name}</div>
            <div className={ui.secondaryText}>{data.opponent.record}</div>
          </div>
          <span className={`${styles.teamMark} ${styles.teamMarkAlt}`}>OP</span>
        </div>
      </section>

      <div className={ui.twoCol}>
        <Panel title="Roster" action={`Projected ${projected.toFixed(1)}`} flush>
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>Player</th>
                  <th>Opp</th>
                  <th className={ui.num}>Proj</th>
                  <th className={ui.num}>Call</th>
                </tr>
              </thead>
              <tbody>
                <tr className={ui.sectionRow}>
                  <td colSpan={5}>Starters</td>
                </tr>
                <RosterRows spots={data.starters} />
                <tr className={ui.sectionRow}>
                  <td colSpan={5}>Bench</td>
                </tr>
                <RosterRows spots={data.bench} />
              </tbody>
            </table>
          </div>
        </Panel>

        <div className={ui.stack}>
          <Panel title="Waiver wire" action="Top adds" flush>
            <ul className={ui.list}>
              {data.waivers.map((w) => (
                <li key={w.name}>
                  <div>
                    <div className={ui.primaryText}>{w.name}</div>
                    <div className={ui.secondaryText}>
                      {w.team} · {w.position} · {Math.round(w.rostered * 100)}% rostered
                    </div>
                  </div>
                  <div className={ui.num}>
                    <div className={ui.primaryText}>{w.projectedPoints.toFixed(1)}</div>
                    <div className={ui.secondaryText}>proj</div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Trade ideas" flush>
            <ul className={ui.list}>
              {data.trades.map((t) => (
                <li key={t.give} className={styles.trade}>
                  <div>
                    <div className={styles.tradeLine}>
                      <Badge tone="red">Give</Badge> {t.give}
                    </div>
                    <div className={styles.tradeLine}>
                      <Badge tone="green">Get</Badge> {t.get}
                    </div>
                    <div className={ui.secondaryText}>{t.reason}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
