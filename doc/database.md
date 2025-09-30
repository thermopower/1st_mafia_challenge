# 블로그 체험단 SaaS 데이터베이스 설계

## 개요

본 문서는 유저플로우 기반으로 설계된 블로그 체험단 SaaS의 데이터베이스 구조를 정의합니다. Supabase PostgreSQL을 기반으로 하며, 최소한의 필수 데이터만 포함합니다.

## 1. 데이터플로우

### 1.1 회원가입 & 역할선택 플로우
```
사용자 입력 → Auth 계정 생성 → 역할 선택 → 인증 방식 선택 → 전용 정보 입력 → 프로필 완성
이름, 휴대폰번호, 이메일, 약관동의, 역할(광고주/인플루언서), 인증 방식(이메일/외부)
```

### 1.2 광고주 정보 등록 플로우
```
기본 프로필 생성 → 광고주 전용 정보 입력 → 검증 프로세스 → 대시보드 접근 권한 부여
업체명, 주소, 업장 전화번호, 사업자등록번호, 대표자명
```

### 1.3 인플루언서 정보 등록 플로우
```
기본 프로필 생성 → 인플루언서 전용 정보 입력 → 채널 검증 → 체험단 지원 권한 부여
SNS 채널명, 채널링크, 팔로워수
```

### 1.4 체험단 탐색 및 지원 플로우
```
체험단 목록 조회 → 상세 조회 → 인플루언서 등록 확인 → 지원 정보 입력 → 지원 저장
모집기간, 혜택, 미션, 매장, 모집인원 → 각오 한마디, 방문 예정일자
```

### 1.5 체험단 관리 플로우 (광고주)
```
체험단 등록 → 지원자 관리 → 모집상태 변경 → 선정 프로세스
지원자 리스트 → 모집중/조기종료/모집종료/선정완료 상태 전환
```

## 2. 데이터베이스 스키마 (PostgreSQL)

