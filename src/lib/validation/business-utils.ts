/**
 * 사업자등록번호 검증 유틸리티
 */

export interface BusinessNumberValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 사업자등록번호를 검증합니다 (XXX-XX-XXXXX 형식).
 */
export function validateBusinessNumber(businessNumber: string): BusinessNumberValidationResult {
  if (!businessNumber || typeof businessNumber !== 'string') {
    return { isValid: false, error: '사업자등록번호를 입력해주세요.' };
  }

  const trimmedNumber = businessNumber.trim();

  // 형식 검증 (XXX-XX-XXXXX)
  const businessNumberRegex = /^\d{3}-\d{2}-\d{5}$/;
  if (!businessNumberRegex.test(trimmedNumber)) {
    return {
      isValid: false,
      error: '사업자등록번호 형식이 올바르지 않습니다. (XXX-XX-XXXXX 형태로 입력해주세요.)'
    };
  }

  // 실제 검증 로직 (간단한 체크섬 알고리즘)
  const digits = trimmedNumber.replace(/-/g, '').split('').map(Number);

  if (digits.length !== 10) {
    return { isValid: false, error: '사업자등록번호는 10자리 숫자여야 합니다.' };
  }

  // 체크섬 계산 (간단한 알고리즘)
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i];
  }

  const checksum = (10 - (sum % 10)) % 10;
  const lastDigit = digits[9];

  if (checksum !== lastDigit) {
    return {
      isValid: false,
      error: '올바른 사업자등록번호가 아닙니다. 다시 확인해주세요.'
    };
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

  // 휴대폰번호 형식 검증 (XXX-XXXX-XXXX)
  const mobileRegex = /^010-\d{4}-\d{4}$/;
  // 일반 전화번호 형식 검증 (XX-XXX-XXXX 또는 XXX-XXXX-XXXX)
  const phoneRegex = /^0\d{1,2}-\d{3,4}-\d{4}$/;

  if (!mobileRegex.test(trimmedNumber) && !phoneRegex.test(trimmedNumber)) {
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
