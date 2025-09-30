# 체험단 지원 모듈화 설계

## 개요

| 모듈명 | 위치 | 설명 |
|--------|------|------|
| **Application Service** | `src/features/feature06-apply/` | 체험단 지원 생성/관리 |
| **Application Components** | `src/features/feature06-apply/components/` | 지원 폼 UI |

## Implementation Plan

### 1. 지원 컴포넌트 구현
**위치**: `src/features/feature06-apply/components/`

**구현할 컴포넌트**:
- `ApplicationForm.tsx` - 지원서 작성 폼
- `MotivationInput.tsx` - 각오 입력 컴포넌트

### 2. 백엔드 API 구현
**위치**: `src/features/feature06-apply/backend/`

**구현할 파일**:
- `route.ts` - 지원 생성 엔드포인트
- `service.ts` - 중복 지원 방지 로직
