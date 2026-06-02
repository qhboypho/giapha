# Get current git branch
$branch = (git rev-parse --abbrev-ref HEAD).Trim()

if ($branch -ne "master-tc") {
    Write-Host "Error: You must be on the 'master-tc' branch to deploy. Current branch is: $branch" -ForegroundColor Red
    exit 1
}

Write-Host "Building frontend..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying to Cloudflare Pages..." -ForegroundColor Green
npx wrangler pages deploy dist --project-name giapha-tc --branch master-tc
if ($LASTEXITCODE -ne 0) {
    Write-Host "Cloudflare deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing code to GitHub origin master-tc..." -ForegroundColor Green
git push origin master-tc
if ($LASTEXITCODE -ne 0) {
    Write-Host "Git push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment and Push completed successfully!" -ForegroundColor Green
