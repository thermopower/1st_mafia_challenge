"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Alert 컴포넌트 미설치: 임시 박스로 대체
import { validateBusinessNumber, validatePhoneNumber, validateStringLength } from '@/lib/validation/business-utils';
import { validateBirthDate } from '@/lib/validation/sns-utils';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';

export default function AdvertiserProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, userRole } = useCurrentUser();

  // 임시 상태 관리 (실제로는 훅을 사용해야 함)
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    phone: '',
    businessNumber: '',
    representativeName: '',
    category: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);

  useEffect(() => {
    // 입력 페이지에서는 리디렉션을 하지 않고 입력을 계속하게 둔다.
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(null); // 에러 초기화
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // 클라이언트 측 유효성 검사
    const companyNameValidation = validateStringLength(formData.companyName, '업체명', 1, 100);
    if (!companyNameValidation.isValid) {
      setError(companyNameValidation.error || '업체명을 확인해주세요.');
      return;
    }

    const addressValidation = validateStringLength(formData.address, '주소', 1, 255);
    if (!addressValidation.isValid) {
      setError(addressValidation.error || '주소를 확인해주세요.');
      return;
    }

    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || '전화번호를 확인해주세요.');
      return;
    }

    const businessNumberValidation = validateBusinessNumber(formData.businessNumber);
    if (!businessNumberValidation.isValid) {
      setError(businessNumberValidation.error || '사업자등록번호를 확인해주세요.');
      return;
    }

    const representativeNameValidation = validateStringLength(formData.representativeName, '대표자명', 1, 50);
    if (!representativeNameValidation.isValid) {
      setError(representativeNameValidation.error || '대표자명을 확인해주세요.');
      return;
    }

    const categoryValidation = validateStringLength(formData.category, '카테고리', 1, 50);
    if (!categoryValidation.isValid) {
      setError(categoryValidation.error || '카테고리를 확인해주세요.');
      return;
    }

    // 광고주도 생년월일을 받는 경우를 대비 (요구에 따라 확장). 여긴 필드가 없으므로 생략.

    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post('/api/advertiser-profile', formData);
      router.replace('/');
    } catch (error) {
      setError(extractApiErrorMessage(error, '프로필 등록에 실패했습니다.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">광고주 정보 등록</CardTitle>
            <CardDescription>
              체험단을 등록하고 관리하기 위해 회사 정보를 입력해주세요
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">{error}</div>
              )}

              <div>
                <Label htmlFor="companyName">업체명 *</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="회사 또는 브랜드명을 입력하세요"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">주소 *</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="회사 주소를 입력하세요"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">전화번호 *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="02-123-4567 또는 010-1234-5678"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessNumber">사업자등록번호 *</Label>
                <Input
                  id="businessNumber"
                  type="text"
                  value={formData.businessNumber}
                  onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                  placeholder="XXX-XX-XXXXX"
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  사업자등록번호를 정확히 입력해주세요.
                </p>
              </div>

              <div>
                <Label htmlFor="representativeName">대표자명 *</Label>
                <Input
                  id="representativeName"
                  type="text"
                  value={formData.representativeName}
                  onChange={(e) => handleInputChange('representativeName', e.target.value)}
                  placeholder="대표자 실명을 입력하세요"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">카테고리 *</Label>
                <Input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="예: 음식점, 카페, 뷰티, 의류 등"
                  className="mt-1"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '등록 중...' : '광고주 정보 등록'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="mr-2"
              >
                홈으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
