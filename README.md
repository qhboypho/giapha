# Gia Pha TC CMS

Gia Pha TC CMS la base website gia pha truc tuyen dung React, Cloudflare Pages, Hono, D1 va R2. Project co the dung cho mot dong ho rieng hoac clone ra nhieu site khach khac nhau bang CMS package.

## Tinh Nang Chinh

- Cay gia pha truc quan.
- Danh sach thanh vien, ho so chi tiet, them/sua/xoa theo quyen.
- Ngay gio, nguoi tieu bieu, lich su dong ho.
- Tai khoan admin/editor/member.
- Che do rieng tu.
- Cau hinh website/CMS dynamic: ten dong ho, logo, hero, footer.
- Export/import CMS package gom `siteConfig`, `members`, `historyEvents`.
- Script bootstrap de setup nhanh khach moi.

## Tech Stack

- React + Vite.
- Hono tren Cloudflare Pages Functions.
- Cloudflare D1 cho database.
- Cloudflare R2 cho anh lich su.
- Wrangler CLI.

## Yeu Cau

- Node.js 20+.
- npm.
- Git.
- Tai khoan Cloudflare neu muon dung D1/R2/Pages.

## Cai Dat Local

```powershell
git clone https://github.com/qhboypho/giapha.git giapha-tc
cd giapha-tc
npm install
```

Chay frontend Vite:

```powershell
npm run dev
```

Chay Cloudflare Pages local, co D1/R2 binding:

```powershell
npm run build
npm run dev:cf
```

Mac dinh app Pages local chay tai:

```text
http://localhost:8788
```

## Database Local

Apply migrations:

```powershell
npm run db:migrate:local
```

Seed data mau:

```powershell
npm run db:seed
```

Tai khoan seed mac dinh:

- `admin / admin123`
- `editor / editor123`
- `member / member123`

Nen doi mat khau admin sau khi setup that.

## Cau Hinh Cloudflare

Sua `wrangler.jsonc` theo tai nguyen cua moi site:

- `name`: ten project.
- `d1_databases[0].database_name`.
- `d1_databases[0].database_id`.
- `r2_buckets[0].bucket_name`.
- `r2_buckets[0].preview_bucket_name`.

Tao D1/R2 bang Wrangler:

```powershell
npx wrangler login
npx wrangler d1 create giapha-khach-a-db
npx wrangler r2 bucket create giapha-khach-a-media
```

## Setup Khach Moi Bang CMS Package

Quy trinh day du nam trong:

- [docs/CMS_SETUP.md](docs/CMS_SETUP.md)
- Trang trong app: `/cms-setup-guide.html`

Tom tat nhanh:

1. Clone source.
2. Tao Cloudflare Pages/D1/R2 rieng cho khach.
3. Sua `wrangler.jsonc`.
4. Dat file CMS package vao `data/khach-a-package.json`.
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

8. Import remote khi da test xong:

```powershell
node scripts/cms-bootstrap.mjs --package=./data/khach-a-package.json --remote --migrate --admin-password="mat-khau-admin-prod" --yes
```

9. Deploy Pages:

```powershell
npm run build
npx wrangler pages deploy ./dist --project-name giapha-khach-a
```

Neu chay bootstrap qua npm tren Windows/PowerShell, dung double separator:

```powershell
npm run cms:bootstrap -- -- --package=./data/khach-a-package.json --migrate --yes
```

## CMS Package

CMS package v1 la file JSON gom:

- `siteConfig`: cau hinh ten dong ho, logo, hero, footer.
- `members`: thanh vien cay gia pha.
- `historyEvents`: cot moc lich su dong ho.

Trong UI quan tri:

- `Cau hinh website/CMS`: sua cau hinh site.
- `Goi CMS website`: export/import full package.
- `Dong bo cay gia pha`: export/import rieng members.

Luu y: CMS package v1 chua dong goi binary anh R2. Anh lich su can upload qua UI hoac xu ly media package rieng o giai doan sau.

## Lenh Kiem Tra

```powershell
node scripts/test-cms-bootstrap.mjs
node scripts/test-cms-package-utils.mjs
node scripts/test-site-config-utils.mjs
node scripts/test-member-sync-utils.mjs
npm run lint
npm run build
```

## Deploy Production

Build:

```powershell
npm run build
```

Deploy len Cloudflare Pages:

```powershell
npx wrangler pages deploy ./dist --project-name <pages-project-name>
```

Apply migrations remote neu can:

```powershell
npx wrangler d1 migrations apply <database-name> --remote
```

## Bao Mat

- Khong commit mat khau, token, secret vao repo.
- Khong commit file package khach neu chua duoc phep.
- Doi mat khau admin sau khi ban giao.
- Backup CMS package truoc khi import ghi de.
