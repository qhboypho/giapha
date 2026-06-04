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
('private_mode', 'true');

-- 4. Insert Trần Công family members (Real data from diagram, 3 generations, 31 members)
INSERT INTO members (id, name, gender, generation, isDeceased, birthDate, deathDate, birthPlace, restingPlace, occupation, bio, phone, address, spouseIds, fatherId, motherId) VALUES
-- Generation 1 (Patriarch & Matriarch)
('g1_1', 'Trần Công Kỳ', 'nam', 1, 1, NULL, '1936-06-04', '', '', 'Thủy tổ chi ngành', 'Tạ thế ngày 4-6-1936. Có 5 người con (2 trai, 3 gái).', '', '', '["g1_2"]', NULL, NULL),
('g1_2', 'Trần Thị Hiền', 'nu', 1, 1, NULL, '1959-03-20', '', '', 'Matriarch', 'Tạ thế ngày 20-3-1959.', '', '', '["g1_1"]', NULL, NULL),

-- Generation 2 (Children of Gen 1)
('g2_1', 'Trần Thị Mùi', 'nu', 2, 1, NULL, NULL, '', '', '', 'Có 5 người con.', '', '', '["g2_2"]', 'g1_1', 'g1_2'),
('g2_2', 'Trần Sỹ Pha', 'nam', 2, 1, NULL, NULL, 'Làng Mai', '', '', 'Chồng cụ Trần Thị Mùi.', '', '', '["g2_1"]', NULL, NULL),

('g2_3', 'Trần Thị Sên', 'nu', 2, 1, NULL, NULL, '', '', '', 'Có 2 người con gái.', '', '', '["g2_4"]', 'g1_1', 'g1_2'),
('g2_4', 'Trần Đình Bảng', 'nam', 2, 1, NULL, NULL, 'Cùng làng', '', '', 'Chồng cụ Trần Thị Sên.', '', '', '["g2_3"]', NULL, NULL),

('g2_5', 'Trần Công Nghiêm', 'nam', 2, 1, NULL, '1980-02-02', '', '', '', 'Tạ thế ngày 2-2-1980. Có 3 con trai và 4 con gái.', '', '', '["g2_6"]', 'g1_1', 'g1_2'),
('g2_6', 'Trần Thị Viết', 'nu', 2, 1, NULL, NULL, '', '', '', 'Vợ cụ Trần Công Nghiêm.', '', '', '["g2_5"]', NULL, NULL),

('g2_7', 'Trần Thị Kỷ', 'nu', 2, 1, NULL, NULL, '', '', '', 'Có 6 người con (2 trai, 4 gái).', '', '', '["g2_8"]', 'g1_1', 'g1_2'),
('g2_8', 'Đặng Hữu Liên', 'nam', 2, 1, NULL, NULL, 'Làng Mỹ', '', '', 'Chồng cụ Trần Thị Kỷ.', '', '', '["g2_7"]', NULL, NULL),

('g2_9', 'Trần Công Kỷ', 'nam', 2, 1, NULL, NULL, '', '', '', 'Có 2 người con (1 trai, 1 gái).', '', '', '["g2_10"]', 'g1_1', 'g1_2'),
('g2_10', 'Nguyễn Thị Khoa', 'nu', 2, 1, NULL, NULL, '', '', '', 'Vợ cụ Trần Công Kỷ.', '', '', '["g2_9"]', NULL, NULL),

-- Generation 3 (Children of Trần Công Nghiêm)
('g3_1', 'Trần Thị Tý', 'nu', 3, 1, '1928-01-01', NULL, '', '', '', 'Sinh năm 1928. Có 3 trai và 1 gái.', '', '', '["g3_2"]', 'g2_5', 'g2_6'),
('g3_2', 'Trần Văn Tiềm', 'nam', 3, 1, NULL, NULL, '', '', '', 'Chồng bà Trần Thị Tý.', '', '', '["g3_1"]', NULL, NULL),

('g3_3', 'Trần Thị Vàng', 'nu', 3, 1, '1930-01-01', '1959-03-02', '', '', '', 'Sinh năm 1930. Tạ thế ngày 2-3-1959. Chưa chồng (Nhận 1 con gái).', '', '', '[]', 'g2_5', 'g2_6'),

