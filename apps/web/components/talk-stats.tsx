"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchRoomStats, isAuthError, type RoomStats } from "@/lib/personae";
import { IconX } from "./icons";

type Unit = "day" | "week" | "month";
type DayStat = { date: string; count: number };

// Monday (ISO week start) of a YYYY-MM-DD date, as YYYY-MM-DD.
function weekStart(s: string): string {
  const d = new Date(`${s}T00:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

// Aggregate per-day counts into the chosen unit.
function bucketByUnit(perDay: DayStat[], unit: Unit) {
  if (unit === "day")
    return perDay.map((d) => ({ label: d.date.slice(5), count: d.count }));
  const sums = new Map<string, number>();
  for (const d of perDay) {
    const key = unit === "month" ? d.date.slice(0, 7) : weekStart(d.date);
    sums.set(key, (sums.get(key) ?? 0) + d.count);
  }
  return [...sums.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, count]) => ({
      label: unit === "month" ? k.slice(2) : k.slice(5),
      count,
    }));
}

// Default unit by how wide the date range is.
function defaultUnit(perDay: DayStat[]): Unit {
  if (perDay.length < 2) return "day";
  const span =
    (Date.parse(perDay[perDay.length - 1].date) - Date.parse(perDay[0].date)) /
    86_400_000;
  return span <= 45 ? "day" : span <= 365 ? "week" : "month";
}

const UNIT_LABEL: Record<Unit, string> = { day: "일", week: "주", month: "월" };

const axis = { fontSize: 10, fill: "var(--muted)" } as const;
const tooltipStyle = {
  background: "var(--bg-2)",
  border: "1px solid var(--line)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--fg)",
};

export default function TalkStats({
  roomId,
  onClose,
}: {
  roomId: number;
  onClose: () => void;
}) {
  const [stats, setStats] = useState<RoomStats | null>(null);
  const [err, setErr] = useState(false);
  const [unit, setUnit] = useState<Unit>("day");

  useEffect(() => {
    let alive = true;
    fetchRoomStats(roomId)
      .then((s) => {
        if (!alive) return;
        setStats(s);
        setUnit(defaultUnit(s.perDay));
      })
      .catch((e) => {
        if (!isAuthError(e) && alive) setErr(true);
      });
    return () => {
      alive = false;
    };
  }, [roomId]);

  const series = useMemo(
    () => (stats ? bucketByUnit(stats.perDay, unit) : []),
    [stats, unit],
  );

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/65 sm:items-center sm:p-4"
      onClick={onClose}
      // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click to close
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        // biome-ignore lint/a11y/noStaticElementInteractions: stop backdrop close
        role="presentation"
        className="pb-safe sheet-up flex max-h-[88vh] w-full max-w-lg flex-col overflow-y-auto rounded-t-2xl border border-[var(--line)] bg-[var(--bg-2)] shadow-2xl sm:max-h-[85vh] sm:rounded-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg-2)] px-5 py-4">
          <span className="font-display text-lg">통계</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-[var(--muted)] hover:text-[var(--fg)]"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {err && (
            <p className="font-mono text-[12px] text-[var(--muted)]">
              통계를 불러오지 못했어요.
            </p>
          )}
          {!err && !stats && (
            <p className="font-mono text-[12px] tracking-[0.2em] text-[var(--muted)]">
              집계 중…
            </p>
          )}
          {stats && (
            <>
              <div className="flex items-end gap-3">
                <span className="font-display text-5xl leading-none">
                  {stats.total.toLocaleString()}
                </span>
                <span className="pb-1 font-mono text-[11px] tracking-[0.2em] text-[var(--muted)]">
                  TOTAL MESSAGES
                </span>
              </div>

              <section>
                <h3 className="mb-2 font-mono text-[10px] tracking-[0.3em] text-[var(--muted)]">
                  참여자별
                </h3>
                {stats.perPersona.length === 0 ? (
                  <p className="font-mono text-[11px] text-[var(--muted)]">
                    데이터 없음
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={stats.perPersona}
                      margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid stroke="var(--line)" vertical={false} />
                      <XAxis dataKey="name" tick={axis} tickLine={false} />
                      <YAxis
                        tick={axis}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={{ fill: "var(--hover)" }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {stats.perPersona.map((p) => (
                          <Cell key={p.personaId} fill={p.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-mono text-[10px] tracking-[0.3em] text-[var(--muted)]">
                    기간별
                  </h3>
                  <div className="flex gap-1">
                    {(["day", "week", "month"] as Unit[]).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors ${
                          unit === u
                            ? "border-[var(--fg)] text-[var(--fg)]"
                            : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
                        }`}
                      >
                        {UNIT_LABEL[u]}
                      </button>
                    ))}
                  </div>
                </div>
                {series.length === 0 ? (
                  <p className="font-mono text-[11px] text-[var(--muted)]">
                    데이터 없음
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={series}
                      margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid stroke="var(--line)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={axis}
                        tickLine={false}
                        minTickGap={24}
                      />
                      <YAxis
                        tick={axis}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#27e8a7"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
