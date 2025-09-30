# 내 지원 목록 모듈화 설계

## 개요

| 모듈명 | 위치 | 설명 |
|--------|------|------|
| **My Applications Service** | `src/features/feature07-my-applications/` | 지원 목록 조회/필터링 |
| **Application List Components** | `src/features/feature07-my-applications/components/` | 지원 목록 UI |

## Implementation Plan

### 1. 지원 목록 컴포넌트 구현
**위치**: `src/features/feature07-my-applications/components/`

**구현할 컴포넌트**:
- `MyApplications.tsx` - 메인 지원 목록 페이지
- `ApplicationStatusFilter.tsx` - 상태별 필터

### 2. 백엔드 API 구현
**위치**: `src/features/feature07-my-applications/backend/`

**구현할 파일**:
- `route.ts` - 지원 목록 조회 엔드포인트
- `service.ts` - 필터링 비즈니스 로직
