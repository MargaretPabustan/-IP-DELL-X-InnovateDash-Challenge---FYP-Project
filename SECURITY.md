# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability in Boothflow, please do **not** open a public GitHub issue.

Instead, contact the development team directly via email. We will respond within 48 hours and work to resolve the issue promptly.

## Security Measures

### Authentication & Authorisation
- **JWT (JSON Web Tokens)** — stateless authentication with 8-hour expiry
- **Role-Based Access Control (RBAC)** — three roles: `rep`, `manager`, `admin` with strict route-level enforcement
- **bcrypt** — all passwords hashed with salt factor of 10 before storage
- **Expo SecureStore** — JWT tokens stored in device's secure keychain (iOS Keychain / Android Keystore), never in AsyncStorage

### API Security
- **Rate Limiting** — general routes: 100 requests/15 min per IP; auth routes: 20 requests/15 min per IP
- **Helmet.js** — sets secure HTTP headers to prevent common web vulnerabilities
- **Parameterised Queries** — all database queries use parameterised inputs to prevent SQL injection
- **CORS** — restricted to allowed origins only

### Infrastructure Security
- **Environment Variables** — all secrets (API keys, DB credentials, JWT secret) stored in `.env` and GitHub Secrets, never hardcoded
- **Docker** — backend runs as non-root user (`runAsUser: 1000`) with dropped Linux capabilities
- **Kubernetes Security Context** — `allowPrivilegeEscalation: false`, `readOnlyRootFilesystem`, capabilities dropped
- **Kubernetes Secrets** — sensitive env vars injected via `secretKeyRef`, not hardcoded in manifests
- **Resource Limits** — CPU and memory limits set on all K8s pods to prevent resource exhaustion

### Data Privacy (PDPA)
- Booth reps can only edit `customer_intent` and `additional_notes` — personal details (name, email, phone) are read-only after capture
- Email and phone number masked in rep view
- All data stored in Supabase with SSL-encrypted connections

### Frontend Security
- **Session Timeout** — auto logout on app inactivity via `AppState`
- **Secure Token Storage** — JWT never exposed to JavaScript memory directly

### CI/CD Security
- GitHub Actions secrets used for all sensitive values
- Docker images pushed to GHCR as a private container with authentication
- No credentials hardcoded in workflow files