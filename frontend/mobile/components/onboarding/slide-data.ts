export interface OnboardingSlideItem {
  id: string;
  title: string;
  description: string;
  illustrationType: 'recipes' | 'ai_plan' | 'community';
}

export const ONBOARDING_SLIDES: OnboardingSlideItem[] = [
  {
    id: 'slide_1',
    title: 'Thực đơn phong phú',
    description:
      '10.000+ Công thức nấu ăn bổ dưỡng,\nđa dạng chế độ và phù hợp vùng miền.',
    illustrationType: 'recipes',
  },
  {
    id: 'slide_2',
    title: 'Kế hoạch ăn uống cá thể hoá',
    description:
      'AI gợi ý lên thực đơn phù hợp với thể\ntrạng từng người & Có thể đặt lịch tư\nvấn 1-1 từ Chuyên gia uy tín',
    illustrationType: 'ai_plan',
  },
  {
    id: 'slide_3',
    title: 'Cộng đồng dinh dưỡng lớn',
    description:
      'Thoả thích sáng tạo công thức mới và\ntheo dõi cộng đồng dinh dưỡng/\nchuyên gia/KOL',
    illustrationType: 'community',
  },
];
