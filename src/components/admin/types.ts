export type AdminTabKey =
  'sections' | 'areas' | 'projects' | 'media' | 'messages' | 'settings' | 'users';

export interface ContactMessageRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  emailSent: boolean;
  createdAt: string;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean | null;
  banReason: string | null;
  createdAt: string;
}

export interface AuditLogRow {
  id: number;
  actorUserId: string | null;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  summary: string;
  createdAt: string;
}

export interface AdminFeedbackHandlers {
  setNotice: (message: string) => void;
  setError: (message: string) => void;
  clearFeedback: () => void;
}
