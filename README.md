# Gia Phả TC CMS

Gia Phả TC CMS là base website gia phả trực tuyến dùng React, Cloudflare Pages, Hono, D1 và R2. Project có thể dùng cho một dòng họ riêng hoặc clone ra nhiều site khách khác nhau bằng CMS package.

## Tính Năng Chính

- Cây gia phả trực quan.
- Danh sách thành viên, hồ sơ chi tiết, thêm/sửa/xóa theo quyền.
- Ngày giỗ, người tiêu biểu, lịch sử dòng họ.
- Tài khoản admin/editor/member.
- Chế độ riêng tư.
- Cấu hình website/CMS dynamic: tên dòng họ, logo, hero, footer.
- Export/import CMS package gồm `siteConfig`, `members`, `historyEvents`.
- Export/import media package cho ảnh lịch sử trong R2.
- AI-assisted import v2: tải ảnh/PDF, gọi OpenAI để tạo JSON, preview rồi nhập vào cây; vẫn hỗ trợ copy prompt/paste JSON thủ công.
- Setup Wizard trong app cho admin/non-tech cấu hình website, AI và nhập dữ liệu theo từng bước.
- Create Customer script để tạo folder project mới từ base hiện tại.
- Provision Wizard ngoài app để sinh lệnh/cấu hình Cloudflare cho khách mới.
- Script bootstrap để setup nhanh khách mới.

## Tech Stack

- React + Vite.
- Hono trên Cloudflare Pages Functions.
- Cloudflare D1 cho database.
- Cloudflare R2 cho ảnh lịch sử.
- Wrangler CLI.

## Yêu Cầu

- Node.js 20+.
- npm.
- Git.
- Tài khoản Cloudflare nếu muốn dùng D1/R2/Pages.

## Cài Đặt Local

```powershell
git clone https://github.com/qhboypho/giapha.git giapha-tc
cd giapha-tc
npm install
```

Chạy frontend Vite:

```powershell
npm run dev
```

Chạy Cloudflare Pages local, có D1/R2 binding:

```powershell
npm run build
npm run dev:cf
```

Mặc định app Pages local chạy tại:

```text
http://localhost:8788
```

## Database Local

Apply migrations:

```powershell
npm run db:migrate:local
```

Seed data mẫu:

```powershell
npm run db:seed
```

Tài khoản seed mặc định:

- `admin / admin123`
- `editor / editor123`
- `member / member123`

Nên đổi mật khẩu admin sau khi setup thật.

## Cấu Hình Cloudflare

Sửa `wrangler.jsonc` theo tài nguyên của mỗi site:

- `name`: tên project.
- `d1_databases[0].database_name`.
- `d1_databases[0].database_id`.
- `r2_buckets[0].bucket_name`.
- `r2_buckets[0].preview_bucket_name`.

Tạo D1/R2 bằng Wrangler:

```powershell
npx wrangler login
npx wrangler d1 create giapha-khach-a-db
npx wrangler r2 bucket create giapha-khach-a-media
```

Nếu dùng chức năng AI nhận diện gia phả từ ảnh/PDF, cấu hình secret mã hóa cho Pages project:

```powershell
npx wrangler pages secret put AI_CONFIG_SECRET --project-name giapha-khach-a
```

`AI_CONFIG_SECRET` nên là chuỗi ngẫu nhiên dài ít nhất 24 ký tự. Sau khi có secret này, quản trị viên có thể vào `Cấu hình AI` trong app để chọn OpenAI/Gemini/Claude, nhập API key provider và lưu mã hóa trong D1. Nếu muốn dùng fallback cũ cho OpenAI, vẫn có thể set thêm `OPENAI_API_KEY`.

## Provision Wizard Cho Khách Mới

### Cách nhanh nhất: One-command setup

Đứng ở repo base rồi chạy một lệnh để tạo project khách, tạo Cloudflare D1/R2, migrate DB, tạo admin và deploy Pages:

