// Identity API types based on Vega Identity API Swagger v1

import type { ID } from './common';

// ==========================================
// User Profile
// ==========================================

export interface UserProfileResponse {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  departments?: UserDepartmentDto[] | null;
}

// ==========================================
// Department
// ==========================================

export interface UserDepartmentDto {
  id: string; // uuid
  departmentId: string; // uuid
  departmentName: string | null;
  departmentCode: string | null;
  isLeader: boolean;
  joinedAt: string; // date-time
}

export interface DepartmentMemberDto {
  id: string; // uuid
  userId: string; // uuid
  userFullName: string | null;
  userEmail: string | null;
  isLeader: boolean;
  joinedAt: string; // date-time
}

export interface SharedDepartmentDto {
  departmentId: string; // uuid
  departmentName: string | null;
  isLeader: boolean;
}

export interface DepartmentColleagueDto {
  userId: string; // uuid
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  sharedDepartments: SharedDepartmentDto[] | null;
}

export interface PagedUserProfileResponse {
  items: UserProfileResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateUserProfileRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateUserProfileRequest {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
}

// ==========================================
// Auth
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfileResponse;
}

export interface RegisterCommand {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface AuthMeResponse {
  id: string;
  identifier?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string | null;
  roles?: string[];
  departments?: UserDepartmentDto[];
}

// ==========================================
// App Config (/api/config/me)
// ==========================================

export interface AppWebsiteConfig {
  MinutesIdleTimeout?: number;
  TimeToHideUnreadSeparator?: number;
}

export interface AppGeneralConfig {
  WebsiteConfig?: AppWebsiteConfig;
}

export interface AppUploadLimitsConfig {
  maxFilesPerUpload?: number;
  maxFileSizeMB?: number;
  maxImageSizeMB?: number;
  maxVideoSizeMB?: number;
  maxTotalUploadSizeMB?: number;
}

export interface AppChatConfig {
  maxPinnedMessages?: number;
  maxPinnedCategories?: number;
  maxPinnedDmConversations?: number;
}

export interface AppConfigResponse {
  general?: AppGeneralConfig;
  uploadLimits?: AppUploadLimitsConfig;
  chat?: AppChatConfig;
}

