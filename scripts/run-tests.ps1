# Auto-update email with timestamp
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$email = "testlead.$timestamp@testcompany.com"

# Update environment file
$env = Get-Content "postman/environments/FYP Local.environment.yaml" -Raw
$env = $env -replace 'value: ''testlead.*@testcompany.com''', "value: '$email'"
$env | Set-Content "postman/environments/FYP Local.environment.yaml"

# Run collection
postman collection run "postman/collections/Dell Lead Management API" -e "postman/environments/FYP Local.environment.yaml"
