export interface Activity {
  _id: string;
  name: string;
  met_value: number;
  category?: string;
  created_at?: string;
}

export interface ActivityLog {
  _id: string;
  user_id: string;
  activity_id?: Activity | string | null;
  custom_activity_name?: string | null;
  duration_minutes: number;
  calories_burned: number;
  logged_at: string;
  created_at?: string;
}