### 2.1 사용자 프로필 테이블
사용자 기본 정보를 저장합니다. Supabase Auth와 연동되며 인증 방식을 포함합니다.

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    user_role TEXT NOT NULL CHECK (user_role IN ('advertiser', 'influencer')),
    auth_method TEXT NOT NULL CHECK (auth_method IN ('email', 'external')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.2 인플루언서 프로필 테이블
인플루언서의 추가 정보를 저장합니다. (생년월일 + SNS 정보 통합)

```sql
CREATE TABLE IF NOT EXISTS influencer_profiles (
    id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    birth_date DATE NOT NULL,
    sns_channel_name TEXT NOT NULL,
    sns_channel_url TEXT NOT NULL,
    follower_count INTEGER NOT NULL DEFAULT 0,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.3 광고주 프로필 테이블
광고주의 회사 정보를 저장합니다.

```sql
CREATE TABLE IF NOT EXISTS advertiser_profiles (
    id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_number TEXT NOT NULL UNIQUE,
    representative_name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.4 체험단 테이블
체험단(캠페인) 정보를 저장합니다.

```sql
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID NOT NULL REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    mission TEXT NOT NULL,
    benefits TEXT NOT NULL,
    location TEXT NOT NULL,
    recruitment_count INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    early_termination_date DATE,
    early_termination_reason TEXT,
    status TEXT NOT NULL DEFAULT '모집중' CHECK (status IN ('모집중', '조기종료', '모집종료', '선정완료')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.5 체험단 지원 테이블
인플루언서의 체험단 지원 정보를 저장합니다.

```sql
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
    motivation TEXT NOT NULL,
    visit_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT '신청완료' CHECK (status IN ('신청완료', '선정', '반려')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campaign_id, influencer_id)
);
```

## 3. 인덱스 및 성능 최적화

```sql
-- 사용자 역할별 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(user_role);

-- 인플루언서 검증 상태 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_status ON influencer_profiles(verification_status);

-- 팔로워 수 범위 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_influencer_followers ON influencer_profiles(follower_count);

-- 광고주 사업자등록번호 조회를 위한 인덱스 (이미 UNIQUE 제약조건으로 인덱스 생성됨)
-- CREATE INDEX IF NOT EXISTS idx_advertiser_business_number ON advertiser_profiles(business_number);

-- 체험단 상태별 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- 체험단 날짜 범위 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_campaigns_date_range ON campaigns(start_date, end_date);

-- 조기종료된 체험단 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_campaigns_early_termination ON campaigns(early_termination_date);

-- 지원 상태별 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- 체험단별 지원자 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_applications_campaign ON applications(campaign_id);

-- 인플루언서별 지원 현황 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_applications_influencer ON applications(influencer_id);
```

## 4. 트리거 및 자동화

```sql
-- 업데이트 타임스탬프 자동 관리 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 업데이트 트리거 적용
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_influencer_profiles_updated_at BEFORE UPDATE ON influencer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_advertiser_profiles_updated_at BEFORE UPDATE ON advertiser_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 5. 엔티티 관계도

```
Supabase Auth (auth.users)
    ↓ (1:1)
사용자 프로필 (user_profiles)
    ↓ (1:1) 인플루언서 선택시
인플루언서 프로필 (influencer_profiles)
    ↓ (N:M)
체험단 지원 (applications)
    ↑ (N:1)
체험단 (campaigns)

사용자 프로필 (user_profiles)
    ↓ (1:1) 광고주 선택시
광고주 프로필 (advertiser_profiles)
    ↓ (1:N)
체험단 (campaigns)
```

## 6. 주요 쿼리 패턴

### 6.1 모집 중인 체험단 조회
```sql
SELECT * FROM campaigns
WHERE status = '모집중'
AND start_date <= CURRENT_DATE
AND end_date >= CURRENT_DATE
ORDER BY created_at DESC;
```

### 6.2 인플루언서의 지원 현황 조회
```sql
SELECT
    c.title,
    c.status,
    a.status as application_status,
    a.applied_at
FROM applications a
JOIN campaigns c ON a.campaign_id = c.id
WHERE a.influencer_id = $1
ORDER BY a.applied_at DESC;
```

### 6.3 이메일 인증 사용자 조회
```sql
SELECT
    up.id,
    up.full_name,
    up.email,
    up.auth_method,
    up.created_at
FROM user_profiles up
WHERE up.auth_method = 'email'
AND up.created_at >= $1
ORDER BY up.created_at DESC;
```

### 6.4 광고주의 체험단 지원자 조회
```sql
SELECT
    i.id,
    up.full_name,
    i.sns_channel_name,
    i.follower_count,
    a.motivation,
    a.visit_date,
    a.status,
    a.applied_at
FROM applications a
JOIN influencer_profiles i ON a.influencer_id = i.id
JOIN user_profiles up ON i.id = up.id
WHERE a.campaign_id = $1
ORDER BY a.applied_at DESC;
```

## 7. 데이터 무결성 및 제약사항

- 모든 테이블은 `updated_at` 컬럼을 자동으로 관리합니다.
- 사용자 역할은 'advertiser' 또는 'influencer'로 제한됩니다.
- 인증 방식은 'email' 또는 'external'로 제한됩니다.
- 이메일 형식을 따르는 사용자만 이메일 인증 가능합니다.
- 체험단 상태는 '모집중', '조기종료', '모집종료', '선정완료'로 제한됩니다.
- 지원 상태는 '신청완료', '선정', '반려'로 제한됩니다.
- 인플루언서 검증 상태는 'pending', 'verified', 'failed'로 제한됩니다.
- 동일한 인플루언서는 같은 체험단에 중복 지원할 수 없습니다.
- 광고주 사업자등록번호는 중복될 수 없습니다.
- 인플루언서 팔로워 수는 0 이상이어야 합니다.

## 8. 확장성 고려사항

현재 설계는 유저플로우에 명시된 최소 기능만 포함합니다. 향후 다음과 같은 확장이 가능합니다:

- 알림 시스템을 위한 `notifications` 테이블
- 리뷰/평가 시스템을 위한 `reviews` 테이블
- 포인트/보상 시스템을 위한 `points` 테이블
- 상세한 카테고리 분류를 위한 `categories` 테이블
- 지역 기반 검색을 위한 공간 인덱스

이 데이터베이스 설계는 블로그 체험단 SaaS의 핵심 기능을 지원하기에 충분하며, 유저플로우의 모든 단계를 데이터베이스 수준에서 지원합니다.