```powershell
cd C:\Users\DinhTungPC\.gemini\antigravity\scratch\giapha-tc
npm run customer:setup -- --family-name="Trần Xuân" --slug=tran-xuan --admin-password="TranXuan@2026" --deploy
```

Nếu folder local khách đã tồn tại và muốn test lại từ đầu, thêm `--force`:

```powershell
npm run customer:setup -- --family-name="Trần Xuân" --slug=tran-xuan --admin-password="TranXuan@2026" --deploy --force
```

Kết quả script sẽ in ra folder project, D1/R2, URL Pages và tài khoản `admin`. GitHub repo riêng là bước optional, làm sau khi site đã chạy ổn.

Mặc định project khách mới vẫn giữ `Setup Wizard` để khách hoặc admin không chuyên kỹ thuật tự đổi logo, màu sắc, nội dung, quyền riêng tư, AI và import dữ liệu ngay trong app. Nếu mày đã cấu hình xong hết và muốn bàn giao bản vận hành gọn, thêm `--handoff-ready` hoặc `--no-setup-wizard` để ẩn wizard:

```powershell
npm run customer:setup -- --family-name="Trần Xuân" --slug=tran-xuan --admin-password="TranXuan@2026" --deploy --force --handoff-ready
```

Nếu đang đứng ở repo base và muốn tạo hẳn một folder project mới cho khách:

```powershell
npm run create-customer -- --family-name "Trần Xuân" --slug tran-xuan
```

Lệnh này tạo folder mặc định:

```text
../giapha-tran-xuan
```

Sau đó tự chạy Provision Wizard trong folder mới để sinh `.provision/tran-xuan/PROVISION_GUIDE.md`. Mặc định script không chạy `npm install` và không ghi đè `wrangler.jsonc`; nếu muốn làm luôn:

```powershell
npm run create-customer -- --family-name "Trần Xuân" --slug tran-xuan --install --write-wrangler
```

Nếu muốn tạo luôn git repo local, branch khách và initial commit:

```powershell
npm run create-customer -- --family-name "Trần Xuân" --slug tran-xuan --git-init
```

Nếu muốn clone ra bản đã sẵn sàng bàn giao và ẩn `Setup Wizard`:

```powershell
npm run create-customer -- --family-name "Trần Xuân" --slug tran-xuan --handoff-ready
```

Script chỉ tạo git local, chưa tạo GitHub remote. Khi muốn push, thêm remote thủ công rồi push branch khách.

Dùng khi muốn có quy trình dễ hơn cho dev hoặc người không chuyên kỹ thuật. Wizard sẽ hỏi tên khách/project, sinh `wrangler.generated.jsonc`, secret AI, checklist Cloudflare và hướng dẫn deploy trong thư mục `.provision/<slug>/`.

### Quy trình mẫu: Họ Trần Xuân

Trước khi chạy `git:publish-customer`, cần hoàn tất 4 bước này:

1. Tạo project local cho khách bằng `create-customer`.
2. Vào đúng folder project khách.
3. Tạo repo GitHub mới riêng, ví dụ `qhboypho/giapha-tran-xuan`.
4. Tạo D1/R2 trên Cloudflare và sửa `wrangler.jsonc`, thay cả `database_id` và `preview_database_id` bằng UUID D1 thật.

Chạy từ repo base:

```powershell
npm run create-customer -- --family-name="Trần Xuân" --slug=tran-xuan --git-init --write-wrangler --install --force --commit-message="chore: init Tran Xuan site"
```

Vào project mới:

```powershell
cd ..\giapha-tran-xuan
```

Tạo D1/R2:

```powershell
npx wrangler d1 create giapha-tran-xuan-db
npx wrangler r2 bucket create giapha-tran-xuan-media
npx wrangler r2 bucket create giapha-tran-xuan-media-preview
```

Tạo repo GitHub mới riêng trên GitHub, ví dụ:

```text
https://github.com/qhboypho/giapha-tran-xuan.git
```

Copy `database_id` của `giapha-tran-xuan-db` vào `wrangler.jsonc` ở cả 2 dòng:

```json
"database_id": "PASTE_D1_DATABASE_ID_HERE",
"preview_database_id": "PASTE_D1_DATABASE_ID_HERE"
```

Sau khi sửa, ví dụ:

```json
"database_id": "370c2d40-99fe-4124-aa8f-d87e236203f1",
"preview_database_id": "370c2d40-99fe-4124-aa8f-d87e236203f1"
```

Nếu cần xem lại UUID:

```powershell
npx wrangler d1 list
```

Sau khi `wrangler.jsonc` đã đúng và đã tạo repo GitHub riêng, ví dụ `https://github.com/qhboypho/giapha-tran-xuan.git`, dùng script để commit/push. Nếu máy chưa cấu hình tên/email Git, truyền luôn `--user-name` và `--user-email`:

```powershell
npm run git:publish-customer -- --remote-url=https://github.com/qhboypho/giapha-tran-xuan.git --branch=customer/tran-xuan --user-name="Dinh Tung" --user-email="you@example.com" --commit-message="chore: configure Tran Xuan Cloudflare resources"
```

Nếu muốn cấu hình Git thủ công:

```powershell
git config --local user.name "Dinh Tung"
git config --local user.email "you@example.com"
git add wrangler.jsonc .provision\tran-xuan\PROVISION_GUIDE.md .provision\tran-xuan\provision-summary.json
git commit -m "chore: configure Tran Xuan Cloudflare resources"
git remote add origin https://github.com/qhboypho/giapha-tran-xuan.git
git push -u origin customer/tran-xuan
```

Nếu `origin` đã tồn tại thì dùng:

```powershell
git remote set-url origin https://github.com/qhboypho/giapha-tran-xuan.git
git push -u origin customer/tran-xuan
```

Apply migrations:

```powershell
npx wrangler d1 migrations apply giapha-tran-xuan-db --local
npx wrangler d1 migrations apply giapha-tran-xuan-db --remote
```

Tạo hoặc cập nhật admin trước khi chạy/deploy để vào trang là đăng nhập được luôn:

```powershell
$env:ADMIN_BOOTSTRAP_PASSWORD="mat-khau-admin-local"
node scripts/admin-bootstrap.mjs --db=giapha-tran-xuan-db --local --migrate --yes
$env:ADMIN_BOOTSTRAP_PASSWORD="mat-khau-admin-prod"
node scripts/admin-bootstrap.mjs --db=giapha-tran-xuan-db --remote --migrate --yes
Remove-Item Env:ADMIN_BOOTSTRAP_PASSWORD
```

Lệnh này hash mật khẩu đúng chuẩn, ghi user `admin` vào D1 và xóa session cũ nếu có. Khi bàn giao khách, đổi mật khẩu admin trong app hoặc chạy lại lệnh remote với mật khẩu mới.

Deploy lần đầu để tạo Pages project:

```powershell
npm run build
npx wrangler pages deploy ./dist --project-name giapha-tran-xuan
```

Set secret AI sau khi Pages project đã tồn tại:

```powershell
npx wrangler pages secret put AI_CONFIG_SECRET --project-name giapha-tran-xuan
```

Copy secret từ:

```text
.provision\tran-xuan\AI_CONFIG_SECRET.txt
```

Deploy lại để Pages Function nhận secret:

```powershell
npm run build
npx wrangler pages deploy ./dist --project-name giapha-tran-xuan
```

Kết quả mẫu:

```text
https://giapha-tran-xuan.pages.dev/
```

Chạy tương tác:

```powershell
npm run provision:wizard
```

Chạy nhanh bằng tham số:

```powershell
npm run provision:wizard -- --family-name "Trần Công" --slug tran-cong
```

Mặc định wizard **không ghi đè** `wrangler.jsonc`. Nếu dev muốn áp dụng luôn cấu hình sinh ra:

```powershell
npm run provision:wizard -- --family-name "Trần Công" --slug tran-cong --write-wrangler
```

Sau khi deploy xong, admin vào app dùng `Setup Wizard` để cấu hình nội dung website và nhập dữ liệu.

