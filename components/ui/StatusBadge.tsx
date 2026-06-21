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
  Watching: "bg-gray-100 text-gray-700",
  Sent: "bg-gray-100 text-gray-700",
  Applied: "bg-blue-100 text-blue-700",
  Replied: "bg-blue-100 text-blue-700",
  "Under Review": "bg-purple-100 text-purple-700",
  Accepted: "bg-green-100 text-green-700",
  Interested: "bg-green-100 text-green-700",
  Awarded: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Declined: "bg-red-100 text-red-700",
  Waitlisted: "bg-amber-100 text-amber-700",
  "No Response": "bg-amber-100 text-amber-700",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}
