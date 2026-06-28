# Auto-update email with timestamp
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$email = "testlead.$timestamp@testcompany.com"

# Login and get fresh token automatically
$loginResponse = Invoke-RestMethod -Uri "$env:BACKEND_URL/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"sarah.tan@dell.com","password":"admin123"}'

$token = $loginResponse.token

Write-Host "✅ Logged in, token received"

# Run Postman tests with fresh token
postman collection run "postman/collections/Dell Lead Management API" `
    --env-var "baseUrl=$env:BACKEND_URL" `
    --env-var "token=$token" `
    --env-var "email=$email" `
    --reporters cli