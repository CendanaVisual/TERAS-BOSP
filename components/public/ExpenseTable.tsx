"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Filter, Search, X } from "lucide-react";
import {
  BOSP_COMPONENTS,
  FUND_SOURCE_LABELS,
  formatRupiah,
} from "@/lib/bosp-constants";
import type { SerializedExpenseItem } from "@/lib/bosp-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";

type SortField =
  | "accountCode"
  | "componentCategory"
  | "description"
  | "fundSource"
  | "plannedAmount"
  | "realizedAmount"
  | "absorptionPct";

interface ExpenseTableProps {
  expenses: SerializedExpenseItem[];
  selectedComponent: string;
  onSelectComponent: (component: string) => void;
}

export function ExpenseTable({
  expenses,
  selectedComponent,
  onSelectComponent,
}: ExpenseTableProps) {
  const [search, setSearch] = useState("");
  const [fundSource, setFundSource] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("componentCategory");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(
        field === "accountCode" ||
          field === "componentCategory" ||
          field === "description"
      );
    }
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = expenses.filter((item) => {
      if (
        selectedComponent !== "ALL" &&
        item.componentCategory !== selectedComponent
      ) {
        return false;
      }
      if (fundSource !== "ALL" && item.fundSource !== fundSource) {
        return false;
      }
      if (q) {
        const match =
          item.accountCode.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.componentCategory.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "number" && typeof bv === "number") {
        return sortAsc ? av - bv : bv - av;
      }
      return sortAsc
        ? String(av).localeCompare(String(bv), "id")
        : String(bv).localeCompare(String(av), "id");
    });
  }, [expenses, selectedComponent, fundSource, search, sortField, sortAsc]);

  const totals = useMemo(() => {
    const planned = filteredAndSorted.reduce((s, e) => s + e.plannedAmount, 0);
    const realized = filteredAndSorted.reduce((s, e) => s + e.realizedAmount, 0);
    const pct = planned > 0 ? Math.round((realized / planned) * 1000) / 10 : 0;
    return { planned, realized, pct };
  }, [filteredAndSorted]);

  const hasActiveFilter =
    search !== "" || selectedComponent !== "ALL" || fundSource !== "ALL";

  return (
    <Card id="rincian-belanja">
      <CardHeader className="border-b border-[#EFE6D5] p-4 sm:p-6 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">
              Tabel Rincian Realisasi Belanja
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Menampilkan {filteredAndSorted.length} dari {expenses.length} pos kegiatan belanja
            </CardDescription>
          </div>
          {hasActiveFilter && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setFundSource("ALL");
                onSelectComponent("ALL");
              }}
              className="self-start no-print"
            >
              <X className="h-3.5 w-3.5" />
              Reset Filter
            </Button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="mt-4 grid gap-2.5 sm:gap-3 sm:grid-cols-12 no-print">
          <div className="relative sm:col-span-5">
            <Search className="absolute left-3 top-3 sm:top-2.5 h-4 w-4 text-[#8E8677]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode rekening, uraian..."
              className="h-11 sm:h-10 pl-9 text-base sm:text-sm"
            />
          </div>
          <div className="sm:col-span-4">
            <Select
              aria-label="Filter Komponen BOSP"
              value={selectedComponent}
              onChange={(e) => onSelectComponent(e.target.value)}
              className="h-11 sm:h-10 text-sm"
            >
              <option value="ALL">Semua 12 Komponen BOSP</option>
              {BOSP_COMPONENTS.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#8E8677] shrink-0 hidden sm:block" />
            <Select
              aria-label="Filter Sumber Dana"
              value={fundSource}
              onChange={(e) => setFundSource(e.target.value)}
              className="h-11 sm:h-10 text-sm"
            >
              <option value="ALL">Semua Sumber Dana</option>
              <option value="BOSP_REGULER">BOSP Reguler</option>
              <option value="BOSP_KINERJA">BOSP Kinerja</option>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Clean Mobile Card List (< md) */}
        <div className="md:hidden divide-y divide-[#EFE6D5]">
          {filteredAndSorted.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[#6B6253]">
              Tidak ada rincian belanja yang cocok dengan filter pencarian.
            </div>
          ) : (
            <>
              {filteredAndSorted.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5 bg-[#FFFDF9]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-medium text-[#6B6253]">
                      {item.accountCode}
                    </span>
                    <Badge
                      variant={
                        item.fundSource === "BOSP_KINERJA" ? "navy" : "emerald"
                      }
                      className="text-[10px]"
                    >
                      {FUND_SOURCE_LABELS[item.fundSource]}
                    </Badge>
                  </div>

                  <p className="text-sm font-semibold text-[#141923] leading-snug">
                    {item.description}
                  </p>

                  <p className="text-[11px] font-medium text-[#8A6820] bg-[#FAF2E3] border border-[#EADBC0] rounded-lg px-2.5 py-1 inline-block">
                    {item.componentCategory}
                  </p>

                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#ECE2CF] bg-[#FAF6EE] p-2.5 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[#736957]">
                        RKAS
                      </p>
                      <p className="text-xs font-mono font-semibold text-[#3C372E] tabular-nums mt-0.5">
                        {formatRupiah(item.plannedAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[#736957]">
                        Realisasi
                      </p>
                      <p className="text-xs font-mono font-bold text-[#0D6E52] tabular-nums mt-0.5">
                        {formatRupiah(item.realizedAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[#736957]">
                        Serapan
                      </p>
                      <p className="text-xs font-mono font-bold text-[#141923] tabular-nums mt-0.5">
                        {item.absorptionPct}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Mobile Total Summary */}
              <div className="p-4 bg-[#FAF2E3] border-t-2 border-[#D9C7A3] space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#141923]">
                  Total ({filteredAndSorted.length} pos belanja)
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-[#6B6253]">RKAS</p>
                    <p className="text-xs font-mono font-bold text-[#141923] tabular-nums">
                      {formatRupiah(totals.planned)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#0D6E52]">Realisasi</p>
                    <p className="text-xs font-mono font-extrabold text-[#0D6E52] tabular-nums">
                      {formatRupiah(totals.realized)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B6253]">Serapan</p>
                    <p className="text-xs font-mono font-bold text-[#141923] tabular-nums">
                      {totals.pct}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Full Sortable Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F6EFE2] border-b border-[#E5DAC5] text-xs uppercase tracking-wider text-[#4E4639]">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort("accountCode")}
                    className="inline-flex items-center gap-1 hover:text-[#141923] cursor-pointer"
                  >
                    Kode Rekening
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("componentCategory")}
                    className="inline-flex items-center gap-1 hover:text-[#141923] cursor-pointer"
                  >
                    Komponen BOSP
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold min-w-[240px]">
                  <button
                    type="button"
                    onClick={() => toggleSort("description")}
                    className="inline-flex items-center gap-1 hover:text-[#141923] cursor-pointer"
                  >
                    Uraian Kegiatan / Belanja
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort("fundSource")}
                    className="inline-flex items-center gap-1 hover:text-[#141923] cursor-pointer"
                  >
                    Sumber Dana
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort("plannedAmount")}
                    className="inline-flex items-center gap-1 hover:text-[#141923] cursor-pointer ml-auto"
                  >
                    Anggaran (RKAS)
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort("realizedAmount")}
                    className="inline-flex items-center gap-1 hover:text-[#141923] cursor-pointer ml-auto"
                  >
                    Realisasi (Rp)
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort("absorptionPct")}
                    className="inline-flex items-center gap-1 hover:text-[#141923] cursor-pointer ml-auto"
                  >
                    Serapan (%)
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE6D5]">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-[#6B6253]"
                  >
                    Tidak ada rincian belanja yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#FAF6EE]/80 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#5C5446] whitespace-nowrap">
                      {item.accountCode}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-[#141923] max-w-[200px]">
                      {item.componentCategory}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1E2430]">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={
                          item.fundSource === "BOSP_KINERJA"
                            ? "navy"
                            : "emerald"
                        }
                      >
                        {FUND_SOURCE_LABELS[item.fundSource]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs sm:text-sm text-[#5C5446] tabular-nums whitespace-nowrap">
                      {formatRupiah(item.plannedAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs sm:text-sm font-semibold text-[#141923] tabular-nums whitespace-nowrap">
                      {formatRupiah(item.realizedAmount)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${
                          item.absorptionPct >= 90
                            ? "bg-emerald-50 text-[#0D6E52]"
                            : item.absorptionPct >= 60
                            ? "bg-[#F8F1E1] text-[#6B4F14]"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {item.absorptionPct}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredAndSorted.length > 0 && (
              <tfoot className="bg-[#FAF2E3] border-t-2 border-[#D9C7A3] font-bold text-[#141923]">
                <tr>
                  <td colSpan={4} className="px-4 py-3.5 text-sm">
                    Total ({filteredAndSorted.length} item ditampilkan)
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm tabular-nums whitespace-nowrap">
                    {formatRupiah(totals.planned)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm text-[#0D6E52] tabular-nums whitespace-nowrap">
                    {formatRupiah(totals.realized)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm tabular-nums whitespace-nowrap">
                    {totals.pct}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
