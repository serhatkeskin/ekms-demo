// Shared types - using any for flexibility during migration

export interface User {
  full_name?: string;
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  is_staff?: boolean;
  is_active?: boolean;
  [key: string]: any;
}

export interface UserProfile extends User {
  avatar_url?: string;
}

export interface AvatarResponse {
  avatar?: string;
  avatar_url?: string;
  [key: string]: any;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface Membership {
  id: number;
  user: User;
  role: Role;
  project_id?: number;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description?: string;
  status?: number;
  memberships?: Membership[];
  [key: string]: any;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  project?: number;
  parent?: number;
  status?: number;
  content?: Block[];
  [key: string]: any;
}

export interface Block {
  id: number;
  page: number;
  type: number;
  content: any;
  order: number;
  data?: any;
  [key: string]: any;
}

export interface BlockOrder {
  id: number;
  order: number;
}

export interface Comment {
  id: number;
  text?: string;
  content?: string;
  page_slug?: string;
  block_id?: number;
  parent?: number | Comment;
  user?: User;
  created_at?: string;
  [key: string]: any;
}

export interface Notification {
  id: number;
  message?: string;
  is_read?: boolean;
  created_at?: string;
}

export interface NotificationParams {
  limit?: number;
  offset?: number;
  after_id?: number;
}

export interface MentionContext {
  sourceType?: string;
  sourceId?: number | null;
  blockId?: string | null;
  pageSlug?: string | null;
  pageId?: number | null;
  pageTitle?: string | null;
  commentId?: number | null;
  parentCommentId?: number | null;
  mentionerUsername?: string | null;
  pageContext?: any;
  parentCommenterUsername?: string | null;
  [key: string]: any;
}

export interface MentionResult {
  success: boolean;
  mentions?: string[];
  message?: string;
  error?: string;
  data?: any;
}

export interface TextPart {
  type: 'text' | 'mention';
  content?: string;
  username?: string;
}

export interface SearchOptions {
  limit?: number;
  types?: string[];
  projectId?: number;
  [key: string]: any;
}

export interface UploadedFile {
  url: string;
  file_path?: string;
  file_type?: string;
}

export interface PageSettings {
  orientation: 'portrait' | 'landscape';
  unit: 'mm' | 'pt' | 'px' | 'in' | 'cm';
  format: 'a4' | 'letter' | 'legal' | string;
  compress: boolean;
}

export interface PdfExportOptions {
  filename?: string;
  pageTitle: string;
  contentElement: HTMLElement;
  onProgress?: (progress: number) => void;
  includeCover?: boolean;
  pageSettings?: PageSettings;
}

export interface PermissionsMap {
  [projectId: number]: any;
}

export interface MembershipsMap {
  [projectId: number]: Membership[];
}
