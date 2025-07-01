export interface BeepingAlarm {
  status: string;
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface BeepingAlarmResponse {
  data: BeepingAlarm[];
}

