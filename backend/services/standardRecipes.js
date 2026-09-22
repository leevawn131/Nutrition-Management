/**
 * Standard Culinary Recipes and Nutritional Engine for Backend
 * Based on National Institute of Nutrition (Viện Dinh Dưỡng Quốc Gia) & USDA
 */

const STANDARD_DISH_RECIPES = [
  {
    name: 'Phở bò',
    keywords: ['pho bo', 'pho tai', 'pho nam', 'pho gau', 'pho vien', 'phở bò'],
    items: [
      { name: 'Bánh phở tươi', pct: 0.35, calories_per_100g: 140, protein_per_100g: 2.8, carb_per_100g: 31.5, fat_per_100g: 0.2 },
      { name: 'Thịt bò (tái/nạm)', pct: 0.15, calories_per_100g: 250, protein_per_100g: 26.0, carb_per_100g: 0.0, fat_per_100g: 15.0 },
      { name: 'Nước dùng hầm xương bò', pct: 0.45, calories_per_100g: 20, protein_per_100g: 1.2, carb_per_100g: 0.5, fat_per_100g: 1.5 },
      { name: 'Hành tây, hành lá & rau thơm', pct: 0.05, calories_per_100g: 35, protein_per_100g: 1.8, carb_per_100g: 7.0, fat_per_100g: 0.2 },
    ],
  },
  {
    name: 'Phở gà',
    keywords: ['pho ga', 'phở gà'],
    items: [
      { name: 'Bánh phở tươi', pct: 0.35, calories_per_100g: 140, protein_per_100g: 2.8, carb_per_100g: 31.5, fat_per_100g: 0.2 },
      { name: 'Thịt gà luộc xé', pct: 0.20, calories_per_100g: 180, protein_per_100g: 25.0, carb_per_100g: 0.0, fat_per_100g: 8.0 },
      { name: 'Nước dùng hầm gà thanh', pct: 0.40, calories_per_100g: 22, protein_per_100g: 1.5, carb_per_100g: 0.6, fat_per_100g: 1.4 },
      { name: 'Hành lá, lá chanh & rau thơm', pct: 0.05, calories_per_100g: 35, protein_per_100g: 1.8, carb_per_100g: 7.0, fat_per_100g: 0.2 },
    ],
  },
  {
    name: 'Chè thập cẩm',
    keywords: ['che thap cam', 'che dau', 'chè thập cẩm', 'chè', 'che'],
    items: [
      { name: 'Đậu đỏ & Đậu xanh ninh mềm', pct: 0.35, calories_per_100g: 145, protein_per_100g: 8.5, carb_per_100g: 26.5, fat_per_100g: 0.5 },
      { name: 'Thạch sương sáo & Thạch dừa', pct: 0.20, calories_per_100g: 35, protein_per_100g: 0.2, carb_per_100g: 8.5, fat_per_100g: 0.0 },
      { name: 'Nước cốt dừa béo', pct: 0.20, calories_per_100g: 215, protein_per_100g: 2.0, carb_per_100g: 3.0, fat_per_100g: 22.0 },
      { name: 'Trân châu & Thạch củ năng', pct: 0.15, calories_per_100g: 190, protein_per_100g: 0.2, carb_per_100g: 47.0, fat_per_100g: 0.1 },
      { name: 'Nước đường hoa bưởi', pct: 0.10, calories_per_100g: 200, protein_per_100g: 0.0, carb_per_100g: 50.0, fat_per_100g: 0.0 },
    ],
  },
  {
    name: 'Cà phê sữa đá',
    keywords: ['ca phe sua', 'cafe sua', 'cà phê sữa', 'nau da', 'nâu đá'],
    items: [
      { name: 'Cà phê phin nguyên chất', pct: 0.45, calories_per_100g: 5, protein_per_100g: 0.3, carb_per_100g: 0.8, fat_per_100g: 0.1 },
      { name: 'Sữa đặc có đường', pct: 0.25, calories_per_100g: 325, protein_per_100g: 8.0, carb_per_100g: 55.0, fat_per_100g: 8.5 },
      { name: 'Đá viên tinh khiết', pct: 0.30, calories_per_100g: 0, protein_per_100g: 0.0, carb_per_100g: 0.0, fat_per_100g: 0.0 },
    ],
  },
  {
    name: 'Cà phê đen đá',
    keywords: ['ca phe den', 'cafe den', 'cà phê đen', 'đen đá'],
    items: [
      { name: 'Cà phê phin nguyên chất', pct: 0.60, calories_per_100g: 5, protein_per_100g: 0.3, carb_per_100g: 0.8, fat_per_100g: 0.1 },
      { name: 'Đường kính trắng', pct: 0.10, calories_per_100g: 387, protein_per_100g: 0.0, carb_per_100g: 100.0, fat_per_100g: 0.0 },
      { name: 'Đá viên tinh khiết', pct: 0.30, calories_per_100g: 0, protein_per_100g: 0.0, carb_per_100g: 0.0, fat_per_100g: 0.0 },
    ],
  },
  {
    name: 'Bạc xỉu',
    keywords: ['bac xiu', 'bạc xỉu'],
    items: [
      { name: 'Sữa tươi thanh trùng', pct: 0.50, calories_per_100g: 65, protein_per_100g: 3.2, carb_per_100g: 4.8, fat_per_100g: 3.6 },
      { name: 'Sữa đặc có đường', pct: 0.25, calories_per_100g: 325, protein_per_100g: 8.0, carb_per_100g: 55.0, fat_per_100g: 8.5 },
      { name: 'Cà phê phin nguyên chất', pct: 0.15, calories_per_100g: 5, protein_per_100g: 0.3, carb_per_100g: 0.8, fat_per_100g: 0.1 },
      { name: 'Đá viên tinh khiết', pct: 0.10, calories_per_100g: 0, protein_per_100g: 0.0, carb_per_100g: 0.0, fat_per_100g: 0.0 },
    ],
  },
  {
    name: 'Trà sữa trân châu',
    keywords: ['tra sua', 'milk tea', 'trà sữa'],
    items: [
      { name: 'Cốt trà ô long / hồng trà', pct: 0.50, calories_per_100g: 8, protein_per_100g: 0.3, carb_per_100g: 1.5, fat_per_100g: 0.1 },
      { name: 'Sữa tươi & bột kem béo', pct: 0.25, calories_per_100g: 150, protein_per_100g: 2.5, carb_per_100g: 14.0, fat_per_100g: 9.5 },
      { name: 'Trân châu đường đen', pct: 0.25, calories_per_100g: 210, protein_per_100g: 0.3, carb_per_100g: 52.0, fat_per_100g: 0.1 },
    ],
  },
  {
    name: 'Bún chả Hà Nội',
    keywords: ['bun cha', 'bún chả'],
    items: [
      { name: 'Bún tươi', pct: 0.40, calories_per_100g: 110, protein_per_100g: 1.7, carb_per_100g: 25.7, fat_per_100g: 0.1 },
      { name: 'Chả thịt heo nướng', pct: 0.25, calories_per_100g: 240, protein_per_100g: 17.5, carb_per_100g: 3.0, fat_per_100g: 17.5 },
      { name: 'Nước mắm pha chua ngọt', pct: 0.25, calories_per_100g: 55, protein_per_100g: 1.5, carb_per_100g: 12.0, fat_per_100g: 0.1 },
      { name: 'Đu đủ chua & rau sống', pct: 0.10, calories_per_100g: 25, protein_per_100g: 0.8, carb_per_100g: 5.0, fat_per_100g: 0.2 },
    ],
  },
  {
    name: 'Bún bò Huế',
    keywords: ['bun bo hue', 'bun bo', 'bún bò huế', 'bún bò'],
    items: [
      { name: 'Bún sợi to', pct: 0.35, calories_per_100g: 110, protein_per_100g: 1.7, carb_per_100g: 25.7, fat_per_100g: 0.1 },
      { name: 'Bắp bò & nạm bò luộc', pct: 0.15, calories_per_100g: 215, protein_per_100g: 23.0, carb_per_100g: 0.0, fat_per_100g: 13.5 },
      { name: 'Chả cua / Giò heo', pct: 0.15, calories_per_100g: 220, protein_per_100g: 15.0, carb_per_100g: 2.0, fat_per_100g: 17.0 },
      { name: 'Nước dùng bún bò (sa tế, sả)', pct: 0.30, calories_per_100g: 28, protein_per_100g: 1.0, carb_per_100g: 1.2, fat_per_100g: 2.1 },
      { name: 'Rau sống, bắp chuối & giá đỗ', pct: 0.05, calories_per_100g: 20, protein_per_100g: 1.2, carb_per_100g: 3.2, fat_per_100g: 0.2 },
    ],
  },
  {
    name: 'Cơm tấm sườn bì chả',
    keywords: ['com tam', 'cơm tấm', 'com suon'],
    items: [
      { name: 'Cơm tấm', pct: 0.40, calories_per_100g: 130, protein_per_100g: 2.7, carb_per_100g: 28.0, fat_per_100g: 0.3 },
      { name: 'Sườn heo nướng', pct: 0.25, calories_per_100g: 250, protein_per_100g: 19.0, carb_per_100g: 2.5, fat_per_100g: 18.0 },
      { name: 'Chả trứng hấp', pct: 0.15, calories_per_100g: 185, protein_per_100g: 12.0, carb_per_100g: 7.5, fat_per_100g: 11.5 },
      { name: 'Bì heo trộn thính', pct: 0.10, calories_per_100g: 215, protein_per_100g: 28.0, carb_per_100g: 5.0, fat_per_100g: 9.5 },
      { name: 'Mỡ hành & dưa leo', pct: 0.10, calories_per_100g: 75, protein_per_100g: 1.0, carb_per_100g: 8.0, fat_per_100g: 4.5 },
    ],
  },
  {
    name: 'Bánh mì thịt',
    keywords: ['banh mi', 'bánh mì', 'banh my'],
    items: [
      { name: 'Vỏ bánh mì giòn', pct: 0.45, calories_per_100g: 265, protein_per_100g: 8.5, carb_per_100g: 52.0, fat_per_100g: 2.2 },
      { name: 'Thịt nguội & Chả lụa', pct: 0.25, calories_per_100g: 230, protein_per_100g: 17.0, carb_per_100g: 3.5, fat_per_100g: 16.5 },
      { name: 'Pâté gan heo', pct: 0.15, calories_per_100g: 320, protein_per_100g: 14.0, carb_per_100g: 4.0, fat_per_100g: 28.0 },
      { name: 'Bơ sốt & đồ chua', pct: 0.15, calories_per_100g: 110, protein_per_100g: 1.0, carb_per_100g: 8.0, fat_per_100g: 8.5 },
    ],
  },
  {
    name: 'Bún riêu cua',
    keywords: ['bun rieu', 'bún riêu'],
    items: [
      { name: 'Bún tươi', pct: 0.35, calories_per_100g: 110, protein_per_100g: 1.7, carb_per_100g: 25.7, fat_per_100g: 0.1 },
      { name: 'Riêu cua đồng', pct: 0.15, calories_per_100g: 140, protein_per_100g: 12.5, carb_per_100g: 2.0, fat_per_100g: 9.2 },
      { name: 'Đậu phụ rán giòn', pct: 0.15, calories_per_100g: 170, protein_per_100g: 14.0, carb_per_100g: 3.0, fat_per_100g: 11.5 },
      { name: 'Cà chua & Nước dùng riêu', pct: 0.30, calories_per_100g: 25, protein_per_100g: 1.0, carb_per_100g: 2.5, fat_per_100g: 1.2 },
      { name: 'Rau kinh giới & hoa chuối', pct: 0.05, calories_per_100g: 20, protein_per_100g: 1.2, carb_per_100g: 3.2, fat_per_100g: 0.2 },
    ],
  },
  {
    name: 'Cơm rang dưa bò',
    keywords: ['com rang dua bo', 'com rang', 'cơm rang'],
    items: [
      { name: 'Cơm rang trứng', pct: 0.55, calories_per_100g: 175, protein_per_100g: 4.5, carb_per_100g: 30.0, fat_per_100g: 4.2 },
      { name: 'Thịt bò xào mềm', pct: 0.25, calories_per_100g: 215, protein_per_100g: 22.0, carb_per_100g: 1.5, fat_per_100g: 13.5 },
      { name: 'Dưa cải chua xào', pct: 0.20, calories_per_100g: 45, protein_per_100g: 1.2, carb_per_100g: 4.5, fat_per_100g: 2.4 },
    ],
  },
  {
    name: 'Bún đậu mắm tôm',
    keywords: ['bun dau', 'bún đậu', 'bun dau mam tom'],
    items: [
      { name: 'Bún lá tươi', pct: 0.35, calories_per_100g: 110, protein_per_100g: 1.7, carb_per_100g: 25.7, fat_per_100g: 0.1 },
      { name: 'Đậu phụ rán giòn', pct: 0.25, calories_per_100g: 170, protein_per_100g: 14.0, carb_per_100g: 3.0, fat_per_100g: 11.5 },
      { name: 'Chả cốm rán', pct: 0.15, calories_per_100g: 230, protein_per_100g: 13.0, carb_per_100g: 18.0, fat_per_100g: 12.0 },
      { name: 'Thịt chân giò luộc', pct: 0.15, calories_per_100g: 230, protein_per_100g: 21.0, carb_per_100g: 0.0, fat_per_100g: 16.0 },
      { name: 'Mắm tôm pha tắc ớt & rau thơm', pct: 0.10, calories_per_100g: 45, protein_per_100g: 4.0, carb_per_100g: 5.0, fat_per_100g: 1.0 },
    ],
  },
  {
    name: 'Bún thịt nướng',
    keywords: ['bun thit nuong', 'bún thịt nướng'],
    items: [
      { name: 'Bún tươi', pct: 0.40, calories_per_100g: 110, protein_per_100g: 1.7, carb_per_100g: 25.7, fat_per_100g: 0.1 },
      { name: 'Thịt nạc vai heo nướng', pct: 0.25, calories_per_100g: 245, protein_per_100g: 18.0, carb_per_100g: 3.0, fat_per_100g: 18.0 },
      { name: 'Chả giò chiên giòn', pct: 0.15, calories_per_100g: 240, protein_per_100g: 9.0, carb_per_100g: 22.0, fat_per_100g: 13.0 },
      { name: 'Đậu phộng rang & mỡ hành', pct: 0.05, calories_per_100g: 450, protein_per_100g: 16.0, carb_per_100g: 10.0, fat_per_100g: 38.0 },
      { name: 'Nước mắm chua ngọt & rau sống', pct: 0.15, calories_per_100g: 45, protein_per_100g: 1.2, carb_per_100g: 9.0, fat_per_100g: 0.2 },
    ],
  },
  {
    name: 'Cơm gà',
    keywords: ['com ga', 'cơm gà', 'com ga xoi mo'],
    items: [
      { name: 'Cơm nấu nước luộc gà', pct: 0.50, calories_per_100g: 145, protein_per_100g: 3.2, carb_per_100g: 30.0, fat_per_100g: 1.5 },
      { name: 'Thịt gà ta xé / đùi gà', pct: 0.35, calories_per_100g: 195, protein_per_100g: 24.0, carb_per_100g: 0.0, fat_per_100g: 11.0 },
      { name: 'Nước mắm gừng tỏi & hành tây', pct: 0.10, calories_per_100g: 40, protein_per_100g: 1.0, carb_per_100g: 8.0, fat_per_100g: 0.2 },
      { name: 'Rau răm & dưa leo', pct: 0.05, calories_per_100g: 18, protein_per_100g: 1.0, carb_per_100g: 3.0, fat_per_100g: 0.2 },
    ],
  },
  {
    name: 'Thịt kho tàu',
    keywords: ['thit kho tau', 'thịt kho tàu', 'thit kho trung', 'thịt kho trứng'],
    items: [
      { name: 'Thịt ba chỉ heo kho mềm', pct: 0.55, calories_per_100g: 280, protein_per_100g: 16.0, carb_per_100g: 2.0, fat_per_100g: 23.0 },
      { name: 'Trứng vịt / gà luộc kho', pct: 0.30, calories_per_100g: 155, protein_per_100g: 13.0, carb_per_100g: 1.1, fat_per_100g: 11.0 },
      { name: 'Nước kho dừa xiêm', pct: 0.15, calories_per_100g: 65, protein_per_100g: 0.8, carb_per_100g: 12.0, fat_per_100g: 1.5 },
    ],
  },
  {
    name: 'Canh chua cá',
    keywords: ['canh chua', 'canh chua ca'],
    items: [
      { name: 'Cá tươi nấu canh (cá lóc/hú)', pct: 0.35, calories_per_100g: 105, protein_per_100g: 18.5, carb_per_100g: 0.0, fat_per_100g: 3.2 },
      { name: 'Cà chua & dứa (thơm)', pct: 0.25, calories_per_100g: 28, protein_per_100g: 1.0, carb_per_100g: 6.0, fat_per_100g: 0.2 },
      { name: 'Đậu bắp & dọc mùng', pct: 0.20, calories_per_100g: 25, protein_per_100g: 1.5, carb_per_100g: 4.5, fat_per_100g: 0.2 },
      { name: 'Nước canh me chua ngọt thanh', pct: 0.20, calories_per_100g: 20, protein_per_100g: 0.5, carb_per_100g: 4.0, fat_per_100g: 0.2 },
    ],
  },
  {
    name: 'Canh cua rau đay',
    keywords: ['canh cua', 'rau day', 'mong toi', 'mồng tơi'],
    items: [
      { name: 'Riêu cua đồng nấu canh', pct: 0.35, calories_per_100g: 75, protein_per_100g: 9.0, carb_per_100g: 1.5, fat_per_100g: 3.5 },
      { name: 'Rau đay & mồng tơi', pct: 0.35, calories_per_100g: 24, protein_per_100g: 2.0, carb_per_100g: 3.5, fat_per_100g: 0.3 },
      { name: 'Mướp hương thái lát', pct: 0.20, calories_per_100g: 18, protein_per_100g: 0.9, carb_per_100g: 3.5, fat_per_100g: 0.1 },
      { name: 'Nước canh cua ngọt thanh', pct: 0.10, calories_per_100g: 15, protein_per_100g: 1.0, carb_per_100g: 1.0, fat_per_100g: 0.5 },
    ],
  },
  {
    name: 'Gà rán',
    keywords: ['ga ran', 'gà rán', 'canh ga chien', 'cánh gà chiên'],
    items: [
      { name: 'Thịt gà chiên giòn', pct: 0.70, calories_per_100g: 220, protein_per_100g: 22.0, carb_per_100g: 0.0, fat_per_100g: 14.0 },
      { name: 'Lớp bột chiên xù', pct: 0.15, calories_per_100g: 320, protein_per_100g: 6.0, carb_per_100g: 65.0, fat_per_100g: 4.0 },
      { name: 'Dầu thực vật ngấm khi rán', pct: 0.15, calories_per_100g: 884, protein_per_100g: 0.0, carb_per_100g: 0.0, fat_per_100g: 100.0 },
    ],
  },
  {
    name: 'Trứng chiên',
    keywords: ['trung chien', 'trứng chiên', 'trung ran', 'trứng rán'],
    items: [
      { name: 'Trứng gà tươi đánh bông', pct: 0.85, calories_per_100g: 155, protein_per_100g: 13.0, carb_per_100g: 1.1, fat_per_100g: 11.0 },
      { name: 'Dầu thực vật rán trứng', pct: 0.10, calories_per_100g: 884, protein_per_100g: 0.0, carb_per_100g: 0.0, fat_per_100g: 100.0 },
      { name: 'Hành lá & tiêu gia vị', pct: 0.05, calories_per_100g: 32, protein_per_100g: 1.8, carb_per_100g: 7.3, fat_per_100g: 0.2 },
    ],
  },
  {
    name: 'Trứng ốp la',
    keywords: ['op la', 'ốp la', 'trung op'],
    items: [
      { name: 'Trứng gà tươi áp chảo', pct: 0.90, calories_per_100g: 155, protein_per_100g: 13.0, carb_per_100g: 1.1, fat_per_100g: 11.0 },
      { name: 'Dầu ăn / Bơ lạt', pct: 0.10, calories_per_100g: 750, protein_per_100g: 0.5, carb_per_100g: 0.5, fat_per_100g: 82.0 },
    ],
  },
  {
    name: 'Rau muống xào tỏi',
    keywords: ['rau muong xao', 'rau muống xào', 'rau xao'],
    items: [
      { name: 'Rau muống non xanh', pct: 0.80, calories_per_100g: 25, protein_per_100g: 2.6, carb_per_100g: 3.1, fat_per_100g: 0.4 },
      { name: 'Dầu thực vật xào', pct: 0.12, calories_per_100g: 884, protein_per_100g: 0.0, carb_per_100g: 0.0, fat_per_100g: 100.0 },
      { name: 'Tỏi phi thơm & gia vị', pct: 0.08, calories_per_100g: 140, protein_per_100g: 6.0, carb_per_100g: 30.0, fat_per_100g: 0.5 },
    ],
  },
  {
    name: 'Bánh cuốn nóng',
    keywords: ['banh cuon', 'bánh cuốn'],
    items: [
      { name: 'Bánh cuốn tráng mỏng (bột gạo)', pct: 0.55, calories_per_100g: 125, protein_per_100g: 2.0, carb_per_100g: 27.0, fat_per_100g: 0.5 },
      { name: 'Nhân thịt băm & mộc nhĩ nấm hương', pct: 0.25, calories_per_100g: 190, protein_per_100g: 14.0, carb_per_100g: 4.0, fat_per_100g: 13.0 },
      { name: 'Chả lụa / Chả quế', pct: 0.10, calories_per_100g: 215, protein_per_100g: 16.0, carb_per_100g: 3.0, fat_per_100g: 15.0 },
      { name: 'Nước mắm pha ấm & hành phi', pct: 0.10, calories_per_100g: 85, protein_per_100g: 1.5, carb_per_100g: 15.0, fat_per_100g: 2.5 },
    ],
  },
  {
    name: 'Chè bưởi',
    keywords: ['che buoi', 'chè bưởi'],
    items: [
      { name: 'Cùi bưởi giòn', pct: 0.30, calories_per_100g: 65, protein_per_100g: 0.5, carb_per_100g: 16.0, fat_per_100g: 0.1 },
      { name: 'Đậu xanh ninh nhừ', pct: 0.30, calories_per_100g: 145, protein_per_100g: 8.5, carb_per_100g: 26.5, fat_per_100g: 0.5 },
      { name: 'Nước cốt dừa béo bùi', pct: 0.20, calories_per_100g: 215, protein_per_100g: 2.0, carb_per_100g: 3.0, fat_per_100g: 22.0 },
      { name: 'Nước đường hoa bưởi & bột năng', pct: 0.20, calories_per_100g: 180, protein_per_100g: 0.1, carb_per_100g: 45.0, fat_per_100g: 0.1 },
    ],
  },
  {
    name: 'Cà phê muối',
    keywords: ['ca phe muoi', 'cà phê muối'],
    items: [
      { name: 'Cà phê phin nguyên chất', pct: 0.45, calories_per_100g: 5, protein_per_100g: 0.3, carb_per_100g: 0.8, fat_per_100g: 0.1 },
      { name: 'Lớp kem muối béo ngậy', pct: 0.25, calories_per_100g: 260, protein_per_100g: 1.5, carb_per_100g: 8.0, fat_per_100g: 25.0 },
      { name: 'Sữa đặc có đường', pct: 0.20, calories_per_100g: 325, protein_per_100g: 8.0, carb_per_100g: 55.0, fat_per_100g: 8.5 },
      { name: 'Đá viên tinh khiết', pct: 0.10, calories_per_100g: 0, protein_per_100g: 0.0, carb_per_100g: 0.0, fat_per_100g: 0.0 },
    ],
  },
  {
    name: 'Sinh tố bơ',
    keywords: ['sinh to bo', 'sinh tố bơ'],
    items: [
      { name: 'Thịt bơ sáp chín dẻo', pct: 0.60, calories_per_100g: 160, protein_per_100g: 2.0, carb_per_100g: 8.5, fat_per_100g: 14.7 },
      { name: 'Sữa đặc có đường', pct: 0.20, calories_per_100g: 325, protein_per_100g: 8.0, carb_per_100g: 55.0, fat_per_100g: 8.5 },
      { name: 'Sữa tươi thanh trùng', pct: 0.15, calories_per_100g: 62, protein_per_100g: 3.2, carb_per_100g: 4.7, fat_per_100g: 3.5 },
      { name: 'Đá bào nhuyễn', pct: 0.05, calories_per_100g: 0, protein_per_100g: 0.0, carb_per_100g: 0.0, fat_per_100g: 0.0 },
    ],
  },
  {
    name: 'Mì Ý sốt bò bằm',
    keywords: ['mi y', 'mì ý', 'spaghetti', 'bolognese'],
    items: [
      { name: 'Mì Spaghetti luộc', pct: 0.55, calories_per_100g: 158, protein_per_100g: 5.8, carb_per_100g: 31.0, fat_per_100g: 0.9 },
      { name: 'Sốt thịt bò băm cà chua', pct: 0.35, calories_per_100g: 140, protein_per_100g: 12.0, carb_per_100g: 7.5, fat_per_100g: 7.0 },
      { name: 'Phô mai bột Parmesan', pct: 0.10, calories_per_100g: 431, protein_per_100g: 38.0, carb_per_100g: 4.0, fat_per_100g: 29.0 },
    ],
  },
];

