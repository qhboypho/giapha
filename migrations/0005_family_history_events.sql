-- Migration 0005: Editable family history milestones

CREATE TABLE IF NOT EXISTS family_history_events (
  id TEXT PRIMARY KEY,
  eventDate TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  relatedBranch TEXT,
  relatedMemberIds TEXT,
  isHomepageVisible INTEGER NOT NULL DEFAULT 1,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO family_history_events (
  id, eventDate, title, description, relatedBranch, relatedMemberIds, isHomepageVisible, sortOrder
) VALUES
('history_1936_founder', '1936', 'Thủy tổ Trần Công Kỳ tạ thế', 'Thủy tổ Trần Công Kỳ tạ thế, gia tộc tiếp nối giữ gìn nề nếp gia quy.', '', '["g1_1"]', 1, 10),
('history_1959_branches', '1959', 'Các chi họ hình thành', 'Cụ bà Trần Thị Hiến tạ thế, các chi họ lớn dần hình thành phát triển.', '', '["g1_2"]', 1, 20),
('history_1980_spread', '1980', 'Dòng họ lan tỏa', 'Cụ Trần Công Nghiêm tạ thế, dòng họ lan tỏa đến nhiều vùng miền.', '', '[]', 1, 30),
('history_1992_legacy', '1992', 'Giữ vững truyền thống', 'Cụ Trần Công Huê tạ thế, các thế hệ sau giữ vững truyền thống.', '', '[]', 1, 40);
