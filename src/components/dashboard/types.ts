export type Attendee = {
  id: string;
  uuid: string;
  fullName: string;
  cedula: string;
  locality: string;
  status: 'pending' | 'in';
  checkedInAt: string | null;
  createdAt: string;
};

export type Stats = {
  total: number;
  checkedIn: number;
  pending: number;
  perLocality: Record<string, { total: number; checkedIn: number; pending: number }>;
  hourly: Array<{ hour: number; count: number }>;
  peakHour: { hour: number; count: number } | null;
};
