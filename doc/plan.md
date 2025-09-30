# 단일 책임 모듈화 설계 최종본 (기능 1~9)

doc/spec.md(유즈케이스)와 .ruler/AGENTS.md(구조/가이드)를 기반으로 “하나의 모듈 = 하나의 책임”을 준수하여 최소 모듈로 재구성했습니다. 모든 HTTP는 `@/lib/remote/api-client` 경유, 컴포넌트는 전부 "use client" 적용.

## 개요
- 모듈명: auth
  - 위치: `src/features/auth`
  - 책임: 회원가입 및 인증 발송(기능 1의 서버 처리)
- 모듈명: profiles
  - 위치: `src/features/profiles`
  - 책임: 인플루언서/광고주 프로필 및 인플루언서 채널 관리(기능 2,3)
- 모듈명: campaigns
  - 위치: `src/features/campaigns`
  - 책임: 캠페인 등록/목록/상세/모집종료(기능 4,5,8,9 중 캠페인 측면)
- 모듈명: applications
  - 위치: `src/features/applications`
  - 책임: 지원 생성/내 지원목록/선정·반려(기능 6,7,9 중 신청 측면)
- 모듈명: audit
  - 위치: `src/features/audit`
  - 책임: 감사 이벤트 기록(공통)

## diagram
```mermaid
flowchart LR
  subgraph FE[Client Components]
    FE_Signup[SignupForm + useSignup]
    FE_Prof[ProfileForms + useUpsertProfile/useAddChannel/useUpsertAdvertiser]
    FE_CList[CampaignList + useCampaigns]
    FE_CDetail[CampaignDetail + useCampaign]
    FE_CCreate[CampaignCreate + useCreateCampaign]
    FE_Close[CloseRecruit + useCloseCampaign]
    FE_Apply[ApplyForm + useCreateApplication]
    FE_MyApps[MyApplications + useMyApplications]
    FE_Manage[ApplicantsManage + useUpdateApplicantStatus]
  end

  API[@/lib/remote/api-client]

  subgraph BE[Hono Routers]
    R_Auth[/auth/route.ts/]
    R_Profiles[/profiles/route.ts/]
    R_Campaigns[/campaigns/route.ts/]
    R_Applications[/applications/route.ts/]
  end

  subgraph SVC[Services]
    S_Auth[auth.service]
    S_Profiles[profiles.service]
    S_Campaigns[campaigns.service]
    S_Applications[applications.service]
    S_Audit[audit.service]
  end

  subgraph DB[(PostgreSQL)]
    T_users[(users)]
    T_influencer_profiles[(influencer_profiles)]
    T_influencer_channels[(influencer_channels)]
    T_advertiser_profiles[(advertiser_profiles)]
    T_campaigns[(campaigns)]
    T_applications[(applications)]
    T_audit_logs[(audit_logs)]
  end

  FE_Signup --> API --> R_Auth --> S_Auth --> T_users
  FE_Prof --> API --> R_Profiles --> S_Profiles --> T_influencer_profiles
  S_Profiles --> T_influencer_channels
  S_Profiles --> T_advertiser_profiles
  FE_CList --> API --> R_Campaigns --> S_Campaigns --> T_campaigns
  FE_CDetail --> API --> R_Campaigns --> S_Campaigns
  FE_CCreate --> API --> R_Campaigns --> S_Campaigns --> T_campaigns
  FE_Close --> API --> R_Campaigns --> S_Campaigns --> T_campaigns
  FE_Apply --> API --> R_Applications --> S_Applications --> T_applications
  S_Applications --> S_Audit --> T_audit_logs
  FE_MyApps --> API --> R_Applications --> S_Applications --> T_applications
  FE_Manage --> API --> R_Applications --> S_Applications --> T_applications
```

## implementation plan
- 공통 규칙
  - 모든 화면 컴포넌트: "use client". 페이지 params는 Promise 사용.
  - 데이터 검증: zod. 폼: react-hook-form. UI: shadcn-ui. 서버상태: @tanstack/react-query.
  - 라우팅: `src/app/api/[[...hono]]/route.ts` → `createHonoApp()`에 모듈 라우터 등록.
  - 응답 규격: `success/failure/respond`(src/backend/http/response.ts).

