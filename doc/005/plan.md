# 체험단 상세 모듈화 설계

## 개요

| 모듈명 | 위치 | 설명 |
|--------|------|------|
| **Campaign Detail Service** | `src/features/feature05-campaign-detail/` | 체험단 상세 조회/권한 확인 |
| **Detail Components** | `src/features/feature05-campaign-detail/components/` | 상세 페이지 UI |

## Implementation Plan

### 1. 상세 페이지 컴포넌트 구현
**위치**: `src/features/feature05-campaign-detail/components/`

**구현할 컴포넌트**:
- `CampaignDetail.tsx` - 메인 상세 페이지
- `CampaignInfo.tsx` - 체험단 정보 섹션
- `ApplyButton.tsx` - 지원 버튼 (권한 기반 표시)

### 2. 백엔드 API 구현
**위치**: `src/features/feature05-campaign-detail/backend/`

**구현할 파일**:
- `route.ts` - 상세 조회 엔드포인트
- `service.ts` - 권한 확인 비즈니스 로직
