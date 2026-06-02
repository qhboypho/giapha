-- Migration 0002: Seed Initial Data

-- 1. Insert initial users
INSERT INTO users (username, password, role, fullName) VALUES
('admin', 'pbkdf2:831d51423ca7c9f63e35ffadc5e6a778:31bc8b0f51a53df1f077ae3b274d3b101dfcc690899791882ba4930b1e66d34f', 'admin', 'Quản trị viên'),
('editor', 'pbkdf2:e48d6c0711a74d434586885a3a5aaef8:7022bcc4828ef38f3911c6a6b445a69d4903a3217ac47a2b387fb64ee8312877', 'editor', 'Biên tập viên'),
('member', 'pbkdf2:e41bf6e79f74ab31893ec1d32e9984a7:224470f350a3d28e25cc1f193d06e81a800d25a881594d8b886d72446350df13', 'member', 'Thành viên Gia tộc');

-- 2. Insert initial settings
INSERT INTO settings (key, value) VALUES
('private_mode', 'true');

-- 3. Insert Trần Công family members (5 generations)
INSERT INTO members (id, name, gender, generation, isDeceased, birthDate, deathDate, birthPlace, restingPlace, occupation, bio, phone, address, spouseIds, fatherId, motherId) VALUES
-- Generation 1
('g1_1', 'Trần Công Gia', 'nam', 1, 1, '1910-03-15', '1995-10-12', 'Nam Định', 'Nghĩa trang dòng họ Trần Công, Vụ Bản, Nam Định', 'Nhà nho, Thầy thuốc đông y', 'Cụ tổ khai sinh ra chi ngành. Người có công lớn trong việc giữ gìn gia quy và truyền dạy nghề bốc thuốc cứu người.', '', '', '["g1_2"]', NULL, NULL),
('g1_2', 'Lê Thị Tổ', 'nu', 1, 1, '1915-05-20', '1998-04-05', 'Ninh Bình', 'Nghĩa trang dòng họ Trần Công, Vụ Bản, Nam Định', 'Làm nông, nội trợ', 'Cụ bà hiền hậu, tảo tần, một đời chăm lo chồng con và túc trực hỗ trợ cụ ông bốc thuốc.', '', '', '["g1_1"]', NULL, NULL),

-- Generation 2
('g2_1', 'Trần Công Trưởng', 'nam', 2, 1, '1935-08-10', '2018-12-25', 'Nam Định', 'Nghĩa trang quê nhà, Vụ Bản, Nam Định', 'Giáo viên cấp cấp 3 (đã nghỉ hưu)', 'Con cả cụ Gia, nguyên Hiệu trưởng Trường THPT Vụ Bản. Trọn cuộc đời cống hiến cho sự nghiệp giáo dục, rất nghiêm khắc nhưng giàu lòng vị tha.', '', '', '["g2_2"]', 'g1_1', 'g1_2'),
('g2_2', 'Trần Thị Trưởng', 'nu', 2, 1, '1940-11-12', '2022-09-18', 'Nam Định', 'Nghĩa trang quê nhà, Vụ Bản, Nam Định', 'Cán bộ hội phụ nữ huyện', 'Vợ cụ Trần Công Trưởng, người phụ nữ tần tảo, nuôi dạy các con thành tài trong giai đoạn chiến tranh khó khăn.', '', '', '["g2_1"]', NULL, NULL),
('g2_3', 'Trần Thị Thứ', 'nu', 2, 0, '1938-04-18', NULL, 'Nam Định', '', 'Làm nông (đã nghỉ)', 'Con thứ hai của cụ Gia. Hiện đang sinh sống cùng con trai cả tại Hà Nội. Tuy tuổi cao nhưng tinh thần vẫn rất minh mẫn, nhớ rõ lịch sử dòng họ.', '0912345xxx', 'Số 12 ngõ 45, Tây Hồ, Hà Nội', '["g2_4"]', 'g1_1', 'g1_2'),
('g2_4', 'Vũ Văn Thứ', 'nam', 2, 1, '1936-02-05', '2010-07-14', 'Hà Nam', 'Nghĩa trang Thanh Tước, Hà Nội', 'Sĩ quan Quân đội nhân dân Việt Nam', 'Chồng cụ Trần Thị Thứ. Từng tham gia kháng chiến chống Mỹ cứu nước, là thương binh hạng 2/4.', '', '', '["g2_3"]', NULL, NULL),
('g2_5', 'Trần Công Ba', 'nam', 2, 1, '1942-09-30', '2020-05-19', 'Nam Định', 'Công viên nghĩa trang Lạc Hồng Viên, Hòa Bình', 'Kỹ sư Cầu đường', 'Con trai út của cụ Gia. Tính tình vui vẻ, cởi mở, có đóng góp lớn trong việc xây dựng sửa sang nhà thờ họ.', '', '', '["g2_6"]', 'g1_1', 'g1_2'),
('g2_6', 'Phạm Thị Ba', 'nu', 2, 0, '1945-06-25', NULL, 'Thái Bình', '', 'Bác sĩ nhi khoa (đã nghỉ hưu)', 'Vợ cụ Trần Công Ba. Hiện đang sống tại Thành phố Nam Định. Vẫn thường xuyên khám bệnh miễn phí cho trẻ em nghèo quanh vùng.', '0909876xxx', '32 Trần Hưng Đạo, Tp. Nam Định', '["g2_5"]', NULL, NULL),

