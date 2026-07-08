# ============================================================
# FlowTodo — One-Click Update & Deploy Script
# Double-click this file OR run it in PowerShell to:
#   1. Push your latest code changes to GitHub (main branch)
#   2. Build the production app
#   3. Deploy the live site to GitHub Pages
# ============================================================

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Set-Location $ProjectDir

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  FlowTodo — Deploy to GitHub Pages  " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check for changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "📦 Changes detected. Committing..." -ForegroundColor Yellow
    git add .
    $commitMsg = Read-Host "Enter a commit message (or press Enter for 'update')"
    if (-not $commitMsg) { $commitMsg = "update" }
    git commit -m $commitMsg
    Write-Host "✅ Committed!" -ForegroundColor Green
} else {
    Write-Host "✅ No new changes to commit." -ForegroundColor Green
}

# Step 2: Push to GitHub main branch
Write-Host ""
Write-Host "🚀 Pushing code to GitHub..." -ForegroundColor Yellow
git push origin main
Write-Host "✅ Code pushed to GitHub!" -ForegroundColor Green

# Step 3: Build and deploy to GitHub Pages
Write-Host ""
Write-Host "🔨 Building and deploying to GitHub Pages..." -ForegroundColor Yellow
npm run deploy
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  ✅ DEPLOYED SUCCESSFULLY!           " -ForegroundColor Green
Write-Host "  🌐 https://vigneshwarans4444.github.io/To-Do-List2/" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to close"
