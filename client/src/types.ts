export interface Employee {
  id: number;
  employee_no: string;
  email?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  place_of_birth?: string;
  birthdate?: string | null;   // YYYY-MM-DD
  date_hired?: string | null;  // YYYY-MM-DD
  gender?: string | null;
  position?: string | null;
  department?: string | null;  // School / Office
}

export type DocumentType = { id:number; name:string };
export type Tag = { id:number; name:string };
export type Document = {
  id:number;
  employee_id:number;
  title:string;
  path:string;
  issued_at?:string|null;
  expires_at?:string|null;
  deleted_at?:string|null;    // <— add this
  type?:DocumentType;
  tags?: Tag[];
};

export type AuditLog = {
  id: number;
  action: string;
  user_id: number | null;
  user?: { id:number; name:string; email:string };
  ip?: string | null;
  entity_type?: string | null;
  entity_id?: number | null;
  meta?: Record<string, any> | null;
  created_at: string;
};