-- Generation 3
('g3_1', 'Trần Công Bình', 'nam', 3, 0, '1965-01-20', NULL, 'Nam Định', '', 'Trưởng họ / Doanh nhân', 'Con trưởng cụ Trần Công Trưởng, hiện là Trưởng họ Trần Công chi này. Đang quản lý một công ty xây dựng tại Hà Nội và Nam Định, là người kết nối các hoạt động của dòng họ.', '0913999xxx', 'Biệt thự 05, KĐT Linh Đàm, Hoàng Mai, Hà Nội', '["g3_2"]', 'g2_1', 'g2_2'),
('g3_2', 'Lê Thị Bình', 'nu', 3, 0, '1968-12-05', NULL, 'Thanh Hóa', '', 'Kế toán trưởng công ty xây dựng', 'Vợ ông Trần Công Bình. Tay hòm chìa khóa đắc lực, điều phối các quỹ khuyến học và quỹ hiếu hỷ của dòng tộc.', '0913123xxx', 'KĐT Linh Đàm, Hoàng Mai, Hà Nội', '["g3_1"]', NULL, NULL),
('g3_3', 'Trần Thị Mai', 'nu', 3, 0, '1968-05-14', NULL, 'Nam Định', '', 'Giảng viên Đại học Sư phạm Hà Nội', 'Con gái cụ Trần Công Trưởng. Luôn đi đầu trong các hoạt động khuyến học của chi họ.', '0988777xxx', 'Chung cư Mandarin Garden, Cầu Giấy, Hà Nội', '["g3_4"]', 'g2_1', 'g2_2'),
('g3_4', 'Phạm Văn Mai', 'nam', 3, 0, '1965-07-28', NULL, 'Hải Dương', '', 'Tiến sĩ Vật lý / Nghiên cứu viên', 'Chồng bà Trần Thị Mai. Đang làm việc tại Viện Hàn lâm Khoa học công nghệ Việt Nam.', '0988999xxx', 'Cầu Giấy, Hà Nội', '["g3_3"]', NULL, NULL),
('g3_5', 'Vũ Quốc Khánh', 'nam', 3, 0, '1962-09-10', NULL, 'Hà Nội', '', 'Kỹ sư CNTT', 'Con trai lớn cụ Trần Thị Thứ. Là người hỗ trợ tạo dựng và quản lý các công nghệ trực tuyến cho gia tộc.', '0903456xxx', 'Số 12 ngõ 45, Tây Hồ, Hà Nội', '["g3_6"]', 'g2_4', 'g2_3'),
('g3_6', 'Trần Thị Khánh', 'nu', 3, 0, '1965-04-12', NULL, 'Hải Phòng', '', 'Trưởng phòng Nhân sự Ngân hàng', 'Vợ ông Vũ Quốc Khánh. Chu đáo, nhiệt tình, thích tổ chức các buổi cắm trại, sum họp gia đình lớn.', '0903789xxx', 'Tây Hồ, Hà Nội', '["g3_5"]', NULL, NULL),
('g3_7', 'Trần Công Hùng', 'nam', 3, 0, '1970-10-15', NULL, 'Nam Định', '', 'Bác sĩ ngoại khoa', 'Con cả cụ Trần Công Ba. Hiện là Trưởng khoa Phẫu thuật chỉnh hình tại Bệnh viện đa khoa tỉnh Nam Định.', '0944555xxx', 'Phường Vị Hoàng, Tp. Nam Định', '["g3_8"]', 'g2_5', 'g2_6'),
('g3_8', 'Đỗ Thị Hùng', 'nu', 3, 0, '1973-11-20', NULL, 'Nam Định', '', 'Giáo viên mầm non', 'Vợ bác sĩ Hùng. Người mẹ hiền dịu, chăm sóc gia đình chu toàn và thích nấu các món ăn truyền thống Nam Định.', '0944666xxx', 'Phường Vị Hoàng, Tp. Nam Định', '["g3_7"]', NULL, NULL),
('g3_9', 'Trần Công Dũng', 'nam', 3, 0, '1974-03-05', NULL, 'Nam Định', '', 'Kiến trúc sư', 'Con trai út cụ Trần Công Ba. Thiết kế nhiều công trình biệt thự, nhà thờ họ và là người yêu nghệ thuật, nhiếp ảnh.', '0977888xxx', 'Vinhomes Central Park, Bình Thạnh, Tp. Hồ Chí Minh', '["g3_10"]', 'g2_5', 'g2_6'),
('g3_10', 'Hoàng Thị Dũng', 'nu', 3, 0, '1976-08-18', NULL, 'Bến Tre', '', 'Nhà báo', 'Vợ ông Trần Công Dũng. Làm việc tại đài truyền hình HTV, mang nét đằm thắm của con người Nam Bộ hòa hợp cùng văn hóa miền Bắc.', '0977999xxx', 'Bình Thạnh, Tp. Hồ Chí Minh', '["g3_9"]', NULL, NULL),

