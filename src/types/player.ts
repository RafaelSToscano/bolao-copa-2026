export interface Player {
  id: string;
  name: string;
  access_code?: string;
  is_admin: boolean;
  approved: boolean;
  created_at?: string;
}
