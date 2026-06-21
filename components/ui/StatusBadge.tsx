type Status =
  | "Watching"
  | "Sent"
  | "Applied"
  | "Replied"
  | "Under Review"
  | "Accepted"
  | "Interested"
  | "Awarded"
  | "Rejected"
  | "Declined"
  | "Waitlisted"
  | "No Response";

interface StatusBadgeProps {
  status: Status | string;
}

const statusStyles: Record<string, { bg: string; border: string; color: string; glow: string }> = {
  Watching: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", glow: "none" },
  Sent: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", glow: "none" },
  Applied: { bg: "rgba(122, 154, 122, 0.1)", border: "rgba(122, 154, 122, 0.2)", color: "#7a9a7a", glow: "0 0 10px rgba(122, 154, 122, 0.2)" },
  Replied: { bg: "rgba(122, 154, 122, 0.1)", border: "rgba(122, 154, 122, 0.2)", color: "#7a9a7a", glow: "0 0 10px rgba(122, 154, 122, 0.2)" },
  "Under Review": { bg: "rgba(154, 138, 181, 0.1)", border: "rgba(154, 138, 181, 0.2)", color: "#9a8ab5", glow: "0 0 10px rgba(154, 138, 181, 0.2)" },
  Accepted: { bg: "rgba(20, 184, 166, 0.1)", border: "rgba(20, 184, 166, 0.2)", color: "#14b8a6", glow: "0 0 10px rgba(20, 184, 166, 0.2)" },
  Interested: { bg: "rgba(20, 184, 166, 0.1)", border: "rgba(20, 184, 166, 0.2)", color: "#14b8a6", glow: "0 0 10px rgba(20, 184, 166, 0.2)" },
  Awarded: { bg: "rgba(20, 184, 166, 0.15)", border: "rgba(20, 184, 166, 0.25)", color: "#14b8a6", glow: "0 0 10px rgba(20, 184, 166, 0.3)" },
  Rejected: { bg: "rgba(193, 112, 112, 0.1)", border: "rgba(193, 112, 112, 0.2)", color: "#c17070", glow: "0 0 10px rgba(193, 112, 112, 0.2)" },
  Declined: { bg: "rgba(244, 63, 94, 0.1)", border: "rgba(244, 63, 94, 0.2)", color: "#f43f5e", glow: "0 0 10px rgba(244, 63, 94, 0.2)" },
  Waitlisted: { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.2)", color: "#f59e0b", glow: "0 0 10px rgba(245, 158, 11, 0.2)" },
  "No Response": { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.2)", color: "#f59e0b", glow: "0 0 10px rgba(245, 158, 11, 0.2)" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.Watching;

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        boxShadow: style.glow,
      }}
    >
      {status}
    </span>
  );
}
