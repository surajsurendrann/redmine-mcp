export interface RedmineProject {
  id: number;
  name: string;
  identifier: string;
  description?: string;
  status: number;
  is_public: boolean;
  created_on: string;
  updated_on: string;
}

export interface RedmineIssue {
  id: number;
  project: { id: number; name: string };
  tracker: { id: number; name: string };
  status: { id: number; name: string; is_closed?: boolean };
  priority: { id: number; name: string };
  author: { id: number; name: string };
  assigned_to?: { id: number; name: string };
  subject: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  done_ratio: number;
  is_private?: boolean;
  estimated_hours?: number;
  spent_hours?: number;
  created_on: string;
  updated_on: string;
  closed_on?: string;
}

export interface RedmineRole {
  id: number;
  name: string;
}

export interface RedmineMembership {
  id: number;
  project: { id: number; name: string; identifier: string };
  roles: RedmineRole[];
}

export interface RedmineUser {
  id: number;
  login: string;
  firstname: string;
  lastname: string;
  mail?: string;
  created_on: string;
  last_login_on?: string;
  api_key?: string;
  memberships?: RedmineMembership[];
}

export interface RedmineUserPermissions {
  user: {
    id: number;
    login: string;
    name: string;
    mail?: string;
    admin?: boolean;
  };
  memberships: Array<{
    project: { id: number; name: string; identifier: string };
    roles: RedmineRole[];
  }>;
}

export interface RedmineResponse<T> {
  [key: string]: T[] | number | undefined;
  total_count?: number;
  offset?: number;
  limit?: number;
}

export interface RedmineTimeEntry {
  id: number;
  project: { id: number; name: string };
  issue?: { id: number };
  user: { id: number; name: string };
  activity: { id: number; name: string };
  hours: number;
  comments?: string;
  spent_on: string;
  created_on: string;
  updated_on: string;
}

export interface CreateTimeEntryInput {
  issue_id?: number;
  project_id?: number;
  hours: number;
  activity_id?: number;
  comments?: string;
  spent_on?: string;
  user_id?: number;
}


export interface RedmineTimeEntryActivity {
  id: number;
  name: string;
  is_default: boolean;
  active?: boolean;
}