Với dự án khách tự setup, cứ giữ `Setup Wizard`. Với dự án mày đã cấu hình xong trước khi bàn giao, chạy lại setup/create với `--handoff-ready` hoặc chỉnh `src/config/cmsRuntime.js` thành `ENABLE_SETUP_WIZARD = false`.

## Setup Khách Mới Bằng CMS Package

Quy trình đầy đủ nằm trong:

- [docs/CMS_SETUP.md](docs/CMS_SETUP.md)
- Trang trong app: `/cms-setup-guide.html`

Tóm tắt nhanh:

1. Clone source.
2. Tạo Cloudflare Pages/D1/R2 riêng cho khách.
3. Sửa `wrangler.jsonc`.
4. Đặt file CMS package vào `data/khach-a-package.json`.
5. Dry-run package:

```powershell
node scripts/cms-bootstrap.mjs --package=./data/khach-a-package.json
```

6. Import local:

```powershell
node scripts/cms-bootstrap.mjs --package=./data/khach-a-package.json --migrate --admin-password="mat-khau-admin-local" --yes
```

7. Test local:

```powershell
npm run build
npm run dev:cf
```

8. Import remote khi đã test xong:

```powershell
node scripts/cms-bootstrap.mjs --package=./data/khach-a-package.json --remote --migrate --admin-password="mat-khau-admin-prod" --yes
```

9. Deploy Pages:

```powershell
npm run build
npx wrangler pages deploy ./dist --project-name giapha-khach-a
```

Nếu chạy bootstrap qua npm trên Windows/PowerShell, dùng double separator:

```powershell
npm run cms:bootstrap -- -- --package=./data/khach-a-package.json --migrate --yes
```

10. Nếu có ảnh lịch sử, vào UI quản trị của site gốc để `Xuất gói media`, sau đó vào site khách mới để `Chọn gói media` và upload vào R2.

## CMS Package

CMS package v1 là file JSON gồm:

- `siteConfig`: cấu hình tên dòng họ, logo, hero, footer.
- `members`: thành viên cây gia phả.
- `historyEvents`: cột mốc lịch sử dòng họ.

Trong UI quản trị:

- `Cấu hình website/CMS`: sửa cấu hình site.
- `Setup Wizard`: luồng cài đặt nhanh từng bước cho admin không cần đọc README.
- `Cấu hình AI`: chọn OpenAI/Gemini/Claude, lưu API key đã mã hóa, kiểm tra kết nối.
- `Gói CMS website`: export/import full package.
- `Gói media R2`: export/import ảnh lịch sử đang lưu trong R2.
- `Nhập gia phả bằng AI`: tải ảnh/PDF để AI tự nhận diện thành JSON, hoặc copy prompt/paste JSON thủ công, rồi preview trước khi nhập.
- `Đồng bộ cây gia phả`: export/import riêng members.

Lưu ý: CMS package v1 chứa reference ảnh. Binary ảnh nằm trong media package riêng để dễ backup/restore R2.

## Lệnh Kiểm Tra

```powershell
node scripts/test-admin-bootstrap.mjs
node scripts/test-cms-bootstrap.mjs
node scripts/test-cms-package-utils.mjs
node scripts/test-media-package-utils.mjs
node scripts/test-site-config-utils.mjs
node scripts/test-member-sync-utils.mjs
npm run test:ai-config
node scripts/test-customer-setup.mjs
node scripts/test-provision-wizard.mjs
node scripts/test-create-customer-project.mjs
node scripts/test-customer-git-publish.mjs
npm run lint
npm run build
```

## Deploy Production

Build:

```powershell
npm run build
```

Deploy lên Cloudflare Pages:

```powershell
npx wrangler pages deploy ./dist --project-name <pages-project-name>
```

Apply migrations remote nếu cần:

```powershell
npx wrangler d1 migrations apply <database-name> --remote
```

## Bảo Mật

- Không commit mật khẩu, token, secret vào repo.
- Không commit file package khách nếu chưa được phép.
- Đổi mật khẩu admin sau khi bàn giao.
- Backup CMS package trước khi import ghi đè.