const RAW_FOODS_100G = [
  { name: 'Thịt bò', calories: 250, protein: 26, carb: 0, fat: 15 },
  { name: 'Thịt lợn nạc', calories: 143, protein: 21, carb: 0, fat: 6.2 },
  { name: 'Ức gà', calories: 165, protein: 31, carb: 0, fat: 3.6 },
  { name: 'Trứng gà', calories: 155, protein: 13, carb: 1.1, fat: 11 },
  { name: 'Cá hồi', calories: 208, protein: 20, carb: 0, fat: 13 },
  { name: 'Cơm trắng', calories: 130, protein: 2.7, carb: 28, fat: 0.3 },
  { name: 'Bánh phở', calories: 140, protein: 2.8, carb: 31.5, fat: 0.2 },
  { name: 'Bún tươi', calories: 110, protein: 1.7, carb: 25.7, fat: 0.1 },
  { name: 'Sữa đặc có đường', calories: 325, protein: 8, carb: 55, fat: 8.5 },
  { name: 'Nước cốt dừa', calories: 215, protein: 2, carb: 3, fat: 22 },
  { name: 'Đậu phụ', calories: 76, protein: 8, carb: 1.9, fat: 4.8 },
  { name: 'Đậu đỏ', calories: 145, protein: 8.5, carb: 26.5, fat: 0.5 },
  { name: 'Đậu xanh', calories: 145, protein: 8.5, carb: 26.5, fat: 0.5 },
  { name: 'Cà phê', calories: 5, protein: 0.3, carb: 0.8, fat: 0.1 },
  { name: 'Đường', calories: 387, protein: 0, carb: 100, fat: 0 },
  { name: 'Dầu ăn', calories: 884, protein: 0, carb: 0, fat: 100 },
];

