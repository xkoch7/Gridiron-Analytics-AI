import Link from "next/link";
import BettingBall from "@/components/landing/BettingBall";
import FantasyField from "@/components/landing/FantasyField";
import LivingRoom from "@/components/landing/LivingRoom";
import styles from "./landing.module.css";

// Fantasy gets its own full-screen chapter with the pixel field
const fantasy = {
  title: "Set the lineup that wins the week.",
  body: "Start/sit calls, waiver pickups and trade ideas, built on matchups, injuries and recent form.",
  points: ["Weekly projected points", "Start/sit recommendations", "Waiver wire and trade ideas", "Lineup optimization"],
};

// Betting gets its own full-screen chapter with the 3D football
const betting = {
  title: "Check the model against the line.",
  body: "Win probabilities, projected scores and player props, side by side with sportsbook odds so you can spot value.",
  points: ["Win probability and projected score", "Point spreads for every game", "Player prop projections", "Model vs. sportsbook comparison"],
};

// Team Stats gets its own full-screen chapter with the 3D living room
const teams = {
  title: "Every team, broken down.",
  body: "Live scores, historical stats and injury news for all 32 teams, updated as games happen.",
  points: ["Real-time game stats and scores", "Historical team performance", "Injury and roster news", "Predictions that update in-game"],
};

export default function LandingPage() {
  return (
    <div className={`${styles.page} full-bleed`}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>AI-powered NFL predictions</p>
          <h1 className={styles.heroTitle}>Win the week before kickoff.</h1>
          <p className={styles.heroSub}>
            Gridiron Analytics turns real-time and historical stats into projections for your fantasy
            lineup and every game on the slate.
          </p>
          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primary}>
              Get started free
            </Link>
            <a href="#chapter-01" className={styles.secondary}>
              See what&apos;s inside
            </a>
          </div>
        </div>

        <ol className={styles.toc} aria-label="Chapters">
          {[
            { number: "01", label: "Fantasy" },
            { number: "02", label: "Betting Assistant" },
            { number: "03", label: "Team Stats" },
          ].map((c) => (
            <li key={c.number}>
              <a href={`#chapter-${c.number}`}>
                <span className={styles.tocNumber}>{c.number}</span>
                {c.label}
              </a>
            </li>
          ))}
        </ol>
      </section>

      <section id="chapter-01" className={styles.feature}>
        <div className={styles.featureHead}>
          <p className={styles.chapterLabel}>
            <span className={styles.chapterNumber}>01</span>
            Fantasy
          </p>
          <h2 className={styles.chapterTitle}>{fantasy.title}</h2>
          <p className={styles.chapterBody}>{fantasy.body}</p>
        </div>

        {/* The whole field links to the Fantasy page; it grows and glows on hover */}
        <Link href="/fantasy" className={styles.fieldLink} aria-label="Open Fantasy">
          <FantasyField />
        </Link>

        <ul className={styles.featurePoints}>
          {fantasy.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section id="chapter-02" className={styles.feature}>
        <div className={styles.featureHead}>
          <p className={styles.chapterLabel}>
            <span className={styles.chapterNumber}>02</span>
            Betting Assistant
          </p>
          <h2 className={styles.chapterTitle}>{betting.title}</h2>
          <p className={styles.chapterBody}>{betting.body}</p>
        </div>

        {/* Floats and spins; flips and locks into place on hover */}
        <BettingBall />

        <ul className={styles.featurePoints}>
          {betting.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <Link href="/betting" className={styles.chapterLink}>
          Open Betting Assistant <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section id="chapter-03" className={styles.feature}>
        <div className={styles.featureHead}>
          <p className={styles.chapterLabel}>
            <span className={styles.chapterNumber}>03</span>
            Team Stats
          </p>
          <h2 className={styles.chapterTitle}>{teams.title}</h2>
          <p className={styles.chapterBody}>{teams.body}</p>
        </div>

        {/* Game day in the living room; the camera drifts toward the pointer */}
        <LivingRoom />

        <ul className={styles.featurePoints}>
          {teams.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <Link href="/teams" className={styles.chapterLink}>
          Open Team Stats <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className={styles.final}>
        <h2 className={styles.finalTitle}>Ready for kickoff?</h2>
        <p className={styles.finalSub}>Create a free account to save your teams and get personalized predictions.</p>
        <Link href="/login" className={styles.primary}>
          Create your account
        </Link>
        <p className={styles.disclaimer}>
          Predictions are for entertainment and research. Please bet responsibly.
        </p>
      </section>
    </div>
  );
}