- 모듈: auth (기능 1 서버 처리)
  - Files
    - `src/features/auth/backend/schema.ts`: signup
    - `src/features/auth/backend/service.ts`: createUserAndSendVerification
    - `src/features/auth/backend/route.ts`: `POST /auth/signup`
    - `src/features/auth/hooks/useSignup.ts`
    - `src/features/auth/lib/dto.ts`
  - Presentation QA sheet
    - 필수값/형식 검증 메시지
    - 인증 발송 성공/실패 분기 표시
    - 중복 제출 멱등 처리 확인
  - Business logic Unit test(계획)
    - role, verification_method 허용값 검증
    - 멱등 호출 시 단일 사용자 생성

- 모듈: profiles (기능 2,3)
  - Files
    - `src/features/profiles/backend/schema.ts`: influencerProfileUpsert, influencerChannelCreate, advertiserProfileUpsert
    - `src/features/profiles/backend/service.ts`: upsertInfluencerProfile, addInfluencerChannel, upsertAdvertiserProfile
    - `src/features/profiles/backend/route.ts`: `POST /influencer/profile`, `POST /influencer/channels`, `POST /advertiser/profile`
    - `src/features/profiles/hooks/*`: useUpsertInfluencer, useAddChannel, useUpsertAdvertiser
    - `src/features/profiles/components/*`: InfluencerForm, ChannelForm, AdvertiserForm
    - `src/features/profiles/lib/dto.ts`
  - Presentation QA sheet
    - DOB/URL/BRN 형식 오류 처리
    - 채널/BRN 중복 시 에러 표시
  - Business logic Unit test(계획)
    - influencer_channels UNIQUE(user_id,type,url)
    - advertiser_profiles BRN UNIQUE

- 모듈: campaigns (기능 4,5,8,9 캠페인 측)
  - Files
    - `src/features/campaigns/backend/schema.ts`: campaignCreate, campaignListQuery, campaignDetail, closeCampaign
    - `src/features/campaigns/backend/service.ts`: createCampaign, listCampaigns, getCampaign, closeCampaign
    - `src/features/campaigns/backend/route.ts`: `POST/GET /campaigns`, `GET /campaigns/:id`, `PATCH /campaigns/:id/close`
    - `src/features/campaigns/hooks/*`: useCampaigns, useCampaign, useCreateCampaign, useCloseCampaign
    - `src/features/campaigns/components/*`: CampaignList, CampaignDetail, CampaignCreateForm
    - `src/features/campaigns/lib/dto.ts`
  - Presentation QA sheet
    - 목록에 모집중만 노출, 빈 상태 처리
    - 기간 역전(start>end) 입력 오류
    - 종료 후 상태 표시 확인
  - Business logic Unit test(계획)
    - 기간(start<=end) 체크
    - 상태 전이 recruiting→closed

- 모듈: applications (기능 6,7,9 신청 측)
  - Files
    - `src/features/applications/backend/schema.ts`: applicationCreate, myApplicationsQuery, updateApplicantStatus
    - `src/features/applications/backend/service.ts`: createApplication, listMyApplications, updateApplicationStatus
    - `src/features/applications/backend/route.ts`: `POST /applications`, `GET /me/applications`, `PATCH /applications/:id`
    - `src/features/applications/hooks/*`: useCreateApplication, useMyApplications, useUpdateApplicantStatus
    - `src/features/applications/components/*`: ApplicationForm, MyApplications, ApplicantsManage
    - `src/features/applications/lib/dto.ts`
  - Presentation QA sheet
    - 중복지원/기간종료/필수값 오류 메시지
    - 상태 필터 동작 확인
  - Business logic Unit test(계획)
    - (campaign_id,influencer_id) UNIQUE 검증
    - 모집종료 후 createApplication 거부

- 모듈: audit (공통)
  - Files
    - `src/features/audit/backend/service.ts`: logEvent(event: string)
  - Business logic Unit test(계획)
    - 로깅 실패가 상위 흐름에 영향을 주지 않음

---

비고
- DB는 이미 생성된 `supabase/migrations/0001_core_schema.sql` 사용(추가 테이블/컬럼 없음).
- 각 모듈은 단일 책임을 갖도록 역할을 분리했고, 라우터/서비스/훅/컴포넌트를 동일 피처 폴더에 배치합니다.
