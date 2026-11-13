"use client";

import React, { useState } from "react";
import { Chip, type ChipState } from "@/components/ui/Chip";
import { Tooltip } from "@/components/ui/Tooltip";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, BarChart2, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

export interface DataCardProps {
  title: string;
  statement: string;
  metricValue?: string | number;
  metricUnit?: string;
  changeNote?: string;
  source: string;
  updatedAt: string;
  state?: ChipState;
  unavailableReason?: string;
  tableData?: Array<{ label: string; value: string }>;
  expertContent?: React.ReactNode;
  children?: React.ReactNode; // SVG chart or metric visual
  className?: string;
  onRefresh?: () => void;
}

export const DataCard: React.FC<DataCardProps> = ({
  title,
  statement,
  metricValue,
  metricUnit,
  changeNote,
  source,
  updatedAt,
  state = "live",
  unavailableReason,
  tableData,
  expertContent,
  children,
  className = "",
  onRefresh,
}) => {
  const [viewAsTable, setViewAsTable] = useState(false);
  const [expertExpanded, setExpertExpanded] = useState(false);
  const globalViewMode = useAppStore((s) => s.viewMode);

  // Loading state skeleton
  if (state === "stale" && !metricValue) {
    return (
      <div className={`p-5 rounded-md bg-surface border border-border space-y-4 shadow-card ${className}`}>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

  // Unavailable state
  if (state === "unavailable") {
    return (
      <div className={`p-5 rounded-md bg-surface border border-border shadow-card space-y-3 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-primary m-0">{title}</h3>
          <Chip state="unavailable">Unavailable</Chip>
        </div>
        <p className="text-sm text-secondary m-0 leading-relaxed">
          {unavailableReason || "Observation data is currently unavailable for this specific grid coordinate."}
        </p>
        <div className="pt-2 text-[11px] text-muted flex items-center justify-between border-t border-border">
          <span>{source}</span>
          <span>{updatedAt}</span>
        </div>
      </div>
    );
  }

  return (
    <article
      className={`p-5 rounded-md bg-surface border border-border shadow-card flex flex-col justify-between transition-colors ${className}`}
    >
      <div className="space-y-3">
        {/* Top Header: Title & Single State Tag */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs uppercase font-mono tracking-wider font-bold text-secondary">
            {title}
          </span>
          <Chip state={state}>
            {state === "sample" ? "Sample data" : state === "stale" ? "Data may be old" : "Live data"}
          </Chip>
        </div>

        {/* Lead Statement (Plain language for farmer) */}
        <h3 className="text-base sm:text-lg font-serif font-bold text-primary m-0 leading-snug">
          {statement}
        </h3>

        {/* Large Key Metric Value */}
        {metricValue !== undefined && (
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="font-mono text-3xl font-extrabold text-primary tracking-tight">
              {metricValue}
            </span>
            {metricUnit && (
              <span className="text-sm font-sans font-medium text-secondary">
                {metricUnit}
              </span>
            )}
            {changeNote && (
              <span className="text-xs ml-2 font-medium text-water-text dark:text-water">
                {changeNote}
              </span>
            )}
          </div>
        )}

        {/* Chart or Accessible Table View */}
        <div className="pt-2 min-h-[90px] flex flex-col justify-center">
          {viewAsTable && tableData && tableData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/60">
                      <td className="py-1.5 pr-2 font-medium text-secondary">{row.label}</td>
                      <td className="py-1.5 pl-2 font-mono font-bold text-primary text-right">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Table/Chart Toggle (Accessibility required) */}
        {tableData && tableData.length > 0 && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setViewAsTable((prev) => !prev)}
              className="text-[11px] font-semibold text-secondary hover:text-primary inline-flex items-center gap-1 touch-target min-h-[30px]"
              aria-label={viewAsTable ? "View as chart" : "View data as table"}
            >
              {viewAsTable ? (
                <>
                  <BarChart2 className="w-3 h-3 text-leaf" />
                  <span>View as chart</span>
                </>
              ) : (
                <>
                  <Table className="w-3 h-3 text-leaf" />
                  <span>View as table</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Expert View Content & Tooltips (When toggled) */}
        {(globalViewMode === "expert" || expertExpanded) && expertContent && (
          <div className="p-3 rounded-sm bg-bg border border-border/80 text-xs text-secondary space-y-2 mt-2">
            <div className="font-semibold text-primary flex items-center justify-between">
              <span>Telemetry Breakdown</span>
              <span className="text-[10px] font-mono uppercase bg-leaf/10 text-leaf px-1.5 py-0.5 rounded">
                Expert Mode
              </span>
            </div>
            {expertContent}
          </div>
        )}
      </div>

      {/* Mandatory Single Source Label and Last Updated Line */}
      <footer className="pt-4 mt-3 border-t border-border flex items-center justify-between text-[11px] text-muted">
        <span className="font-medium truncate max-w-[65%]" title={`Source: ${source}`}>
          Source: {source}
        </span>
        <div className="flex items-center gap-2">
          <span>{updatedAt}</span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1 text-secondary hover:text-primary rounded hover:bg-surface-hover"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </footer>
    </article>
  );
};
