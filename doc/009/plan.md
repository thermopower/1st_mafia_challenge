# 광고주 체험단 상세 및 모집 관리 모듈화 설계

## 개요

| 모듈명 | 위치 | 설명 |
|--------|------|------|
| **Campaign Admin Service** | `src/features/feature09-campaign-admin/` | 지원자 관리/선정 프로세스 |
| **Admin Components** | `src/features/feature09-campaign-admin/components/` | 관리자 인터페이스 |

## Implementation Plan

### 1. 지원자 관리 컴포넌트 구현
**위치**: `src/features/feature09-campaign-admin/components/`

**구현할 컴포넌트**:
- `CampaignAdmin.tsx` - 메인 관리 페이지
- `ApplicantTable.tsx` - 지원자 목록 테이블
- `SelectionControls.tsx` - 선정/반려 버튼

### 2. 백엔드 API 구현
**위치**: `src/features/feature09-campaign-admin/backend/`

**구현할 파일**:
- `route.ts` - 지원자 관리/선정 엔드포인트
- `service.ts` - 선정 프로세스 비즈니스 로직
