export interface Supervisor {
  id: string
  name: string
  title: string
  university: string
  department: string
  email: string
  date_contacted: string | null
  status: string
  linked_program: string | null
  notes: string
  archived: boolean
  archived_at: string | null
  lessons: string
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  name: string
  university: string | null
  country: string | null
  program: string | null
  funding_body: string | null
  open_date: string | null
  deadline: string | null
  status: 'Watching' | 'Applied' | 'Awaiting Result' | 'Under Review' | 'Accepted' | 'Rejected' | 'Waitlisted'
  reminder: boolean
  notes: string | null
  archived: boolean
  archived_at: string | null
  lessons: string | null
  created_at: string
  updated_at: string
}

export type Priority = 'urgent' | 'high' | 'normal' | 'low'

export interface Watchlist {
  id: string
  name: string
  type: 'Scholarship' | 'PhD Program' | 'Fellowship'
  funding_body: string | null
  country: string | null
  expected_open_date: string | null
  expected_deadline: string | null
  url: string | null
  notes: string | null
  reminder: boolean
  priority: Priority
  pinned: boolean
  archived: boolean
  archived_at: string | null
  lessons: string | null
  created_at: string
  updated_at: string
}
