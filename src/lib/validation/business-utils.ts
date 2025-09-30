/**
 * 사업자등록번호 검증 유틸리티
 */

export interface BusinessNumberValidationResult {
  isValid: boolean;
  error?: string;
}

const businessNumberHyphenRegex = /^\d{3}-\d{2}-\d{5}$/;
const digitsOnlyBusinessNumberRegex = /^\d{10}$/;
const digitsOnlyPhoneRegex = /^\d{9,11}$/;

function isValidBusinessNumberDigits(value: string): boolean {
  return digitsOnlyBusinessNumberRegex.test(value);
}

function isValidPhoneDigits(value: string): boolean {
  if (!digitsOnlyPhoneRegex.test(value) || !value.startsWith('0')) {
    return false;
  }

  if (value.startsWith('02')) {
    return value.length === 9 || value.length === 10;
  }

  if (value.startsWith('010')) {
    return value.length === 10 || value.length === 11;
  }

  return value.length === 10 || value.length === 11;
}

/**
 * 사업자등록번호를 검증합니다 (XXX-XX-XXXXX 형식 또는 10자리 숫자).
 */
export function validateBusinessNumber(businessNumber: string): BusinessNumberValidationResult {
  if (!businessNumber || typeof businessNumber !== 'string') {
    return { isValid: false, error: '사업자등록번호를 입력해주세요.' };
  }

  const trimmedNumber = businessNumber.trim();

  if (trimmedNumber.length === 0) {
    return { isValid: false, error: '사업자등록번호를 입력해주세요.' };
  }

  const formatErrorMessage = '사업자등록번호 형식이 올바르지 않습니다. (XXX-XX-XXXXX 또는 10자리 숫자 형태로 입력해주세요.)';
  const hasHyphen = trimmedNumber.includes('-');
  const sanitizedNumber = trimmedNumber.replace(/-/g, '');

  if (hasHyphen && !businessNumberHyphenRegex.test(trimmedNumber)) {
    return { isValid: false, error: formatErrorMessage };
  }

  if (!isValidBusinessNumberDigits(sanitizedNumber)) {
    return { isValid: false, error: '사업자등록번호는 숫자 10자리여야 합니다.' };
  }

  return { isValid: true };
}

/**
 * 전화번호를 검증합니다 (XXX-XXXX-XXXX 또는 XX-XXX-XXXX 형식).
 */
export function validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string } {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return { isValid: false, error: '전화번호를 입력해주세요.' };
  }

  const trimmedNumber = phoneNumber.trim();

  if (trimmedNumber.length === 0) {
    return { isValid: false, error: '전화번호를 입력해주세요.' };
  }

  // 휴대전화 번호 형식 검증(010-XXXX-XXXX)
  const mobileRegex = /^010-\d{4}-\d{4}$/;
  // 일반 전화번호 형식 검증(XX-XXX-XXXX 또는 XXX-XXXX-XXXX)
  const phoneRegex = /^0\d{1,2}-\d{3,4}-\d{4}$/;

  const sanitizedNumber = trimmedNumber.replace(/-/g, '');

  const matchesHyphenFormat = mobileRegex.test(trimmedNumber) || phoneRegex.test(trimmedNumber);
  const matchesDigitsOnlyFormat = isValidPhoneDigits(trimmedNumber);
  const matchesSanitizedDigits = isValidPhoneDigits(sanitizedNumber);

  if (!matchesHyphenFormat && !matchesDigitsOnlyFormat && !matchesSanitizedDigits) {
    return {
      isValid: false,
      error: '전화번호 형식이 올바르지 않습니다. (XXX-XXXX-XXXX 또는 XX-XXX-XXXX 형태로 입력해주세요.)'
    };
  }

  return { isValid: true };
}

/**
 * 이메일을 검증합니다.
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: '이메일을 입력해주세요.' };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return { isValid: false, error: '이메일을 입력해주세요.' };
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: '올바른 이메일 형식이 아닙니다.'
    };
  }

  return { isValid: true };
}

/**
 * 일반 문자열을 검증합니다 (최소/최대 길이).
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 255
): { isValid: boolean; error?: string } {
  if (!value || typeof value !== 'string') {
    return { isValid: false, error: `${fieldName}을(를) 입력해주세요.` };
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName}은(는) 최소 ${minLength}자 이상 입력해주세요.`
    };
  }

  if (trimmedValue.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName}은(는) 최대 ${maxLength}자까지 입력 가능합니다.`
    };
  }

  return { isValid: true };
}
