import React from "react";
import { PAGE_STATUS } from "constants/Constants";

const STATUS_CONFIG = {
  [PAGE_STATUS.DRAFT]: {
    label: "Draft",
    dot: "#94a3b8",
    bg: "#f1f5f9",
    text: "#475569",
    border: "#cbd5e1",
  },
  [PAGE_STATUS.PUBLIC]: {
    label: "Public",
    dot: "#10b981",
    bg: "#ecfdf5",
    text: "#065f46",
    border: "#a7f3d0",
  },
  [PAGE_STATUS.PRIVATE]: {
    label: "Private",
    dot: "#f59e0b",
    bg: "#fffbeb",
    text: "#92400e",
    border: "#fde68a",
  },
};

const FALLBACK = {
  label: "Unknown",
  dot: "#9ca3af",
  bg: "#f3f4f6",
  text: "#6b7280",
  border: "#e5e7eb",
};

export default function StatusBadge({ status }: { status: number }) {
  const cfg = STATUS_CONFIG[status] ?? FALLBACK;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px 3px 8px",
        borderRadius: "100px",
        border: `1px solid ${cfg.border}`,
        backgroundColor: cfg.bg,
        fontFamily: "inherit",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        lineHeight: 1,
        color: cfg.text,
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}
