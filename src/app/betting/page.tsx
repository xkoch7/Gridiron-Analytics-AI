import type { Metadata } from "next";
import { Badge, PageHead, Panel, ProbabilityBar, SampleNotice, Tabs, ui } from "@/components/ui/kit";
import { teamName } from "@/data/nflTeams";
import { sampleMarkets, sampleProps, type Market } from "@/data/sample";
import styles from "./betting.module.css";

export const metadata: Metadata = { title: "Betting Assistant | Gridiron Analytics AI" };

const pct = (x: number) => `${Math.round(x * 100)}%`;
const line = (n: number) => (n === 0 ? "PK" : n > 0 ? `+${n}` : `${n}`);
const signedPct = (x: number) => `${x > 0 ? "+" : ""}${Math.round(x * 100)}%`;

// Where the model disagrees with the book, and which side that favors
function spreadLean(m: Market) {
  if (m.spread.model === m.spread.book) return null;
  return m.spread.model > m.spread.book
    ? `${m.awayTeam} ${line(-m.spread.book)}`
    : `${m.homeTeam} ${line(m.spread.book)}`;
}
function totalLean(m: Market) {
  if (m.total.model === m.total.book) return null;
  return `${m.total.model > m.total.book ? "Over" : "Under"} ${m.total.book}`;
}
function bestSide(m: Market) {
  const homeEdge = m.homeWinProbability - m.bookHomeProbability;
  return homeEdge >= 0
    ? { team: m.homeTeam, edge: homeEdge, model: m.homeWinProbability }
    : { team: m.awayTeam, edge: -homeEdge, model: 1 - m.homeWinProbability };
}

function Outcome({ team, model, book }: { team: string; model: number; book: number }) {
  const edge = model - book;
  return (
    <div className={styles.outcome}>
      <div className={styles.outcomeTeam}>
        <span className={styles.abbr}>{team}</span>
        <span>{teamName(team)}</span>
      </div>
      <div className={styles.outcomeNumbers}>
        <span className={styles.modelPct}>{pct(model)}</span>
        <span className={ui.muted}>Book {pct(book)}</span>
        {Math.abs(edge) >= 0.02 && <Badge tone={edge > 0 ? "green" : "neutral"}>{signedPct(edge)}</Badge>}
      </div>
      <ProbabilityBar value={model} color={edge >= 0.02 ? "#2fb36d" : undefined} />
    </div>
  );
}

function MarketCard({ m }: { m: Market }) {
  const spread = spreadLean(m);
  const total = totalLean(m);
  return (
    <article className={styles.card}>
      <header className={styles.cardHead}>
        <span className={ui.primaryText}>
          {m.awayTeam} @ {m.homeTeam}
        </span>
        <span className={ui.muted}>{m.kickoff}</span>
      </header>

      <div className={styles.label}>Win probability · Model vs book</div>
      <Outcome team={m.awayTeam} model={1 - m.homeWinProbability} book={1 - m.bookHomeProbability} />
      <Outcome team={m.homeTeam} model={m.homeWinProbability} book={m.bookHomeProbability} />

      <div className={styles.lines}>
        <div>
          <div className={styles.label}>Spread ({m.homeTeam})</div>
          <div className={styles.lineValues}>
            <span>Model {line(m.spread.model)}</span>
            <span className={ui.muted}>Book {line(m.spread.book)}</span>
          </div>
          {spread ? <Badge tone="blue">Lean {spread}</Badge> : <Badge>No edge</Badge>}
        </div>
        <div>
          <div className={styles.label}>Total points</div>
          <div className={styles.lineValues}>
            <span>Model {m.total.model}</span>
            <span className={ui.muted}>Book {m.total.book}</span>
          </div>
          {total ? <Badge tone="blue">Lean {total}</Badge> : <Badge>No edge</Badge>}
        </div>
      </div>

      <div className={styles.projected}>
        Projected score: {m.awayTeam} {m.projectedAwayScore} – {m.homeTeam} {m.projectedHomeScore}
      </div>
    </article>
  );
}

export default async function BettingPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const active = view === "props" ? "props" : "games";
  const edges = sampleMarkets.map((m) => ({ m, ...bestSide(m) })).sort((a, b) => b.edge - a.edge);

  return (
    <>
      <PageHead title="Betting Assistant" sub="Our model's numbers next to the sportsbook lines, so you can spot value." />

      <Tabs
        active={active}
        tabs={[
          { key: "games", label: "Games", href: "/betting" },
          { key: "props", label: "Player props", href: "/betting?view=props" },
        ]}
      />

      <SampleNotice />

      <div className={ui.twoCol}>
        {active === "games" ? (
          <div className={styles.grid}>
            {sampleMarkets.map((m) => (
              <MarketCard key={m.gameId} m={m} />
            ))}
          </div>
        ) : (
          <Panel title="Player props" action="Model vs line" flush>
            <div className={ui.tableWrap}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Stat</th>
                    <th className={ui.num}>Line</th>
                    <th className={ui.num}>Model</th>
                    <th className={ui.num}>Lean</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleProps.map((prop) => {
                    const over = prop.projection > prop.line;
                    return (
                      <tr key={prop.playerId + prop.stat}>
                        <td>
                          <div className={ui.primaryText}>{prop.name}</div>
                          <div className={ui.secondaryText}>
                            {prop.team} {prop.opponent}
                          </div>
                        </td>
                        <td>{prop.stat}</td>
                        <td className={ui.num}>{prop.line}</td>
                        <td className={ui.num}>{prop.projection}</td>
                        <td className={ui.num}>
                          <Badge tone={over ? "green" : "red"}>{over ? "Over" : "Under"}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        <div className={ui.stack}>
          <Panel title="Biggest edges" action="Moneyline" flush>
            <ul className={ui.list}>
              {edges.map(({ m, team, edge, model }) => (
                <li key={m.gameId}>
                  <div>
                    <div className={ui.primaryText}>{teamName(team)}</div>
                    <div className={ui.secondaryText}>
                      {m.awayTeam} @ {m.homeTeam} · Model {pct(model)}
                    </div>
                  </div>
                  <Badge tone={edge >= 0.02 ? "green" : "neutral"}>{signedPct(edge)}</Badge>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="How to read this">
            <p className={styles.help}>
              <strong>Model</strong> is our win probability. <strong>Book</strong> is the probability implied by
              sportsbook odds. A green edge means the model rates that side higher than the book does.
            </p>
            <p className={styles.disclaimer}>
              For entertainment and research only. Please bet responsibly. If you or someone you know has a gambling
              problem, call 1-800-GAMBLER.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
