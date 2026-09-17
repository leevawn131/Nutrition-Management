export interface Activity {
  _id: string;
  name: string;
  met_value: number;
  category: string;
  created_by_admin_id?: {
    _id: string;
    full_name: string;
    email: string;
  } | null;
  created_at: string;
}

export interface ActivityPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityListResponse {
  success: boolean;
  message: string;
  data: {
    activities: Activity[];
    pagination: ActivityPagination;
    categories: string[];
  };
}

export interface ActivityDetailResponse {
  success: boolean;
  message: string;
  data: {
    activity: Activity;
  };
}

export interface MutateActivityResponse {
  success: boolean;
  message: string;
  data?: {
    activity: Activity;
  };
}

export interface CreateActivityPayload {
  name: string;
  met_value: number;
  category: string;
}

export interface UpdateActivityPayload {
  name?: string;
  met_value?: number;
  category?: string;
}

export interface ActivityListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}
