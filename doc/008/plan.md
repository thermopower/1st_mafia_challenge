# 광고주 체험단 관리 모듈화 설계

## 개요

| 모듈명 | 위치 | 설명 |
|--------|------|------|
| **Campaign Management Service** | `src/features/feature08-campaign-create/` | 체험단 생성/관리 |
| **Campaign Dashboard Components** | `src/features/feature08-campaign-create/components/` | 관리 대시보드 UI |

## Implementation Plan

### 1. 체험단 관리 컴포넌트 구현
**위치**: `src/features/feature08-campaign-create/components/`

**구현할 컴포넌트**:
- `CampaignDashboard.tsx` - 메인 관리 페이지
- `CampaignCreateButton.tsx` - 체험단 등록 버튼

### 2. 백엔드 API 구현
**위치**: `src/features/feature08-campaign-create/backend/`

**구현할 파일**:
- `route.ts` - 체험단 목록/생성 엔드포인트
- `service.ts` - 권한 확인 및 생성 로직
