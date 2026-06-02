// User types
export interface User {
  id: string;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: 'user' | 'admin';
  xp: number;
  points: number;
  createdAt: string;
  updatedAt: string;
}

// Channel types
export interface Channel {
  id: string;
  platformType: 'youtube' | 'chzzk';
  channelId: string;
  name: string;
  profileImageUrl: string | null;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelDto {
  platformType: 'youtube' | 'chzzk';
  channelId: string;
}

export interface UpdateChannelDto {
  name?: string;
  profileImageUrl?: string;
  subscriberCount?: number;
}

// Content types
export interface Content {
  id: string;
  channelId: string;
  channel?: Channel;
  platformContentId: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentDto {
  channelId: string;
  platformContentId: string;
}

export interface UpdateContentDto {
  title?: string;
  thumbnailUrl?: string;
  viewCount?: number;
  likeCount?: number;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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
  eventType: string;
  name: string;
  description: string | null;
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  name: string;
  minXp: number;
  maxXp: number | null;
  createdAt: string;
  updatedAt: string;
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

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
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
