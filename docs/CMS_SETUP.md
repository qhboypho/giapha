# Huong Dan Setup CMS Gia Pha Cho Khach Moi

Tai lieu nay mo ta quy trinh don gian nhat de clone base, tao website gia pha cho mot khach/dong ho moi, import du lieu CMS package va deploy len Cloudflare Pages.

## 1. Yeu Cau Chuan Bi

- Node.js 20+ va npm.
- Tai khoan Cloudflare co quyen tao Pages, D1, R2.
- Git.
- File CMS package `.json` cua khach, gom `siteConfig`, `members`, `historyEvents`.
- Quyen dang nhap Cloudflare Wrangler tren may:

```powershell
npx wrangler login
```

## Cach De Nhat: Provision Wizard

Neu muon cai dat de hon cho dev hoac nguoi khong chuyen ky thuat, chay wizard ben ngoai app:

```powershell
npm run provision:wizard
```

Wizard se hoi ten khach/project, sinh `wrangler.generated.jsonc`, `AI_CONFIG_SECRET`, checklist tao Cloudflare D1/R2/Pages va huong dan deploy trong thu muc `.provision/<slug>/`.

Sau khi deploy xong, admin vao app mo `Setup Wizard` de cau hinh noi dung website va nhap du lieu.

## 2. Clone Source

```powershell
git clone https://github.com/qhboypho/giapha.git giapha-khach-a
cd giapha-khach-a
npm install
```

Neu lam tu branch CMS:

```powershell
git checkout giapha-cms
git checkout -b customer/khach-a
```

## 3. Tao Tai Nguyen Cloudflare

Tao 3 tai nguyen rieng cho khach:

- Cloudflare Pages project, vi du `giapha-khach-a`.
- D1 database, vi du `giapha-khach-a-db`.
- R2 bucket, vi du `giapha-khach-a-media`.

Co the tao D1/R2 bang dashboard Cloudflare hoac Wrangler:

```powershell
npx wrangler d1 create giapha-khach-a-db
npx wrangler r2 bucket create giapha-khach-a-media
```

Nếu muốn quản trị viên nhập API key AI ngay trong app, cần đặt secret mã hóa một lần cho Pages project:

```powershell
npx wrangler pages secret put AI_CONFIG_SECRET --project-name giapha-khach-a
```

`AI_CONFIG_SECRET` nên là chuỗi ngẫu nhiên dài ít nhất 24 ký tự. Sau đó vào trang quản trị, mở `Cấu hình AI`, chọn OpenAI/Gemini/Claude, nhập API key provider và bấm lưu. Key provider sẽ được mã hóa trước khi lưu vào D1.

## 4. Cap Nhat `wrangler.jsonc`

Sua cac gia tri trong `wrangler.jsonc` theo tai nguyen cua khach:

```jsonc
{
  "name": "giapha-khach-a",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "giapha-khach-a-db",
      "database_id": "D1_DATABASE_ID_CUA_KHACH",
      "preview_database_id": "D1_DATABASE_ID_CUA_KHACH"
    }
  ],
  "r2_buckets": [
    {
      "binding": "MEDIA_BUCKET",
      "bucket_name": "giapha-khach-a-media",
      "preview_bucket_name": "giapha-khach-a-media-preview"
    }
  ]
}
```

## 5. Chuan Bi CMS Package

Dat file package cua khach vao thu muc rieng, vi du:

```text
data/khach-a-package.json
```

Package v1 hien gom:

- `siteConfig`: ten dong ho, logo, hero, footer.
- `members`: cay gia pha.
- `historyEvents`: lich su dong ho.

Luu y: CMS package v1 luu reference anh lich su. Binary anh R2 nam trong media package rieng.

## 6. Kiem Tra Package Bang Dry Run

Lenh nay chi validate va sinh SQL, chua ghi DB:

```powershell
node scripts/cms-bootstrap.mjs --package=./data/khach-a-package.json
```

Neu chay qua npm tren Windows/PowerShell:

```powershell
npm run cms:bootstrap -- -- --package=./data/khach-a-package.json
```

Ket qua mong doi:

- Bao `CMS package hop le`.
- Hien so thanh vien.
- Hien so cot moc lich su.
- Tao SQL tam tai `.wrangler/cms-bootstrap/import-package.sql`.

## 7. Import Local De Test

Chay migrations va import vao D1 local:

```powershell
node scripts/cms-bootstrap.mjs --package=./data/khach-a-package.json --migrate --admin-password="mat-khau-admin-local" --yes
```

Lenh nay se:

- Apply migrations vao D1 local.
- Import `siteConfig`, `members`, `historyEvents`.
- Tao/update tai khoan `admin` neu co `--admin-password`.
- Xoa session admin cu neu doi mat khau.

## 8. Chay App Local

```powershell
npm run build
npm run dev:cf
```

Mo:

```text
http://localhost:8788
```

Dang nhap:

- Username: `admin`
- Password: mat khau da truyen trong `--admin-password`

## 9. Kiem Tra Bang UI Quan Tri

Trong trang quan tri, kiem tra:

- Logo, ten dong ho, hero, footer.
- Cay gia pha.
- Danh sach thanh vien.
- Nguoi tieu bieu.
- Lich gio.
- Lich su dong ho.
- Mobile layout.

Trong `Tai khoan / Quan tri`, co cac khoi:

- `Cau hinh website/CMS`: sua text/logo/cau hinh site.
- `Goi CMS website`: export/import full package.
- `Goi media R2`: export/import anh lich su trong R2.
- `Nhap gia pha bang AI`: copy prompt, paste JSON AI tra ve va preview truoc khi nhap vao cay.
- `Dong bo cay gia pha`: export/import rieng members.

## 10. Import Len Production

Chi chay sau khi local da on:

```powershell
node scripts/cms-bootstrap.mjs --package=./data/khach-a-package.json --remote --migrate --admin-password="mat-khau-admin-prod" --yes
```

Can than:

- `--remote` ghi vao D1 tren Cloudflare.
- `--yes` moi thuc su ghi DB.
- Khong commit mat khau vao source.

## 11. Deploy Cloudflare Pages

```powershell
npm run build
npx wrangler pages deploy ./dist --project-name giapha-khach-a
```

Sau khi deploy:

- Vao Cloudflare Pages lay URL.
- Gan custom domain neu khach co ten mien.
- Kiem tra lai dang nhap admin va giao dien mobile.

## 12. Ban Giao Cho Khach

Ban giao toi thieu:

- URL website.
- Username admin.
- Mat khau tam thoi.
- Yeu cau doi mat khau sau khi nhan.
- Huong dan export backup CMS package trong quan tri.

## 13. Backup Va Restore

Trong UI quan tri:

- Bam `Xuat goi CMS` de backup full data text/config.
- Bam `Chon goi CMS` de preview file backup.
- Bam import de ghi de neu can restore.
- Bam `Xuat goi media` de backup anh lich su trong R2.
- Bam `Chon goi media` de preview/upload anh vao R2.

Script bootstrap cung dung cung dinh dang CMS package nen co the dung cho setup moi hoac restore DB.

## 14. Ghi Chu Ve Anh R2

CMS package v1 khong nhet binary anh truc tiep vao file data chinh. Anh R2 duoc dong goi bang media package rieng de file CMS nhe hon va de import theo thu tu:

1. Import CMS package de tao config, members, historyEvents.
2. Import media package de upload anh vao R2 theo dung key ma historyEvents dang tham chieu.
