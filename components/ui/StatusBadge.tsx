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

const statusStyles: Record<string, { bg: string; text: string; ring: string }> = {
  Watching: { bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-200" },
  Sent: { bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-200" },
  Applied: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
  "Awaiting Result": { bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-200" },
  Replied: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
  "Under Review": { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-200" },
  Accepted: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
  Interested: { bg: "bg-cyan-100", text: "text-cyan-700", ring: "ring-cyan-200" },
  Awarded: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
  Rejected: { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200" },
  Declined: { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-200" },
  Waitlisted: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
  "No Response": { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.Watching;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ring-1 ${style.bg} ${style.text} ${style.ring}`}
    >
      {status}
    </span>
  );
}
