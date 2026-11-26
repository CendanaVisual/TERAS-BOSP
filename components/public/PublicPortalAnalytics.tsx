"use client";

import { useState } from "react";
import type { SerializedBudgetPeriod } from "@/lib/bosp-queries";
import { ComponentChart } from "./ComponentChart";
import { ExpenseTable } from "./ExpenseTable";

export function PublicPortalAnalytics({
  period,
}: {
  period: SerializedBudgetPeriod;
}) {
  const [selectedComponent, setSelectedComponent] = useState<string>("ALL");

  return (
    <div className="space-y-6">
      <ComponentChart
        breakdown={period.componentBreakdown}
        selectedComponent={selectedComponent}
        onSelectComponent={(comp) => setSelectedComponent(comp)}
      />

      <ExpenseTable
        expenses={period.expenses}
        selectedComponent={selectedComponent}
        onSelectComponent={(comp) => setSelectedComponent(comp)}
      />
    </div>
  );
}
