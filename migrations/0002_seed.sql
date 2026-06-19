-- Migration 0002: Seed Initial Data

-- 1. Clean up old data
DELETE FROM members;
DELETE FROM users;
DELETE FROM settings;

-- 2. Insert initial users
INSERT INTO users (username, password, role, fullName) VALUES
('admin', 'pbkdf2:831d51423ca7c9f63e35ffadc5e6a778:31bc8b0f51a53df1f077ae3b274d3b101dfcc690899791882ba4930b1e66d34f', 'admin', 'Quản trị viên'),
('editor', 'pbkdf2:e48d6c0711a74d434586885a3a5aaef8:7022bcc4828ef38f3911c6a6b445a69d4903a3217ac47a2b387fb64ee8312877', 'editor', 'Biên tập viên'),
('member', 'pbkdf2:e41bf6e79f74ab31893ec1d32e9984a7:224470f350a3d28e25cc1f193d06e81a800d25a881594d8b886d72446350df13', 'member', 'Thành viên Gia tộc');

-- 3. Insert initial settings
INSERT INTO settings (key, value) VALUES
('private_mode', 'true'),
('site_config', '{"familyName":"Trần Công","familyLabel":"Gia Phả Họ","siteTitle":"Gia phả họ Trần Công","shortName":"TC","logoUrl":"/tranconglogo.png","heroTitle":"Lưu giữ cội nguồn","heroSubtitle":"Kết nối muôn đời con cháu","heroDescription":"Gia phả là sợi dây thiêng liêng kết nối quá khứ, hiện tại và tương lai. Cùng nhau gìn giữ cội nguồn, vun đắp truyền thống cho muôn đời con cháu.","primaryCtaLabel":"Khám phá gia phả","secondaryCtaLabel":"Tìm người thân","mainTreeTitle":"Cây gia phả dòng chính","loginDescription":"Hệ thống yêu cầu mật khẩu để xem thông tin chi tiết gia phả dòng họ.","footerQuote":"Cội nguồn là nơi bắt đầu - Ký ức là sợi dây - Tương lai là nơi tiếp nối.","footerMessage":"Nguyện cùng nhau gìn giữ, để dòng họ Trần Công mãi bền vững và tỏa sáng."}');