('g3_4', 'Trần Thị Hường', 'nu', 3, 1, '1932-01-01', NULL, '', '', '', 'Sinh năm 1932. Có 4 người con (3 trai, 1 gái).', '', '', '["g3_5"]', 'g2_5', 'g2_6'),
('g3_5', 'Trần Văn Lễ', 'nam', 3, 1, NULL, NULL, '', '', '', 'Chồng bà Trần Thị Hường.', '', '', '["g3_4"]', NULL, NULL),

('g3_6', 'Trần Thị Oan', 'nu', 3, 1, '1935-01-01', NULL, '', '', '', 'Sinh năm 1935. Có 4 người con (3 trai, 1 gái).', '', '', '["g3_7"]', 'g2_5', 'g2_6'),
('g3_7', 'Trần Nhật Chước', 'nam', 3, 1, NULL, NULL, '', '', '', 'Chồng bà Trần Thị Oan.', '', '', '["g3_6"]', NULL, NULL),

('g3_8', 'Trần Công Huê', 'nam', 3, 1, '1938-01-01', '1992-05-21', '', '', '', 'Sinh năm 1938. Tạ thế ngày 21-5-1992. Có 3 người con (1 trai, 2 gái).', '', '', '["g3_9"]', 'g2_5', 'g2_6'),
('g3_9', 'Trần Thị Thức', 'nu', 3, 1, NULL, NULL, '', '', '', 'Vợ ông Trần Công Huê.', '', '', '["g3_8"]', NULL, NULL),

('g3_10', 'Trần Công Bảy', 'nam', 3, 1, '1941-01-01', NULL, '', '', '', 'Sinh năm 1941. Có 5 người con (3 trai, 2 gái).', '', '', '["g3_11"]', 'g2_5', 'g2_6'),
('g3_11', 'Trần Thị Thực', 'nu', 3, 1, NULL, NULL, '', '', '', 'Vợ ông Trần Công Bảy.', '', '', '["g3_10"]', NULL, NULL),

('g3_12', 'Trần Công Tám', 'nam', 3, 0, '1944-01-01', NULL, '', '', '', 'Sinh năm 1944. Có 3 người con (1 trai, 2 gái).', '', '', '["g3_13"]', 'g2_5', 'g2_6'),
('g3_13', 'Vợ Trần Công Tám', 'nu', 3, 0, NULL, NULL, '', '', '', 'Vợ ông Trần Công Tám.', '', '', '["g3_12"]', NULL, NULL),

-- Generation 3 (Children of Trần Công Kỷ)
('g3_14', 'Trần Thị Hoa', 'nu', 3, 1, '1932-01-01', NULL, '', '', '', 'Sinh năm 1932. Có 5 người con (4 trai, 1 gái).', '', '', '["g3_15"]', 'g2_9', 'g2_10'),
('g3_15', 'Trần Văn Tăng', 'nam', 3, 1, NULL, NULL, '', '', '', 'Chồng bà Trần Thị Hoa.', '', '', '["g3_14"]', NULL, NULL),

('g3_16', 'Trần Thị Xuân', 'nu', 3, 1, '1935-01-01', NULL, '', '', '', 'Sinh năm 1935. Có 3 người con (1 trai, 2 gái).', '', '', '["g3_17"]', 'g2_9', 'g2_10'),
('g3_17', 'Trần Văn Thắng', 'nam', 3, 1, NULL, NULL, '', '', '', 'Chồng bà Trần Thị Xuân.', '', '', '["g3_16"]', NULL, NULL),

('g3_18', 'Trần Công Mợi', 'nam', 3, 1, '1937-01-01', NULL, '', '', '', 'Sinh năm 1937. Có 8 người con (3 trai, 5 gái).', '', '', '["g3_19"]', 'g2_9', 'g2_10'),
('g3_19', 'Vợ Trần Công Mợi', 'nu', 3, 1, NULL, NULL, '', '', '', 'Vợ ông Trần Công Mợi.', '', '', '["g3_18"]', NULL, NULL);
