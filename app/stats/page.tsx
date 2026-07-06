import { notFound } from "next/navigation";
import { getStats } from "@/lib/stats";
import { DocumentId } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOC_NAMES: Record<DocumentId, string> = {
  whitepaper_de: "White Paper (Deutsch)",
  whitepaper_en: "White Paper (English)",
  guidelines: "CleanImplant Guideline",
};

const NAVY = "#0c2f4d";
const BLUE = "#48a5c5";
const MUTED = "#5a7a8f";
const BORDER = "#d6e8f0";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const expected = process.env.STATS_TOKEN;
  if (!expected || token !== expected) {
    notFound();
  }

  const stats = await getStats();
  const docIds = Object.keys(stats.perDoc) as DocumentId[];
  const max = Math.max(1, ...docIds.map((d) => stats.perDoc[d]));

  return (
    <>
      <header>
        <a href="https://www.cleanimplant.com" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cleanimplant-logo-positiv.svg"
            alt="CleanImplant Foundation"
            className="logo-img"
          />
        </a>
      </header>

      <main style={{ display: "block", maxWidth: 720 }}>
        <div className="form-panel" style={{ overflow: "hidden" }}>
          <div className="form-panel-header">
            <p>Download-Statistik</p>
            <h2>{stats.total} Downloads insgesamt</h2>
          </div>

          <div style={{ padding: 28 }}>
            {/* Balken pro Dokument */}
            {docIds.map((d) => (
              <div key={d} style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    color: NAVY,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  <span>{DOC_NAMES[d]}</span>
                  <span>{stats.perDoc[d]}</span>
                </div>
                <div
                  style={{
                    background: "#eef5f9",
                    borderRadius: 100,
                    height: 10,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(stats.perDoc[d] / max) * 100}%`,
                      background: BLUE,
                      height: "100%",
                      borderRadius: 100,
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Downloads pro Tag */}
            {stats.perDay.length > 0 && (
              <>
                <h3
                  style={{
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: MUTED,
                    margin: "28px 0 10px",
                  }}
                >
                  Pro Tag
                </h3>
                <div style={{ fontSize: 13, color: NAVY }}>
                  {stats.perDay
                    .slice(-14)
                    .reverse()
                    .map((row) => (
                      <div
                        key={row.date}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "5px 0",
                          borderBottom: `1px solid ${BORDER}`,
                        }}
                      >
                        <span style={{ color: MUTED }}>{row.date}</span>
                        <span style={{ fontWeight: 600 }}>{row.count}</span>
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* Letzte Downloads */}
            {stats.recent.length > 0 && (
              <>
                <h3
                  style={{
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: MUTED,
                    margin: "28px 0 10px",
                  }}
                >
                  Zuletzt
                </h3>
                <div style={{ fontSize: 13 }}>
                  {stats.recent.map((e, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "5px 0",
                        borderBottom: `1px solid ${BORDER}`,
                        color: NAVY,
                      }}
                    >
                      <span style={{ color: MUTED }}>
                        {new Date(e.t).toLocaleString("de-DE")}
                      </span>
                      <span style={{ fontWeight: 600 }}>{DOC_NAMES[e.d]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {stats.total === 0 && (
              <p style={{ color: MUTED, fontSize: 14 }}>
                Noch keine Downloads erfasst.
              </p>
            )}
          </div>
        </div>
      </main>

      <footer>
        <span className="footer-text">
          © 2026 CleanImplant Foundation · Download-Statistik
        </span>
      </footer>
    </>
  );
}