-- 4. Insert Trần Công family members (45 members)
INSERT INTO members (id, name, gender, generation, isDeceased, birthDate, deathDate, birthPlace, restingPlace, occupation, bio, phone, address, spouseIds, fatherId, motherId) VALUES
('g1_1', 'Trần Công Kỳ', 'nam', 1, 1, NULL, '1938-06-06', 'Mỹ Thắng - Nam Đinh', 'Nghĩa Trang Làng Sắc', 'Làm nông', 'Có 5 người con (2 trai, 3 gái).', '', '', '["g1_2"]', NULL, NULL),
('g1_2', 'Trần Thị Hiến', 'nu', 1, 1, NULL, '1938-03-29', 'Mỹ Thắng - Nam Định', '', 'Làm nông', 'Có 5 người con (2 trai, 3 gái).', '', '', '["g1_1"]', NULL, NULL),
('g2_1', 'Trần Thị Nụ', 'nu', 2, 1, NULL, NULL, '', '', '', 'Không có thông tin', '', '', '["g2_2"]', 'g1_1', 'g1_2'),
('g2_10', 'Nguyễn Thị Khoa', 'nu', 2, 1, NULL, NULL, 'Nam Định', '', 'Làm nông', 'Có 3 người con (1 trai, 2 gái).', '', '', '["g2_9"]', NULL, NULL),
('g2_2', 'Trần Sỹ Phu', 'nam', 2, 1, NULL, NULL, 'Làng Mai - Mỹ Thắng', '', '', 'Không có thông tin', '', '', '["g2_1"]', NULL, NULL),
('g2_3', 'Trần Thị Sen', 'nu', 2, 1, NULL, NULL, '', '', 'Làm Nông', 'Có 2 người con trai', '', '', '["g2_4"]', 'g1_1', 'g1_2'),
('g2_4', 'Trần Đình Bảng', 'nam', 2, 1, NULL, NULL, 'Cùng làng', '', 'Làm Nông', 'Có 2 người con trai. 2 ông bà cùng làng', '', '', '["g2_3"]', NULL, NULL),
('g2_5', 'Trần Công Nghệch', 'nam', 2, 1, NULL, '1966-02-02', 'Nam Định', '', '', 'Có 3 con trai và 4 con gái.', '', '', '["g2_6"]', 'g1_1', 'g1_2'),
('g2_6', 'Trần Thị Vân', 'nu', 2, 1, NULL, NULL, 'Nam Định', '', 'Làm nông', 'Có 3 con trai và 4 con gái
Mất : 30-9-không rõ', '', '', '["g2_5"]', NULL, NULL),
('g2_7', 'Trần Thị Kịt', 'nu', 2, 1, NULL, NULL, 'Nam Định', '', 'Làm nông', 'Có 8 người con (4 trai, 4 gái).', '', '', '["g2_8"]', 'g1_1', 'g1_2'),
('g2_8', 'Đặng Hữu Liên', 'nam', 2, 1, NULL, NULL, 'Làng Mỹ', '', '', 'Có 8 người con (4 trai, 4 gái).', '', '', '["g2_7"]', NULL, NULL),
('g2_9', 'Trần Công Kế', 'nam', 2, 1, NULL, NULL, 'Nam Định', '', 'Làm nông', 'Có 3 người con (1 trai, 2 gái).', '', '', '["g2_10"]', 'g1_1', 'g1_2'),
('g3_1', 'Trần Thị Vẻ', 'nu', 3, 1, '1920-01-01', NULL, 'Nam Định', '', 'Làm nông', 'Có 4 người con (3 trai và 1 gái)', '', '', '["g3_2"]', 'g2_5', 'g2_6'),
('g3_10', 'Trần Công Bảy', 'nam', 3, 1, '1931-01-01', '1999-11-16', 'Mỹ Thắng - Nam Định', 'Nghĩa Trang Làng Sắc', 'Làm nông', 'Có 8 người con (6 trai, 2 gái).', '', '', '["g3_11"]', 'g2_5', 'g2_6'),
('g3_11', 'Trần Thị Thực', 'nu', 3, 1, '1929-01-01', '1998-12-29', 'Nam Định', 'Nghĩa Trang Làng Sắc', 'Làm nông', 'Có 8 người con (6 trai và 2 gái)', '', '', '["g3_10"]', NULL, NULL),
('g3_12', 'Trần Công Tám', 'nam', 3, 0, '1944-01-01', NULL, 'Nam Định', '', '', 'Chưa có thông tin', '', '', '["g3_13"]', 'g2_5', 'g2_6'),
('g3_13', 'Vợ Trần Công Tám', 'nu', 3, 0, NULL, NULL, 'Nam Định', '', '', 'Chưa có thông tin', '', '', '["g3_12"]', NULL, NULL),
('g3_14', 'Trần Thị Vân', 'nu', 3, 1, '1932-01-01', NULL, '', '', '', 'Có 8 người con (4 trai, 4 gái).', '', '', '["g3_15"]', 'g2_9', 'g2_10'),
('g3_15', 'Trần Văn Tòng', 'nam', 3, 1, NULL, NULL, 'Xóm 7', '', '', 'Có 8 người con (4 trai và 4 gái)', '', '', '["g3_14"]', NULL, NULL),
('g3_16', 'Trần Thị Xuân', 'nu', 3, 1, NULL, NULL, 'Nam Định', '', 'Làm nông', 'Có 3 người con (1 trai và 2 gái)', '', '', '["g3_17"]', 'g2_9', 'g2_10'),
('g3_17', 'Trần Văn Thăng', 'nam', 3, 1, NULL, NULL, 'Xóm Thát Đông - Mỹ Thắng - Nam Định', '', 'Làm nông', 'Có 3 người con (1 trai và 2 gái)', '', '', '["g3_16"]', NULL, NULL),
('g3_18', 'Trần Công Mùi', 'nu', 3, 1, NULL, NULL, 'Nam Định', '', 'Làm nông', 'Có 5 người con (2 trai và 3 gái)', '', '', '["g3_19"]', 'g2_9', 'g2_10'),
('g3_19', 'Vợ Trần Công Mùi', 'nu', 3, 1, NULL, NULL, '', '', '', 'Có 5 người con (2 trai và 3 gái)', '', '', '["g3_18"]', NULL, NULL),
('g3_2', 'Trần Văn Tiềm', 'nam', 3, 1, NULL, NULL, 'Làng Thát Đoài-Nam Định', '', 'Làm nông', 'Có 4 người con (3 trai và 1 gái)', '', '', '["g3_1"]', NULL, NULL),
('g3_3', 'Trần Thị Vang', 'nu', 3, 1, '1922-01-01', '1988-02-02', 'Xóm 10 - Mỹ Thắng-Làng Sắc-Nam Định', '', 'Làm nông', 'Chưa có thông tin', '', '', '[]', 'g2_5', 'g2_6'),
('g3_4', 'Trần Thị Vuông', 'nu', 3, 1, '1924-01-01', NULL, 'Nam Định', '', 'Làm nông', 'Có 6 người con (3 trai và 3 gái)', '', '', '["g3_5"]', 'g2_5', 'g2_6'),
('g3_5', 'Trần Văn Lễ', 'nam', 3, 1, NULL, NULL, 'Làng Thát Đoài-Mỹ Thắng', '', 'Làm nông', 'Có 6 người con (3 trai và 3 gái)', '', '', '["g3_4"]', NULL, NULL),
('g3_6', 'Trần Thị Tròn', 'nu', 3, 1, '1926-01-01', NULL, 'Mỹ Thắng-Nam ĐỊnh', '', 'Làm nông', 'Có 4 người con (3 trai, 1 gái).', '', '', '["g3_7"]', 'g2_5', 'g2_6'),
('g3_7', 'Trần Nhất Chức', 'nam', 3, 1, NULL, NULL, 'Xóm9-Mỹ Thắng', '', 'Làm nông', 'Có 4 người con (3 trai và 1 gái).', '', '', '["g3_6"]', NULL, NULL),
('g3_8', 'Trần Công Húc', 'nam', 3, 1, '1929-01-01', '1992-03-21', 'Xóm 10 - Mỹ Thắng - Nam Định', 'Nghĩa Trang Làng Sắc', 'Chủ Tịch Xã, Làm nông', 'Có 9 người con (7 trai, 2 gái).', '', '', '["g3_9"]', 'g2_5', 'g2_6'),
('g3_9', 'Trần Thị Thục', 'nu', 3, 1, '1927-01-01', '2001-07-12', 'Xóm 10 - Mỹ Thắng - Nam Định', 'Nghĩa Trang Làng Sắc', 'Làm nông', 'Có 9 người con (7 trái và 2 gái)', '', '', '["g3_8"]', NULL, NULL),
('member_1780547929998', 'Trần Công Tích', 'nam', 4, 1, NULL, NULL, 'Xóm 10 - Mỹ Thắng - Nam Định', 'Nghĩa Trang Làng Sắc', '', 'Mất vì tai nạn giao thông', '', '', '["member_1780548037082"]', 'g3_8', NULL),
('member_1780548037082', 'Trần Thị Tích', 'nu', 4, 0, NULL, NULL, 'Nam Định', '', 'Làm nông', 'Có 3 người con trai', '', 'Xóm 10 - Mỹ Tháng - Nam Định', '["member_1780547929998"]', 'g3_8', NULL),
('member_1780548129414', 'Trần Công Vượng', 'nam', 4, 0, NULL, NULL, 'Xóm 10 - Mỹ Thắng - Nam Định', '', '', 'Có 6 người con (2 gái và 4 trai)', '', '', '["member_1780548212043"]', 'g3_8', 'g3_9'),
('member_1780548212043', 'Trần Thị Yến', 'nu', 4, 0, NULL, NULL, 'Làng Bườn - Mỹ Thắng - Nam Định', '', 'Làm nông', 'Có 6 người con (2 gái và 4 trai)', '', '', '["member_1780548129414"]', 'g3_8', NULL),
('member_1780548301974', 'Trần Công Bàng', 'nam', 4, 0, NULL, NULL, 'Xóm 10 - Mỹ Tháng - Nam Định', '', 'Tự Do, Đóng Lu', 'Có 3 người con (1 trai và 2 gái)', '', 'Xóm 10 - Mỹ Tháng - Nam Định', '["member_1780548401183"]', 'g3_8', 'g3_9'),
('member_1780548401183', 'Trần Thị Vịnh', 'nu', 4, 0, NULL, NULL, 'Làng Kim - Mỹ Thắng', '', '', '', '', 'Xóm 10 - Mỹ Thắng - Nam Định', '["member_1780548301974"]', 'g3_8', NULL),
('member_1780548559939', 'Trần Thị Năm', 'nu', 4, 0, NULL, NULL, 'Xóm 10 - Mỹ Thắng - Nam Định', '', 'Kinh Doanh', 'Có 3 người con trai', '', 'Xóm 10 - Mỹ Thắng - Nam Định', '["member_1780548608164"]', 'g3_8', 'g3_9'),
('member_1780548608164', 'Trần Ngọc Lăng', 'nam', 4, 0, NULL, NULL, 'Xóm 10 - Mỹ Thắng - Nam Định', '', 'Kinh Doanh', 'Có 3 người con trai', '', 'Xóm 10 - Mỹ Thắng - Nam Định', '["member_1780548559939"]', 'g3_8', NULL),
('member_1780548670690', 'Trần Công Tư', 'nam', 4, 0, NULL, NULL, 'Xóm 10 - Mỹ Thắng - Nam Định', '', 'Tự Do', 'Có 3 người con (2 trai và 1 gái)', '', 'Xóm 10 - Mỹ Thắng - Nam Định', '["member_1780548707359"]', 'g3_8', 'g3_9'),
('member_1780548707359', 'Trần Thị Lý', 'nu', 4, 0, NULL, NULL, 'Xóm 10 - Mỹ Thắng - Nam Định', '', 'Tự Do', '', '', 'Xóm 10 - Mỹ Thắng - Nam Định', '["member_1780548670690"]', 'g3_8', NULL),
('member_1780548760613', 'Trần Công Chiến ', 'nam', 4, 0, NULL, NULL, 'Xóm 10 - Mỹ Thắng - Nam Định', '', 'Tự Do', 'Có 2 người con trai', '', 'Xóm 10 - Mỹ Thắng - Nam Định', '["member_1780548795726"]', 'g3_8', 'g3_9'),
('member_1780548795726', 'Trần Thị Hoa', 'nu', 4, 0, NULL, NULL, 'Xóm 10 - Mỹ Thắng - Nam Định', '', 'Tự Do', '', '', 'Xóm 10 - Mỹ Thắng - Nam Định', '["member_1780548760613"]', 'g3_8', NULL),
('member_1780548967813', 'Trần Công Huấn', 'nam', 4, 0, '1968-12-04', NULL, 'Xóm 10 - Mỹ Thắng - Nam Định', '', 'Kinh Doanh', 'Có 2 người con trai', '', 'Xóm 10 - Mỹ Thắng - Nam Định', '["member_1780549026325"]', 'g3_8', 'g3_9'),
('member_1780549026325', 'Trần Thị Huế', 'nu', 4, 0, NULL, NULL, 'Xóm 10 - Mỹ Thắng - Nam Định', '', 'Kinh Doanh', 'Có 2 người con trai', '', 'Xóm 10 - Mỹ Thắng - Nam Định', '["member_1780548967813"]', 'g3_8', NULL);