function normalizeText(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .trim();
}

/**
 * Lấy công thức nấu ăn chuẩn xác từ ngân hàng công thức ẩm thực
 */
function getStandardDishRecipe(dishName, portionG) {
  if (!dishName || portionG <= 0) return null;
  const norm = normalizeText(dishName);

  const matched = STANDARD_DISH_RECIPES.find(r =>
    r.keywords.some(k => norm.includes(normalizeText(k)))
  );

  if (!matched) return null;

  return matched.items.map(it => {
    const w = Math.max(5, Math.round(portionG * it.pct));
    const factor = w / 100;
    return {
      name: it.name,
      portion_g: w,
      calories: Math.round(it.calories_per_100g * factor),
      protein_g: Number((it.protein_per_100g * factor).toFixed(1)),
      carb_g: Number((it.carb_per_100g * factor).toFixed(1)),
      fat_g: Number((it.fat_per_100g * factor).toFixed(1)),
      source: 'inferred',
    };
  });
}

/**
 * Bóc tách nguyên liệu khi AI trả về dạng chuỗi gộp trong ngoặc đơn
 * VD: "Chè thập cẩm (đậu, thạch, cốt dừa, đường)"
 */
function expandCompoundIngredient(ingName, portionG) {
  if (!ingName) return null;
  const match = ingName.match(/^(.*?)\s*\((.*?)\)$/);
  if (!match) return null;

  const dishNamePart = match[1].trim();
  const subItemsStr = match[2].trim();

  // Thử tra công thức chuẩn của món trước
  const recipe = getStandardDishRecipe(dishNamePart, portionG);
  if (recipe && recipe.length > 0) {
    return recipe;
  }

  // Nếu không, bóc tách các thành phần con trong ngoặc
  const parts = subItemsStr.split(/[,;\+]/).map(s => s.trim()).filter(s => s.length > 0);
  if (parts.length <= 1) return null;

  const perItemWeight = Math.max(10, Math.round(portionG / parts.length));
  return parts.map(part => {
    const partNorm = normalizeText(part);
    const verified = RAW_FOODS_100G.find(db =>
      partNorm.includes(normalizeText(db.name)) || normalizeText(db.name).includes(partNorm)
    );

    const cal100 = verified ? verified.calories : 120;
    const p100 = verified ? verified.protein : 4;
    const c100 = verified ? verified.carb : 18;
    const f100 = verified ? verified.fat : 3;
    const factor = perItemWeight / 100;

    return {
      name: part.charAt(0).toUpperCase() + part.slice(1),
      portion_g: perItemWeight,
      calories: Math.round(cal100 * factor),
      protein_g: Number((p100 * factor).toFixed(1)),
      carb_g: Number((c100 * factor).toFixed(1)),
      fat_g: Number((f100 * factor).toFixed(1)),
      source: 'inferred',
    };
  });
}

module.exports = {
  STANDARD_DISH_RECIPES,
  RAW_FOODS_100G,
  getStandardDishRecipe,
  expandCompoundIngredient,
};
