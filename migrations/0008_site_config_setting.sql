-- Migration 0008: Add CMS site configuration setting

INSERT INTO settings (key, value)
SELECT
  'site_config',
  '{"familyName":"Trần Công","familyLabel":"Gia Phả Họ","siteTitle":"Gia phả họ Trần Công","shortName":"TC","logoUrl":"/tranconglogo.png","heroTitle":"Lưu giữ cội nguồn","heroSubtitle":"Kết nối muôn đời con cháu","heroDescription":"Gia phả là sợi dây thiêng liêng kết nối quá khứ, hiện tại và tương lai. Cùng nhau gìn giữ cội nguồn, vun đắp truyền thống cho muôn đời con cháu.","primaryCtaLabel":"Xem gia phả","secondaryCtaLabel":"Tìm người thân","mainTreeTitle":"Cây gia phả dòng chính","loginDescription":"Hệ thống yêu cầu mật khẩu để xem thông tin chi tiết gia phả dòng họ.","footerQuote":"Cội nguồn là nơi bắt đầu - Ký ức là sợi dây - Tương lai là nơi tiếp nối.","footerMessage":"Nguyện cùng nhau gìn giữ, để dòng họ Trần Công mãi bền vững và tỏa sáng."}'
WHERE NOT EXISTS (
  SELECT 1 FROM settings WHERE key = 'site_config'
);
