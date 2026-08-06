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

export type ChannelLinkType = 'instagram' | 'smartstore' | 'youtube' | 'website' | 'etc';

export interface ChannelLink {
  id: string;
  type: ChannelLinkType;
  label: string | null;
  url: string;
  sortOrder: number;
}

/** PATCH /channels/:id 로 보낼 링크 (id 없이 전량 교체) */
export interface ChannelLinkInput {
  type: ChannelLinkType;
  url: string;
  label?: string | null;
}

export interface Channel {
  id: string;
  name: string;
  platform: ChannelPlatform;
  sourceChannelId: string;
  status: ChannelStatus;
  addedAt: string;
}

/** GET /channels/:id — 채널 홈 상세 */
export interface ChannelDetail extends Channel {
  description: string | null;
  profileImageUrl: string | null;
  profileMediaId: string | null;
  bannerImageUrl: string | null;
  bannerMediaId: string | null;
  links: ChannelLink[];
}

export interface CreateChannelDto {
  platform: ChannelPlatform;
  sourceChannelId: string;
  name: string;
}

export interface UpdateChannelDto {
  name?: string;
  status?: ChannelStatus;
  /** null을 보내면 소개글 삭제 */
  description?: string | null;
  /** null을 보내면 이미지 해제 */
  profileMediaId?: string | null;
  /** null을 보내면 이미지 해제 */
  bannerMediaId?: string | null;
  /** 보낸 배열로 전량 교체, 배열 순서가 노출 순서 */
  links?: ChannelLinkInput[];
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
  activeImageUrl: string | null;
  activeMediaId: string | null;
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
  activeMediaId?: string;
}

export interface UpdateContentDto {
  name?: string;
  sourceVideoId?: string;
  channelId?: string;
  sortOrder?: number;
  pointApplyable?: boolean;
  /** null을 보내면 아이콘 해제 */
  mediaId?: string | null;
  /** null을 보내면 아이콘 해제 */
  activeMediaId?: string | null;
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
  label: string;
}

export interface UpdateCategoryDto {
  label?: string;
  status?: 'enabled' | 'disabled';
}

// Point Policy types
export interface PointPolicy {
  id: string;
  actionType: string;
  actionTypeLabelKo?: string | null;
  pointAmount: number;
  isOneTime: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // legacy frontend-only fields (kept for transition)
  name?: string;
  description?: string | null;
  points?: number;
  eventType?: string;
}

export interface CreatePointPolicyDto {
  actionType: string;
  pointAmount: number;
  isOneTime?: boolean;
  isActive?: boolean;
}

export interface UpdatePointPolicyDto {
  pointAmount?: number;
  isOneTime?: boolean;
  isActive?: boolean;
}

export type RewardAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

// 계측된 보상 이벤트 (GET /points/reward-events)
export interface RewardEvent {
  refType: string;
  refAction: RewardAction;
}

// Point action type lookup (보상 카탈로그)
export interface PointActionType {
  code: string;
  labelKo: string;
  refType: string;
  refAction: RewardAction;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateActionTypeDto {
  code: string;
  labelKo: string;
  refType: string;
  refAction: RewardAction;
}

export interface UpdateActionTypeDto {
  labelKo?: string;
  isActive?: boolean;
}

// XP Level types
export interface XpLevel {
  id: string;
  level: number;
  xpThreshold: number;
  label: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // legacy frontend-only fields (kept for transition)
  name?: string;
  minXp?: number;
}

export interface CreateXpLevelDto {
  level: number;
  label: string;
  xpThreshold: number;
  isActive?: boolean;
}

export interface UpdateXpLevelDto {
  label?: string;
  xpThreshold?: number;
  isActive?: boolean;
}

// XP earning policy types
export interface XpEarningPolicy {
  id: string;
  actionType: string;
  actionTypeLabelKo?: string | null;
  xpAmount: number;
  isOneTime: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateXpPolicyDto {
  actionType: string;
  xpAmount: number;
  isOneTime?: boolean;
  isActive?: boolean;
}

export interface UpdateXpPolicyDto {
  xpAmount?: number;
  isOneTime?: boolean;
  isActive?: boolean;
}

// XP action type lookup / 보상 카탈로그 (mirrors PointActionType structure)
export interface XpActionType {
  code: string;
  labelKo: string;
  refType: string;
  refAction: RewardAction;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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

// Notification types
export type CampaignType = 'ANNOUNCEMENT' | 'BATCH';
export type CampaignStatus = 'SCHEDULED' | 'SENT' | 'ACTIVE' | 'PAUSED' | 'CANCELED';

export interface NotificationCampaign {
  id: string;
  type: CampaignType;
  title: string;
  body: string;
  scheduledAt: string | null;
  cron: string | null;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignDto {
  type: CampaignType;
  title: string;
  body: string;
  scheduledAt?: string;
  cron?: string;
}

export interface UpdateCampaignDto {
  title?: string;
  body?: string;
  scheduledAt?: string;
  cron?: string;
}

export interface NotificationTemplate {
  key: string;
  title: string;
  body: string;
  isActive: boolean;
  updatedAt: string;
}

export interface UpdateTemplateDto {
  title?: string;
  body?: string;
  isActive?: boolean;
}
