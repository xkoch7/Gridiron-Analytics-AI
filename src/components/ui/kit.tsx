import Link from "next/link";
import ui from "./ui.module.css";

// Small shared building blocks for the app pages

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className={ui.pageHead}>
      <div>
        <h1 className={ui.pageTitle}>{title}</h1>
        {sub && <p className={ui.pageSub}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  flush = false,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  // Flush panels have no inner padding (for tables and lists)
  flush?: boolean;
}) {
  return (
    <section className={ui.panel}>
      <div className={ui.panelHead}>
        <h2 className={ui.panelTitle}>{title}</h2>
        {action && <div className={ui.panelAction}>{action}</div>}
      </div>
      {flush ? children : <div className={ui.panelBody}>{children}</div>}
    </section>
  );
}

const badgeTone = {
  green: ui.badgeGreen,
  red: ui.badgeRed,
  blue: ui.badgeBlue,
  neutral: ui.badgeNeutral,
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof badgeTone; children: React.ReactNode }) {
  return <span className={`${ui.badge} ${badgeTone[tone]}`}>{children}</span>;
}

export function Tabs({ tabs, active }: { tabs: { label: string; href: string; key: string }[]; active: string }) {
  return (
    <nav className={ui.tabs}>
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} className={`${ui.tab} ${t.key === active ? ui.tabActive : ""}`} scroll={false}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function SampleNotice({ children }: { children?: React.ReactNode }) {
  return (
    <p className={ui.notice}>
      <Badge tone="blue">Preview</Badge>
      {children ?? "Showing sample data. Live numbers will appear here once the data feed is connected."}
    </p>
  );
}

export function ProbabilityBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className={ui.bar} role="img" aria-label={`${Math.round(value * 100)}%`}>
      <div className={ui.barFill} style={{ width: `${value * 100}%`, background: color }} />
    </div>
  );
}

export { ui };
