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

const statusStyles: Record<string, string> = {
  Watching: "bg-cream text-ink-light",
  Sent: "bg-cream text-ink-light",
  Applied: "bg-sage/10 text-sage",
  Replied: "bg-sage/10 text-sage",
  "Under Review": "bg-lavender/10 text-lavender",
  Accepted: "bg-sage/15 text-sage font-semibold",
  Interested: "bg-sage/10 text-sage",
  Awarded: "bg-sage/15 text-sage font-semibold",
  Rejected: "bg-rose/10 text-rose",
  Declined: "bg-rose/10 text-rose",
  Waitlisted: "bg-gold/10 text-gold",
  "No Response": "bg-gold/10 text-gold",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-cream text-ink-light";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide ${style}`}
    >
      {status}
    </span>
  );
}