-- Generation 4
('g4_1', 'Trần Công An', 'nam', 4, 0, '1990-12-05', NULL, 'Hà Nội', '', 'Giám đốc Dự án Công nghệ', 'Con trai cả ông Trần Công Bình (Cháu đích tôn cụ Trưởng). Làm việc tại tập đoàn công nghệ lớn, năng nổ, chịu trách nhiệm số hóa gia phả dòng họ.', '0966111xxx', 'Khu đô thị Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '["g4_2"]', 'g3_1', 'g3_2'),
('g4_2', 'Trịnh Thị An', 'nu', 4, 0, '1993-02-14', NULL, 'Hà Nội', '', 'Chuyên viên phân tích tài chính', 'Vợ anh Trần Công An. Xinh đẹp, đảm đang, rất chăm chỉ tham gia các dịp giỗ tổ họ hàng.', '0966222xxx', 'Bắc Từ Liêm, Hà Nội', '["g4_1"]', NULL, NULL),
('g4_3', 'Trần Thị Chi', 'nu', 4, 0, '1995-07-22', NULL, 'Hà Nội', '', 'Nhà thiết kế thời trang', 'Con gái ông Trần Công Bình. Tốt nghiệp du học Pháp, hiện làm chủ một thương hiệu thời trang tại Hà Nội.', '0966333xxx', 'Phố cổ Hoàn Kiếm, Hà Nội', '["g4_4"]', 'g3_1', 'g3_2'),
('g4_4', 'Bùi Văn Chi', 'nam', 4, 0, '1992-05-18', NULL, 'Hải Phòng', '', 'Luật sư', 'Chồng chị Trần Thị Chi. Tư vấn pháp lý doanh nghiệp, năng nổ, thường hỗ trợ pháp lý và tài chính cho các hoạt động xã hội.', '0966444xxx', 'Hoàn Kiếm, Hà Nội', '["g4_3"]', NULL, NULL),
('g4_5', 'Trần Thị Lan', 'nu', 4, 0, '1998-10-30', NULL, 'Nam Định', '', 'Dược sĩ lâm sàng', 'Con gái ông Trần Công Hùng. Tiếp nối truyền thống y đức của dòng họ, tốt nghiệp loại Giỏi Đại học Y Dược.', '0944111xxx', 'Phường Vị Hoàng, Tp. Nam Định', '[]', 'g3_7', 'g3_8'),
('g4_6', 'Trần Công Nam', 'nam', 4, 0, '2002-04-15', NULL, 'Nam Định', '', 'Sinh viên Đại học Bách Khoa', 'Con trai thứ ông Trần Công Hùng. Đam mê robot, lập trình viên trẻ triển vọng.', '0944222xxx', 'Ký túc xá Đại học Bách Khoa, Hà Nội', '[]', 'g3_7', 'g3_8'),
('g4_7', 'Trần Công Hải', 'nam', 4, 0, '2005-09-08', NULL, 'Tp. Hồ Chí Minh', '', 'Học sinh THPT chuyên Lê Hồng Phong', 'Con trai duy nhất của ông Trần Công Dũng. Yêu thích hội họa giống bố, đạt giải cấp thành phố môn tiếng Anh.', '0977111xxx', 'Bình Thạnh, Tp. Hồ Chí Minh', '[]', 'g3_9', 'g3_10'),

-- Generation 5
('g5_1', 'Trần Công Minh', 'nam', 5, 0, '2018-09-28', NULL, 'Hà Nội', '', 'Học sinh tiểu học', 'Con cả anh Trần Công An. Cậu bé thông minh tinh nghịch, rất thích vẽ tranh và lắp ráp Lego.', '', '', '[]', 'g4_1', 'g4_2'),
('g5_2', 'Trần Ngọc Vy', 'nu', 5, 0, '2021-12-14', NULL, 'Hà Nội', '', 'Đi học mẫu giáo', 'Con gái nhỏ anh Trần Công An. Bé Vy lém lỉnh, thích ca hát và múa, là niềm vui lớn của cả gia đình.', '', '', '[]', 'g4_1', 'g4_2');
