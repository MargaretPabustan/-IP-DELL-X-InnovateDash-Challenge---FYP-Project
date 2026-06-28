# Auto-update email with timestamp
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$email = "testlead.$timestamp@testcompany.com"

# Run Postman tests passing all credentials as env vars
postman collection run "postman/collections/Dell Lead Management API" `
    --env-var "baseUrl=$env:BACKEND_URL" `
    --env-var "repLoginEmail=rachel.ng@dell.com" `
    --env-var "repLoginPassword=rep123" `
    --env-var "managerEmail=james.lim@dell.com" `
    --env-var "managerPassword=manager123" `
    --env-var "adminEmail=sarah.tan@dell.com" `
    --env-var "adminPassword=admin123" `
    --env-var "email=$email" `
    --reporters cli