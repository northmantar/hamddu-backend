// User types
export type UserStatus = 'active' | 'withdrawn';
export type UserType = 'member' | 'admin';

export interface User {
  id: string;
  status: UserStatus;
  type: UserType;
  email: string | null;
  nickname: string | null;
  surveyCompleted?: boolean;
  createdAt: string;
  // 서비스 회원 전용
  xp?: number;
  points?: number;
}

export interface CreateUserAdminDto {
  email: string;
  password: string;
  type: UserType;
}

// Channel types
export type ChannelPlatform = 'youtube';
export type ChannelStatus = 'active' | 'inactive';

export interface Channel {
  id: string;
  name: string;
  platform: ChannelPlatform;
  sourceChannelId: string;
  status: ChannelStatus;
  addedAt: string;
}

export interface CreateChannelDto {
  platform: ChannelPlatform;
  sourceChannelId: string;
  name: string;
}

export interface UpdateChannelDto {
  name?: string;
  status?: ChannelStatus;
}

// Content types
export type ContentType = 'symbol' | 'free' | 'normal';
export type ContentStatus = 'active' | 'inactive';
export type UserInterests = 'crochet' | 'knitting';

export interface Content {
  id: string;
  channelId: string | null;
  channel?: { id: string; name: string; platform?: string; sourceChannelId?: string; status?: string } | null;
  sourceVideoId: string;
  name: string;
  type: ContentType;
  status: ContentStatus;
  interests: UserInterests | null;
  imageUrl: string | null;
  mediaId: string | null;
  pointApplyable: boolean;
  sortOrder: number | null;
  uploadedAt: string | null;
  createdAt: string;
}

export interface CreateContentDto {
  channelId: string;
  sourceVideoId: string;
  name: string;
  type: ContentType;
  status?: ContentStatus;
  interests?: UserInterests;
  sortOrder?: number;
  pointApplyable?: boolean;
  mediaId?: string;
}

export interface UpdateContentDto {
  name?: string;
  sourceVideoId?: string;
  channelId?: string;
  sortOrder?: number;
  pointApplyable?: boolean;
  mediaId?: string;
  status?: ContentStatus;
}

// Category types
export interface Category {
  id: string;
  label?: string;
  status?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
}

// Point Policy types
export interface PointPolicy {
  id: string;
  actionType?: string;
  pointAmount?: number;
  isOneTime?: boolean;
  eventType?: string;
  name?: string;
  description?: string | null;
  points?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePointPolicyDto {
  eventType: string;
  name: string;
  description?: string;
  points: number;
  isActive?: boolean;
}

export interface UpdatePointPolicyDto {
  name?: string;
  description?: string;
  points?: number;
  isActive?: boolean;
}

// XP Level types
export interface XpLevel {
  id: string;
  level: number;
  xpThreshold?: number;
  label?: string;
  isActive?: boolean;
  name?: string;
  minXp?: number;
  maxXp?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateXpLevelDto {
  level: number;
  name: string;
  minXp: number;
  maxXp?: number;
}

export interface UpdateXpLevelDto {
  name?: string;
  minXp?: number;
  maxXp?: number;
}

// Report types
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'copyright' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'rejected';

export interface BoardReport {
  id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  processedAt: string | null;
  reporter: { id: string; nickname: string };
  board: { id: string; title: string };
}

export interface CommentReport {
  id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  processedAt: string | null;
  reporter: { id: string; nickname: string };
  comment: { id: string; body: string; boardId: string };
}

export interface UpdateReportDto {
  status: 'resolved' | 'rejected';
}

// Media types
export interface Media {
  id: string;
  url: string;
  mimeType: string | null;
  createdAt: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
