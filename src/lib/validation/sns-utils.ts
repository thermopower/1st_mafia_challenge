/**
 * SNS 채널 검증 유틸리티
 */

export type SNSPlatform = 'instagram' | 'youtube' | 'blog' | 'twitter';

export interface SNSValidationResult {
  isValid: boolean;
  platform?: SNSPlatform;
  error?: string;
}

/**
 * SNS URL을 검증하고 플랫폼을 추출합니다.
 */
export function validateSNSUrl(url: string): SNSValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL을 입력해주세요.' };
  }

  const trimmedUrl = url.trim();

  // 인스타그램 검증
  const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/;
  if (instagramRegex.test(trimmedUrl)) {
    return { isValid: true, platform: 'instagram' };
  }

  // 유튜브 검증
  const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/(channel\/|user\/|@)[a-zA-Z0-9_-]+|youtu\.be\/[a-zA-Z0-9_-]+)/;
  if (youtubeRegex.test(trimmedUrl)) {
    return { isValid: true, platform: 'youtube' };
  }

  // 블로그 검증 (네이버 블로그, 티스토리 등)
  const blogRegex = /^https?:\/\/([a-zA-Z0-9_-]+\.)?(naver\.com|blog\.me|tistory\.com|egloos\.com|wordpress\.com|medium\.com)/;
  if (blogRegex.test(trimmedUrl)) {
    return { isValid: true, platform: 'blog' };
  }

  // 트위터 검증
  const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/;
  if (twitterRegex.test(trimmedUrl)) {
    return { isValid: true, platform: 'twitter' };
  }

  return {
    isValid: false,
    error: '지원하지 않는 플랫폼이거나 잘못된 URL 형식입니다. (인스타그램, 유튜브, 네이버 블로그, 트위터만 지원)'
  };
}

/**
 * 채널명을 검증합니다.
 */
export function validateChannelName(name: string): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: '채널명을 입력해주세요.' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { isValid: false, error: '채널명은 최소 2자 이상 입력해주세요.' };
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: '채널명은 최대 50자까지 입력 가능합니다.' };
  }

  // 특수문자 검증 (허용되는 문자: 한글, 영문, 숫자, _, ., -)
  const validNameRegex = /^[a-zA-Z0-9가-힣_.-\s]+$/;
  if (!validNameRegex.test(trimmedName)) {
    return { isValid: false, error: '채널명은 한글, 영문, 숫자, 밑줄(_), 점(.), 하이픈(-)만 사용 가능합니다.' };
  }

  return { isValid: true };
}

/**
 * 팔로워 수를 검증합니다.
 */
export function validateFollowerCount(count: number): { isValid: boolean; error?: string } {
  if (typeof count !== 'number' || isNaN(count)) {
    return { isValid: false, error: '팔로워 수는 숫자로 입력해주세요.' };
  }

  if (count < 0) {
    return { isValid: false, error: '팔로워 수는 0 이상이어야 합니다.' };
  }

  if (count > 100000000) { // 1억 제한
    return { isValid: false, error: '팔로워 수는 1억 명을 초과할 수 없습니다.' };
  }

  return { isValid: true };
}

/**
 * 생년월일을 검증합니다 (만 14세 이상).
 */
export function validateBirthDate(birthDate: string): { isValid: boolean; error?: string } {
  if (!birthDate) {
    return { isValid: false, error: '생년월일을 입력해주세요.' };
  }

  const date = new Date(birthDate);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: '올바른 생년월일 형식이 아닙니다.' };
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }

  if (age < 14) {
    return { isValid: false, error: '만 14세 이상만 인플루언서 등록이 가능합니다.' };
  }

  if (age > 100) {
    return { isValid: false, error: '올바른 생년월일을 입력해주세요.' };
  }

  return { isValid: true };
}
