export type UserRole = 'advertiser' | 'influencer';

export type AuthMethod = 'email' | 'external';

export type CurrentUser = {
  id: string;
  email: string | null;
  appMetadata: Record<string, unknown>;
  userMetadata: Record<string, unknown>;
};

export type CurrentUserSnapshot =
  | { status: "authenticated"; user: CurrentUser }
  | { status: "unauthenticated"; user: null }
  | { status: "loading"; user: CurrentUser | null };

export type CurrentUserContextValue = CurrentUserSnapshot & {
  refresh: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
};

// 사용자 프로필 타입들
export type UserProfile = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  userRole: UserRole;
  authMethod: AuthMethod;
  createdAt: string;
  updatedAt: string;
};

export type InfluencerProfile = {
  id: string;
  birthDate: string;
  snsChannelName: string;
  snsChannelUrl: string;
  followerCount: number;
  verificationStatus: 'pending' | 'verified' | 'failed';
  createdAt: string;
  updatedAt: string;
};

export type AdvertiserProfile = {
  id: string;
  companyName: string;
  address: string;
  phone: string;
  businessNumber: string;
  representativeName: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export type Campaign = {
  id: string;
  advertiserId: string;
  title: string;
  description: string;
  mission: string;
  benefits: string;
  location: string;
  recruitmentCount: number;
  startDate: string;
  endDate: string;
  earlyTerminationDate?: string;
  earlyTerminationReason?: string;
  status: '모집중' | '조기종료' | '모집종료' | '선정완료';
  createdAt: string;
  updatedAt: string;
};

export type Application = {
  id: string;
  campaignId: string;
  influencerId: string;
  motivation: string;
  visitDate: string;
  status: '신청완료' | '선정' | '반려';
  appliedAt: string;
  updatedAt: string;
};
