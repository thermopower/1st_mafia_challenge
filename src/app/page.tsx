"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, Plus } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Users, Calendar } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  location: string;
  recruitmentCount: number;
  startDate: string;
  endDate: string;
  status: '모집중' | '모집종료' | '선정완료' | '조기종료';
  companyName: string;
  category: string;
}

interface FeaturedCampaignsResponse {
  campaigns: Campaign[];
}

export default function Home() {
  const { user, isAuthenticated, isLoading, refresh, userRole } = useCurrentUser();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 체험단 데이터 가져오기
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        // 1) 우선 featured 엔드포인트 시도
        let campaignsData: Campaign[] | null = null;

        try {
          const res = await fetch('/api/campaigns/featured?limit=6');
          const text = await res.text();
          try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
              campaignsData = parsed as Campaign[];
            } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).data)) {
              campaignsData = (parsed as any).data as Campaign[];
            }
          } catch (e) {
            console.error('Invalid JSON from /api/campaigns/featured:', text);
          }
        } catch (e) {
          // ignore and fallback
        }

        // 2) 실패 시 목록 엔드포인트로 대체 (상태 모집중, 상위 6개)
        if (!campaignsData) {
          const res2 = await fetch('/api/campaigns?limit=6&status=%EB%AA%A8%EC%A7%91%EC%A4%91');
          const text2 = await res2.text();
          try {
            const parsed2 = JSON.parse(text2);
            if (parsed2 && typeof parsed2 === 'object' && Array.isArray((parsed2 as any).campaigns)) {
              campaignsData = (parsed2 as any).campaigns as Campaign[];
            } else if (parsed2 && typeof parsed2 === 'object' && Array.isArray((parsed2 as any).data?.campaigns)) {
              campaignsData = (parsed2 as any).data.campaigns as Campaign[];
            }
          } catch (e) {
            console.error('Invalid JSON from /api/campaigns:', text2);
          }
        }

        if (campaignsData) {
          setCampaigns(campaignsData);
        }
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
      } finally {
        setIsLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, []);

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace("/");
  }, [refresh, router]);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || campaign.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // noop

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">체험단 플랫폼</h1>
              {isAuthenticated && userRole === 'advertiser' && (
                <Link href="/advertiser/campaigns">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    체험단 등록
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">{user?.email}</span>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <Button variant="outline" size="sm">로그인</Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">회원가입</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="체험단명 또는 회사명으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="음식점">음식점</SelectItem>
                <SelectItem value="카페">카페</SelectItem>
                <SelectItem value="뷰티">뷰티</SelectItem>
                <SelectItem value="의류">의류</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 체험단 목록 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">모집 중인 체험단</h2>

          {isLoadingCampaigns ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{campaign.title}</CardTitle>
                      <Badge variant={campaign.status === '모집중' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">{campaign.companyName}</span>
                      <span className="mx-2">•</span>
                      <span>{campaign.category}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {campaign.location}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        모집 인원: {campaign.recruitmentCount}명
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        ~{new Date(campaign.endDate).toLocaleDateString()}
                      </div>
                    </div>

                    <Button className="w-full mt-4" size="sm">
                      자세히 보기
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 추가 기능 링크 */}
        {isAuthenticated && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {userRole === 'influencer' && (
              <Card className="text-center">
                <CardHeader>
                  <CardTitle>내 지원 현황</CardTitle>
                  <CardDescription>지원한 체험단의 진행 상태를 확인하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/me/applications">
                    <Button className="w-full">
                      내 지원 목록 보기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {userRole === 'advertiser' && (
              <Card className="text-center">
                <CardHeader>
                  <CardTitle>체험단 관리</CardTitle>
                  <CardDescription>등록한 체험단을 관리하고 지원자를 확인하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/advertiser/campaigns">
                    <Button className="w-full">
                      체험단 관리하기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

