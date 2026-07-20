# Auto-update email with timestamp
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$email = "testlead.$timestamp@testcompany.com"

# Use BACKEND_URL env var or fall back to Render
$baseUrl = if ($env:BACKEND_URL) { $env:BACKEND_URL } else { "https://boothflow-backend.onrender.com" }
Write-Host "Running tests against: $baseUrl"

# Export YAML collection to JSON first
node scripts/export-postman-collection.js

# Pre-fetch tokens
$repLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"rachel.ng@dell.com","password":"rep123"}'
$repToken = $repLogin.token

$managerLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"james.lim@dell.com","password":"manager123"}'
$managerToken = $managerLogin.token

$adminLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"sarah.tan@dell.com","password":"admin123"}'
$adminToken = $adminLogin.token

Write-Host "Rep token: $(if ($repToken) { 'OK' } else { 'FAILED' })"
Write-Host "Manager token: $(if ($managerToken) { 'OK' } else { 'FAILED' })"
Write-Host "Admin token: $(if ($adminToken) { 'OK' } else { 'FAILED' })"

# Run Postman tests
postman collection run "postman/collections/Dell Lead Management API.postman_collection.json" `
    --env-var "baseUrl=$baseUrl" `
    --env-var "repLoginEmail=rachel.ng@dell.com" `
    --env-var "repLoginPassword=rep123" `
    --env-var "managerEmail=james.lim@dell.com" `
    --env-var "managerPassword=manager123" `
    --env-var "adminEmail=sarah.tan@dell.com" `
    --env-var "adminPassword=admin123" `
    --env-var "repToken=$repToken" `
    --env-var "managerToken=$managerToken" `
    --env-var "adminToken=$adminToken" `
    --env-var "email=$email" `
    --reporters cli