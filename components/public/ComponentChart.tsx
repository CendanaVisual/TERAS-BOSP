"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { formatRupiah, formatRupiahCompact } from "@/lib/bosp-constants";
import type { ComponentBreakdownItem } from "@/lib/bosp-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ComponentChartProps {
  breakdown: ComponentBreakdownItem[];
  selectedComponent: string;
  onSelectComponent: (component: string) => void;
}

const emptySubscribe = () => () => {};

export function ComponentChart({
  breakdown,
  selectedComponent,
  onSelectComponent,
}: ComponentChartProps) {
  const [chartMode, setChartMode] = useState<"bar" | "pie">("bar");
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const activeItems = breakdown.filter(
    (item) => item.realizedAmount > 0 || item.plannedAmount > 0
  );

  return (
    <Card className="print-break-inside-avoid">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#EFE6D5] pb-4">
        <div>
          <CardTitle>Infografis Realisasi per 12 Komponen Standar BOSP</CardTitle>
          <CardDescription>
            Perbandingan anggaran RKAS dan realisasi belanja sesuai Permendikbudristek Juknis BOSP. Klik komponen untuk memfilter tabel.
          </CardDescription>
        </div>
        <div className="inline-flex rounded-xl border border-[#E1D5BE] bg-[#F5EFE3] p-1 self-start no-print">
          <button
            type="button"
            onClick={() => setChartMode("bar")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              chartMode === "bar"
                ? "bg-[#141923] text-[#F4E6C3] shadow-xs"
                : "text-[#5C5446] hover:text-[#141923]"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Grafik Batang
          </button>
          <button
            type="button"
            onClick={() => setChartMode("pie")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              chartMode === "pie"
                ? "bg-[#141923] text-[#F4E6C3] shadow-xs"
                : "text-[#5C5446] hover:text-[#141923]"
            }`}
          >
            <PieChartIcon className="h-3.5 w-3.5" />
            Grafik Donat
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 min-h-[340px] flex items-center justify-center rounded-2xl border border-[#EAE0CE] bg-[#FAF6EE]/70 p-3">
            {!mounted ? (
              <div className="text-sm text-[#8B806D]">Memuat grafik...</div>
            ) : activeItems.length === 0 ? (
              <div className="text-sm text-[#6B6253]">
                Belum ada rincian belanja pada periode ini.
              </div>
            ) : chartMode === "bar" ? (
              <ResponsiveContainer width="100%" height={330}>
                <BarChart
                  data={activeItems}
                  margin={{ top: 12, right: 16, left: 6, bottom: 56 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5DAC5" />
                  <XAxis
                    dataKey="shortLabel"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={70}
                    tick={{ fontSize: 11, fill: "#4A4337" }}
                  />
                  <YAxis
                    tickFormatter={(val) =>
                      formatRupiahCompact(Number(val)).replace("Rp ", "")
                    }
                    tick={{ fontSize: 11, fill: "#4A4337" }}
                  />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [
                      formatRupiah(Number(value ?? 0)),
                      name === "plannedAmount" ? "Anggaran (RKAS)" : "Realisasi",
                    ]}
                    labelFormatter={(label) => `Komponen: ${label}`}
                    contentStyle={{
                      borderRadius: "12px",
                      borderColor: "#D9C9A8",
                      backgroundColor: "#FFFDF9",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "plannedAmount"
                        ? "Anggaran (RKAS)"
                        : "Realisasi Belanja"
                    }
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                  <Bar
                    dataKey="plannedAmount"
                    fill="#B8AE9B"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                  <Bar
                    dataKey="realizedAmount"
                    fill="#0D6E52"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={330}>
                <PieChart>
                  <Pie
                    data={activeItems}
                    dataKey="realizedAmount"
                    nameKey="shortLabel"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={118}
                    paddingAngle={2}
                  >
                    {activeItems.map((entry) => (
                      <Cell key={entry.component} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown) => [
                      formatRupiah(Number(value ?? 0)),
                      "Realisasi",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      borderColor: "#D9C9A8",
                      backgroundColor: "#FFFDF9",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="lg:col-span-5 space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {breakdown.map((item, idx) => {
              const isSelected = selectedComponent === item.component;
              return (
                <button
                  key={item.component}
                  type="button"
                  onClick={() =>
                    onSelectComponent(isSelected ? "ALL" : item.component)
                  }
                  className={`w-full text-left rounded-xl border px-3.5 py-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#B8862D] bg-[#FAF1DE] ring-1 ring-[#C9A24D]"
                      : "border-[#EAE0CE] bg-white hover:border-[#D4C29E] hover:bg-[#FAF5EB]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-semibold text-[#1E2430] truncate">
                        {idx + 1}. {item.shortLabel}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#141923] tabular-nums shrink-0">
                      {formatRupiah(item.realizedAmount)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EFE7D8]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, item.shareOfSpentPct * 2.5)}%`,
                          backgroundColor:
                            item.realizedAmount > 0 ? item.color : "#D8CFC0",
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-[#6B6253] tabular-nums w-12 text-right">
                      {item.shareOfSpentPct}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
