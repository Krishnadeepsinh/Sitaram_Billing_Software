# 🔐 Security-First Vibe Coding Rules — Ultimate Complete Edition
> The most comprehensive, production-grade security ruleset for AI agents, developers, and any project — frontend, backend, fullstack, mobile, infrastructure, and beyond.

---

## 📋 Table of Contents

1. [What This Document Is](#what-this-document-is)
2. [How to Tell an AI Agent About This](#how-to-tell-an-ai-agent-about-this)
3. [Core Security Philosophy](#core-security-philosophy)
4. [Rule 1 — Never Hardcode Secrets](#rule-1--never-hardcode-secrets)
5. [Rule 2 — Input Validation & Sanitization](#rule-2--input-validation--sanitization)
6. [Rule 3 — Authentication & Authorization](#rule-3--authentication--authorization)
7. [Rule 4 — Secure API Design](#rule-4--secure-api-design)
8. [Rule 5 — SQL & Database Security](#rule-5--sql--database-security)
9. [Rule 6 — Dependency & Supply Chain Security](#rule-6--dependency--supply-chain-security)
10. [Rule 7 — Secure File Handling](#rule-7--secure-file-handling)
11. [Rule 8 — Frontend Security (XSS, CSRF, CSP)](#rule-8--frontend-security-xss-csrf-csp)
12. [Rule 9 — Logging & Error Handling](#rule-9--logging--error-handling)
13. [Rule 10 — Encryption & Data Protection](#rule-10--encryption--data-protection)
14. [Rule 11 — Infrastructure & DevOps Security](#rule-11--infrastructure--devops-security)
15. [Rule 12 — Rate Limiting & DDoS Protection](#rule-12--rate-limiting--ddos-protection)
16. [Rule 13 — AI/LLM-Specific Security](#rule-13--aillm-specific-security)
17. [Rule 14 — Session Management](#rule-14--session-management)
18. [Rule 15 — Business Logic Security](#rule-15--business-logic-security)
19. [Rule 16 — Clickjacking & UI Redressing](#rule-16--clickjacking--ui-redressing)
20. [Rule 17 — Subdomain & DNS Security](#rule-17--subdomain--dns-security)
21. [Rule 18 — Memory & Buffer Safety](#rule-18--memory--buffer-safety)
22. [Rule 19 — Timing Attack Prevention](#rule-19--timing-attack-prevention)
23. [Rule 20 — Open Redirect Prevention](#rule-20--open-redirect-prevention)
24. [Rule 21 — Server-Side Request Forgery (SSRF)](#rule-21--server-side-request-forgery-ssrf)
25. [Rule 22 — XML & XXE Injection](#rule-22--xml--xxe-injection)
26. [Rule 23 — Command Injection](#rule-23--command-injection)
27. [Rule 24 — Path Traversal](#rule-24--path-traversal)
28. [Rule 25 — Insecure Deserialization](#rule-25--insecure-deserialization)
29. [Rule 26 — Cryptographic Failures](#rule-26--cryptographic-failures)
30. [Rule 27 — Security Misconfiguration](#rule-27--security-misconfiguration)
31. [Rule 28 — Mobile Security](#rule-28--mobile-security)
32. [Rule 29 — WebSocket Security](#rule-29--websocket-security)
33. [Rule 30 — Third-Party & OAuth Security](#rule-30--third-party--oauth-security)
34. [Rule 31 — Email Security](#rule-31--email-security)
35. [Rule 32 — Privacy & GDPR Compliance](#rule-32--privacy--gdpr-compliance)
36. [Rule 33 — Monitoring, Alerting & Incident Response](#rule-33--monitoring-alerting--incident-response)
37. [Rule 34 — GraphQL Security](#rule-34--graphql-security)
38. [Rule 35 — Prototype Pollution (JS)](#rule-35--prototype-pollution-js)
39. [Rule 36 — ReDoS (Regex Denial of Service)](#rule-36--redos-regex-denial-of-service)
40. [Rule 37 — Cache Poisoning](#rule-37--cache-poisoning)
41. [Rule 38 — Clickable URLs & Markdown Injection](#rule-38--clickable-urls--markdown-injection)
42. [Rule 39 — Insecure Random Number Generation](#rule-39--insecure-random-number-generation)
43. [Rule 40 — Secrets Rotation & Revocation](#rule-40--secrets-rotation--revocation)
44. [Rule 41 — HTTP Parameter Pollution](#rule-41--http-parameter-pollution)
45. [Rule 42 — Insecure Direct Object Reference (IDOR)](#rule-42--insecure-direct-object-reference-idor)
46. [Rule 43 — Mass Assignment & Over-Posting](#rule-43--mass-assignment--over-posting)
47. [Rule 44 — Server-Side Template Injection (SSTI)](#rule-44--server-side-template-injection-ssti)
48. [Rule 45 — LDAP Injection](#rule-45--ldap-injection)
49. [Rule 46 — XPath Injection](#rule-46--xpath-injection)
50. [Rule 47 — HTML Injection & Content Spoofing](#rule-47--html-injection--content-spoofing)
51. [Rule 48 — HTTP Request Smuggling](#rule-48--http-request-smuggling)
52. [Rule 49 — HTTP Response Splitting](#rule-49--http-response-splitting)
53. [Rule 50 — Insecure TLS/SSL Configuration](#rule-50--insecure-tlsssl-configuration)
54. [Rule 51 — Kubernetes & Container Orchestration Security](#rule-51--kubernetes--container-orchestration-security)
55. [Rule 52 — Serverless Security](#rule-52--serverless-security)
56. [Rule 53 — CI/CD Pipeline Security](#rule-53--cicd-pipeline-security)
57. [Rule 54 — Browser Storage Security](#rule-54--browser-storage-security)
58. [Rule 55 — Iframe & Third-Party Widget Security](#rule-55--iframe--third-party-widget-security)
59. [Rule 56 — PostMessage Security](#rule-56--postmessage-security)
60. [Rule 57 — Service Worker Security](#rule-57--service-worker-security)
61. [Rule 58 — WebAssembly Security](#rule-58--webassembly-security)
62. [Rule 59 — DNS Rebinding Attacks](#rule-59--dns-rebinding-attacks)
63. [Rule 60 — Insecure Randomness in UUIDs](#rule-60--insecure-randomness-in-uuids)
64. [Rule 61 — Uncontrolled Resource Consumption](#rule-61--uncontrolled-resource-consumption)
65. [Rule 62 — Integer Overflow & Underflow](#rule-62--integer-overflow--underflow)
66. [Rule 63 — Type Juggling & Loose Comparison](#rule-63--type-juggling--loose-comparison)
67. [Rule 64 — Feature Flag & A/B Test Security](#rule-64--feature-flag--ab-test-security)
68. [Rule 65 — API Key Scope & Expiry](#rule-65--api-key-scope--expiry)
69. [Rule 66 — Dependency Confusion Attack](#rule-66--dependency-confusion-attack)
70. [Rule 67 — Software Composition Analysis (SCA)](#rule-67--software-composition-analysis-sca)
71. [Rule 68 — Zero-Trust Network Architecture](#rule-68--zero-trust-network-architecture)
72. [Rule 69 — Hardware Security & TPM](#rule-69--hardware-security--tpm)
73. [Rule 70 — Browser Extension Security](#rule-70--browser-extension-security)
74. [How to Apply This to Your Project](#how-to-apply-this-to-your-project)
75. [Master Security Checklist](#master-security-checklist)
76. [Prompt: Tell Any AI Agent This Ruleset](#prompt-tell-any-ai-agent-this-ruleset)

---

## What This Document Is

**Security-First Vibe Coding Rules** is a developer and AI-agent security ruleset that enforces secure-by-default behavior across the **entire software development lifecycle**. It is designed to be:

- **Universal** — applies to any language (JS, Python, Go, Rust, etc.) and any framework
- **Actionable** — every rule has a ❌ bad example and a ✅ good example
- **AI-friendly** — structured so any AI coding agent (Claude, Copilot, Cursor, GPT) can apply these rules automatically
- **Complete** — covers everything from typos in cookie flags to nation-state-level infrastructure attacks
- **Project-ready** — drop it into any repo as `SECURITY.md` or reference it in your system prompt

---

## How to Tell an AI Agent About This

When starting a new session with any AI coding assistant, paste this block:

```
SYSTEM SECURITY CONTEXT:
You are a security-first coding assistant. Apply these rules to every piece of code you write or suggest:

1. NEVER hardcode secrets, API keys, tokens, or passwords — always use environment variables.
2. ALWAYS validate and sanitize all user input server-side, regardless of client-side validation.
3. ALWAYS use parameterized queries or ORMs — never string-concatenate SQL.
4. ALWAYS enforce authentication AND authorization — verify identity AND permissions.
5. NEVER expose stack traces, internal paths, or sensitive error details to end users.
6. ALWAYS use HTTPS, set secure cookie flags (HttpOnly, Secure, SameSite).
7. ALWAYS pin or version-lock dependencies — never use `latest` in production.
8. NEVER trust file uploads — validate type, size, and scan for malware.
9. ALWAYS implement rate limiting on authentication endpoints and sensitive APIs.
10. NEVER log passwords, tokens, PII, or secrets — sanitize logs.
11. ALWAYS apply the principle of least privilege — grant minimum permissions needed.
12. For LLM/AI features: ALWAYS sanitize user inputs before using them in prompts (prevent prompt injection).
13. NEVER trust user-controlled URLs — validate and whitelist before making server-side requests (SSRF).
14. ALWAYS use constant-time comparison for sensitive equality checks (tokens, MACs).
15. NEVER use eval(), exec(), or dynamic code execution with user input.
16. ALWAYS validate redirects against a whitelist — never redirect to user-supplied URLs.
17. NEVER deserialize untrusted data without schema validation.
18. ALWAYS use cryptographically secure random number generators.
19. NEVER expose internal service ports or admin panels to the public internet.
20. ALWAYS set X-Frame-Options and CSP frame-ancestors to prevent clickjacking.

Flag any violation with a comment: // ⚠️ SECURITY: [explanation]
```

---

## Core Security Philosophy

> **"Security is not a feature — it is the foundation."**

| Principle | Description |
|-----------|-------------|
| **Defense in Depth** | Multiple layers of security — no single point of failure |
| **Least Privilege** | Every component gets only the permissions it strictly needs |
| **Fail Secure** | When something breaks, default to denying access — not allowing it |
| **Zero Trust** | Never trust any input, any network, or any identity by default |
| **Shift Left** | Catch security issues at code-write time, not post-deployment |
| **Secure by Default** | The default configuration must be the most secure one |
| **Assume Breach** | Design as if attackers are already inside your system |
| **Minimal Attack Surface** | Expose only what is absolutely necessary |
| **Immutable Audit Trail** | Every sensitive action must be logged and tamper-proof |
| **Separation of Duties** | No single user/service should have god-mode access |

---

## Rule 1 — Never Hardcode Secrets

**Applies to:** All projects, all languages

### ❌ Bad
```javascript
const apiKey = "sk-abc123yourrealkey";
const dbPassword = "MyS3cr3tP@ss";
const jwtSecret = "supersecretjwtkey";
```

### ✅ Good
```javascript
const apiKey = process.env.OPENAI_API_KEY;
const dbPassword = process.env.DB_PASSWORD;
const jwtSecret = process.env.JWT_SECRET;

if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
if (!dbPassword) throw new Error("DB_PASSWORD is not set");
if (!jwtSecret) throw new Error("JWT_SECRET is not set");
```

### `.env.example` (commit this, never `.env`)
```env
OPENAI_API_KEY=
DB_PASSWORD=
JWT_SECRET=
STRIPE_SECRET_KEY=
```

### `.gitignore` (always include)
```
.env
.env.local
.env.production
*.pem
*.key
secrets/
.secret
```

### Tools
- **Local dev:** `dotenv`, `direnv`
- **Production:** AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager, Doppler, Azure Key Vault
- **Scanning:** `git-secrets`, `truffleHog`, `gitleaks` (run in CI on every commit)

### Additional Rules
- Never put secrets in URLs, query strings, or HTTP GET parameters
- Never put secrets in Docker image layers — use build secrets or runtime env
- Never put secrets in client-side JS, HTML, or mobile app bundles
- Never put secrets in comments ("// TODO: use real key abc123")
- Secrets in CI pipelines must use the platform's secret store (GitHub Secrets, GitLab CI Variables)

---

## Rule 2 — Input Validation & Sanitization

**Applies to:** APIs, forms, CLIs, file uploads, webhooks, WebSockets

### ❌ Bad
```python
def create_user(request):
    username = request.data["username"]
    email = request.data["email"]
    age = request.data["age"]
    db.execute(f"INSERT INTO users VALUES ('{username}', '{email}', {age})")
```

### ✅ Good
```python
from pydantic import BaseModel, EmailStr, validator

class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    age: int

    @validator("username")
    def username_valid(cls, v):
        if not v.isalnum() or len(v) < 3 or len(v) > 32:
            raise ValueError("Username must be 3-32 alphanumeric characters")
        return v

    @validator("age")
    def age_valid(cls, v):
        if v < 0 or v > 130:
            raise ValueError("Invalid age")
        return v

def create_user(request):
    data = CreateUserRequest(**request.data)
    db.execute(
        "INSERT INTO users (username, email, age) VALUES (?, ?, ?)",
        (data.username, data.email, data.age)
    )
```

### Validation Rules
- **Whitelist** allowed characters — don't just blacklist bad ones
- **Validate type, length, format, and range** on every field
- **Server-side validation is mandatory** — client-side is UX only
- **Reject early** — validate at the boundary (API entry point), not deep in business logic
- **Never trust** `Content-Type`, `User-Agent`, `Referer`, or any HTTP header
- **Normalize** unicode and encoding before validation (prevent homograph attacks)
- **Validate JSON schema** — reject unexpected fields (use strict/closed schemas)
- **Validate array/collection sizes** — prevent DoS via huge payloads

---

## Rule 3 — Authentication & Authorization

**Applies to:** Any app with user accounts or protected resources

### Authentication (Who are you?)

#### ✅ Password Handling
```python
import bcrypt

hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
is_valid = bcrypt.checkpw(password.encode(), stored_hash)
```

**Never use:** MD5, SHA1, SHA256 (unsalted) for passwords.
**Always use:** `bcrypt`, `argon2id`, `scrypt`.

#### ✅ Password Policy
```python
import re

def validate_password_strength(password: str) -> bool:
    if len(password) < 12:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True
```

#### ✅ Multi-Factor Authentication (MFA)
```javascript
import speakeasy from "speakeasy";

const secret = speakeasy.generateSecret({ name: "MyApp" });
const verified = speakeasy.totp.verify({
  secret: secret.base32,
  encoding: "base32",
  token: userSubmittedToken,
  window: 1
});
if (!verified) throw new Error("Invalid MFA code");
```

#### ✅ JWT Best Practices
```javascript
import jwt from "jsonwebtoken";

const accessToken = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "15m", algorithm: "HS256" }
);

try {
  const payload = jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
  });
} catch (err) {
  return res.status(401).json({ error: "Invalid token" });
}
```

**Never use `alg: none`** — explicitly whitelist allowed algorithms.

### Authorization (Are you allowed to do this?)

#### ❌ Bad — Missing Authorization
```javascript
app.get("/api/invoice/:id", authenticate, async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  return res.json(invoice);
});
```

#### ✅ Good — Enforce Ownership
```javascript
app.get("/api/invoice/:id", authenticate, async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    userId: req.user.id
  });
  if (!invoice) return res.status(404).json({ error: "Not found" });
  return res.json(invoice);
});
```

### RBAC (Role-Based Access Control)
```javascript
const PERMISSIONS = {
  admin:  ["read", "write", "delete", "manage_users", "view_audit_log"],
  editor: ["read", "write"],
  viewer: ["read"],
};

function authorize(requiredPermission) {
  return (req, res, next) => {
    const userPermissions = PERMISSIONS[req.user.role] ?? [];
    if (!userPermissions.includes(requiredPermission)) {
      logger.warn({ userId: req.user.id, path: req.path, action: requiredPermission }, "Unauthorized access attempt");
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
```

### Session Security
```javascript
res.cookie("session", token, {
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
  maxAge: 15 * 60 * 1000,
  path: "/",
  domain: "yourdomain.com"
});
```

### Additional Auth Rules
- Never reveal whether an email exists on login failure
- Always invalidate tokens on logout
- Enforce re-authentication before sensitive actions
- Implement brute-force protection on all auth endpoints

---

## Rule 4 — Secure API Design

**Applies to:** REST APIs, GraphQL, gRPC, webhooks

### ✅ Always Return Minimal Data
```javascript
// ❌ Bad
return res.json(user);

// ✅ Good
return res.json({
  id: user.id,
  name: user.name,
  email: user.email,
});
```

### ✅ CORS Configuration
```javascript
import cors from "cors";

app.use(cors({
  origin: ["https://yourdomain.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
```

### ✅ HTTP Security Headers
```javascript
import helmet from "helmet";

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: [],
  }
}));
```

### ✅ Webhook Signature Verification
```javascript
import crypto from "crypto";

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expected}`)
  );
}
```

### ✅ Mass Assignment Prevention
```javascript
// ❌ Bad
const user = new User(req.body);

// ✅ Good
const user = new User({
  name: req.body.name,
  email: req.body.email,
});
```

---

## Rule 5 — SQL & Database Security

**Applies to:** Any app using a relational or NoSQL database

### ❌ Bad — SQL Injection
```python
query = f"SELECT * FROM users WHERE email = '{email}' AND password = '{password}'"
cursor.execute(query)
```

### ✅ Good — Parameterized Queries
```python
cursor.execute(
    "SELECT * FROM users WHERE email = ? AND status = ?",
    (email, "active")
)
```

### ✅ NoSQL Injection Prevention
```javascript
const { username, password } = req.body;
if (typeof username !== "string" || typeof password !== "string") {
  return res.status(400).json({ error: "Invalid input" });
}
```

### ✅ Database Principle of Least Privilege
```sql
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'strong_random_password';
GRANT SELECT, INSERT, UPDATE ON myapp.users TO 'app_user'@'localhost';
```

### Additional Database Rules
- Always use connection pooling with enforced connection limits
- Never expose database ports to the public internet
- Enable query logging for audit purposes (redact sensitive values)
- Set statement timeouts to prevent long-running query attacks
- Use read replicas for analytics — isolate the write path

---

## Rule 6 — Dependency & Supply Chain Security

**Applies to:** All projects with external packages

### ✅ Lock Your Dependencies
```bash
npm ci
pip install -r requirements.txt
```

### ✅ Audit Dependencies Regularly
```bash
npm audit --audit-level=moderate
pip install safety && safety check
```

### ✅ Dependabot Configuration
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
```

### ✅ Vet New Packages Before Adding
- Check download count, maintainer count, last publish date
- Review source for obvious malicious patterns
- Use `socket.dev` or `npx package-inspector`
- Check for typosquatting (`lodash` vs `1odash`)
- Prefer packages with signed releases

### ✅ Software Bill of Materials (SBOM)
- Generate an SBOM for every release: `syft`, `cyclonedx`
- Store SBOMs to quickly respond to new CVEs

---

## Rule 7 — Secure File Handling

**Applies to:** Any app accepting file uploads

### ✅ File Upload Security
```javascript
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "/tmp/uploads",
    filename: (req, file, cb) => {
      const safeName = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
      cb(null, safeName);
    }
  })
});
```

### ✅ File Storage Rules
- **Never** store uploads in the web root
- **Never** execute uploaded files
- **Always** store to S3/blob storage in production
- **Scan** for malware with ClamAV or a cloud scanning API
- **Strip metadata** from images (EXIF GPS, device info)
- **Re-encode images** to strip embedded malicious payloads
- **Set Content-Disposition: attachment** when serving user-uploaded files

---

## Rule 8 — Frontend Security (XSS, CSRF, CSP)

**Applies to:** Any web frontend

### XSS (Cross-Site Scripting)

#### ❌ Bad
```javascript
element.innerHTML = userInput;
document.write(req.query.name);
location.href = userInput;
```

#### ✅ Good
```javascript
element.textContent = userInput;
<div>{userInput}</div>
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(richText) }} />
```

### CSRF (Cross-Site Request Forgery)
```javascript
import csrf from "csurf";
app.use(csrf({ cookie: { httpOnly: true, secure: true, sameSite: "Strict" } }));
```

### Content Security Policy (CSP)
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
```

### Additional Frontend Rules
- Never use `eval()`, `new Function()`, `setTimeout(string)` with user data
- Sanitize URL schemes — block `javascript:`, `data:`, `vbscript:`
- Set `rel="noopener noreferrer"` on all `target="_blank"` links
- Never store JWTs in `localStorage` — use `httpOnly` cookies
- Implement Subresource Integrity (SRI) for all external scripts/styles

---

## Rule 9 — Logging & Error Handling

**Applies to:** All applications

### ❌ Bad
```javascript
res.status(500).json({ error: err.message, stack: err.stack });
console.log(`Login: user=${email} password=${password}`);
```

### ✅ Good
```javascript
import pino from "pino";

const logger = pino({
  redact: ["password", "token", "authorization", "creditCard", "ssn", "email", "secret", "key"],
  level: process.env.LOG_LEVEL || "info",
});

app.use((err, req, res, next) => {
  const errorId = crypto.randomUUID();
  logger.error({ errorId, err, path: req.path }, "Unhandled error");
  res.status(500).json({ error: "Something went wrong", errorId });
});
```

### What to Log ✅ vs ❌

| Log This ✅ | Never Log ❌ |
|------------|------------|
| User ID (not email) | Passwords |
| Request path | API keys / tokens |
| Timestamp | Credit card numbers |
| HTTP status code | SSN / PII |
| Error type + error ID | Full JWT tokens |
| IP address (hashed) | Session cookies |
| Action type | Security question answers |
| Duration (ms) | Encryption keys |

---

## Rule 10 — Encryption & Data Protection

**Applies to:** Any app storing or transmitting sensitive data

### ✅ In Transit — Always Use HTTPS
```nginx
server {
  listen 80;
  return 301 https://$host$request_uri;
}
server {
  listen 443 ssl http2;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5:!RC4;
  ssl_prefer_server_ciphers on;
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
}
```

### ✅ At Rest — Encrypt Sensitive Fields
```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

key = bytes.fromhex(os.environ["AES_KEY"])
aesgcm = AESGCM(key)

def encrypt(plaintext: str) -> bytes:
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return nonce + ct

def decrypt(data: bytes) -> str:
    nonce, ct = data[:12], data[12:]
    return aesgcm.decrypt(nonce, ct, None).decode()
```

### ✅ Key Management
- Never generate keys from passwords
- Rotate encryption keys quarterly
- Use separate keys per environment
- Store keys in AWS KMS, GCP Cloud KMS, HashiCorp Vault
- Implement key envelope encryption (DEK + KEK pattern)

---

## Rule 11 — Infrastructure & DevOps Security

**Applies to:** Docker, CI/CD, cloud infrastructure

### ✅ Docker Security
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
CMD ["node", "server.js"]
```

### ✅ Cloud Security
- Enable MFA on all cloud accounts
- Use IAM roles — never long-lived access keys for services
- Block public S3 buckets by default
- Enable VPC — put databases in private subnets
- Use Security Groups — deny all, open only required ports
- Use Terraform/IaC with security policies (`tfsec`, `checkov`)

---

## Rule 12 — Rate Limiting & DDoS Protection

**Applies to:** Any public-facing API or web app

### ✅ Rate Limiting
```javascript
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({ error: "Too many login attempts. Try again in 15 minutes." });
  }
});

app.use("/api/auth/login", authLimiter);
```

### ✅ Account Lockout
```javascript
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

async function handleLogin(email, password) {
  const user = await User.findOne({ email });
  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    throw new Error("Account locked. Try again later.");
  }
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }
    await user.save();
    throw new Error("Invalid credentials");
  }
  user.failedAttempts = 0;
  user.lockedUntil = null;
  await user.save();
}
```

---

## Rule 13 — AI/LLM-Specific Security

**Applies to:** Any app using AI models or exposing LLM features

### ✅ Prevent Prompt Injection
```python
BLOCKED_PATTERNS = [
    r"ignore (previous|above|all) instructions",
    r"you are now",
    r"act as",
    r"jailbreak",
    r"system prompt",
    r"disregard your",
    r"forget everything",
    r"new persona",
    r"DAN",
]

def sanitize_user_prompt(user_input: str) -> str:
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, user_input, re.IGNORECASE):
            raise ValueError("Invalid input detected")
    if len(user_input) > 2000:
        raise ValueError("Input too long")
    return user_input.strip()
```

### ✅ Output Validation
```python
def validate_llm_output(output: str) -> str:
    if re.search(r"\b\d{3}-\d{2}-\d{4}\b", output):
        raise ValueError("Output contains potential PII")
    if any(p in output.lower() for p in ["system prompt", "ignore instructions"]):
        raise ValueError("Suspicious output detected")
    return DOMPurify.sanitize(output)
```

### ✅ LLM API Key & Cost Protection
```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages,
  max_tokens: 500,
  user: req.user.id,
});

const dailyUsage = await UsageLog.sum("tokensUsed", {
  where: { userId: req.user.id, timestamp: { $gte: startOfDay } }
});
if (dailyUsage > 50000) throw new Error("Daily AI usage limit reached");
```

### Additional AI Security Rules
- Never pass raw database records or system configs into prompts
- Log all prompts and responses for abuse detection
- Use a separate AI safety layer / content moderation API
- Never use LLM output as executable code without sandboxing
- Implement RAG (Retrieval-Augmented Generation) access controls — users must only retrieve documents they are authorized to read
- Separate system prompt from user prompt at the API level — never concatenate them in a way that lets user input override system instructions

---

## Rule 14 — Session Management

**Applies to:** Any stateful web application

### ✅ Secure Session Configuration
```javascript
import session from "express-session";
import RedisStore from "connect-redis";

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: "__Host-session",
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 15 * 60 * 1000,
  }
}));
```

### ✅ Session Rules
- **Regenerate** session ID after login (prevents session fixation)
- **Invalidate** session on logout
- **Rotate** session IDs periodically
- **Bind** sessions to IP + User-Agent
- Never put session IDs in URLs
- Implement absolute session timeout (8 hours)

---

## Rule 15 — Business Logic Security

**Applies to:** E-commerce, fintech, SaaS, any app with workflows

### ✅ Price Tampering Prevention
```javascript
// ❌ Bad
const order = new Order({ items: req.body.items, total: req.body.total });

// ✅ Good
const items = await Product.findAll({ where: { id: req.body.itemIds } });
const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const order = new Order({ items, total });
```

### ✅ Race Conditions (TOCTOU)
```javascript
// ✅ Good — atomic operation
const result = await User.updateOne(
  { _id: id, balance: { $gte: amount } },
  { $inc: { balance: -amount } }
);
if (result.modifiedCount === 0) throw new Error("Insufficient balance");
```

### ✅ Coupon / Voucher Abuse
```javascript
const coupon = await Coupon.findOne({
  code: couponCode,
  isActive: true,
  expiresAt: { $gt: new Date() },
  usedBy: { $not: { $elemMatch: { $eq: req.user.id } } }
});
if (!coupon) throw new Error("Invalid or already used coupon");
```

---

## Rule 16 — Clickjacking & UI Redressing

**Applies to:** Any web application

### ✅ Prevent Clickjacking
```nginx
add_header X-Frame-Options "DENY" always;
add_header Content-Security-Policy "frame-ancestors 'none';" always;
```

---

## Rule 17 — Subdomain & DNS Security

**Applies to:** Any multi-subdomain application

### ✅ Prevent Subdomain Takeover
- Audit all DNS records — remove CNAME records pointing to decommissioned services
- Scan for dangling DNS records regularly (`subjack`, `nuclei`)

### ✅ DNS Security
- Enable DNSSEC on all domains
- Use CAA records:
```
example.com. CAA 0 issue "letsencrypt.org"
```
- Set SPF, DKIM, and DMARC records
- Never put sensitive data in DNS TXT records

---

## Rule 18 — Memory & Buffer Safety

**Applies to:** C, C++, Rust, Go, and allocation limits in higher-level languages

### ✅ Rules
- Use memory-safe languages for security-critical components
- Set heap/stack allocation limits
- Enforce collection size limits on user-supplied data

```python
MAX_ITEMS = 1000
if len(request.data["items"]) > MAX_ITEMS:
    raise ValueError(f"Too many items — max is {MAX_ITEMS}")
```

---

## Rule 19 — Timing Attack Prevention

**Applies to:** Any code that compares secrets, tokens, MACs, or passwords

### ✅ Good — Constant-Time Comparison
```python
import hmac
if hmac.compare_digest(user_token.encode(), stored_token.encode()):
    grant_access()
```

```javascript
import crypto from "crypto";
if (crypto.timingSafeEqual(Buffer.from(userToken), Buffer.from(storedToken))) {
  grantAccess();
}
```

---

## Rule 20 — Open Redirect Prevention

**Applies to:** Any endpoint that performs redirects

### ✅ Good — Whitelist Allowed Destinations
```javascript
const ALLOWED_REDIRECT_HOSTS = ["yourdomain.com", "www.yourdomain.com"];

app.get("/redirect", (req, res) => {
  const url = new URL(req.query.url, "https://yourdomain.com");
  if (!ALLOWED_REDIRECT_HOSTS.includes(url.hostname)) {
    return res.status(400).json({ error: "Invalid redirect destination" });
  }
  res.redirect(url.toString());
});
```

---

## Rule 21 — Server-Side Request Forgery (SSRF)

**Applies to:** Any feature that fetches URLs or makes outbound HTTP requests

### ✅ Good — Validate and Restrict Outbound Requests
```python
from urllib.parse import urlparse
import ipaddress

BLOCKED_PRIVATE_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # AWS metadata
    ipaddress.ip_network("::1/128"),
]

def safe_fetch(url: str):
    parsed = urlparse(url)
    if parsed.scheme not in {"https"}:
        raise ValueError("Only HTTPS URLs are allowed")
    import socket
    ip = socket.gethostbyname(parsed.hostname)
    ip_obj = ipaddress.ip_address(ip)
    for private_range in BLOCKED_PRIVATE_RANGES:
        if ip_obj in private_range:
            raise ValueError("Requests to internal addresses are not allowed")
    return requests.get(url, timeout=5, allow_redirects=False)
```

---

## Rule 22 — XML & XXE Injection

**Applies to:** Any app that parses XML, SOAP, or SVG

### ✅ Good — Disable External Entity Processing
```python
from lxml import etree

parser = etree.XMLParser(
    resolve_entities=False,
    no_network=True,
    load_dtd=False,
)
tree = etree.parse(user_supplied_xml_file, parser)
```

---

## Rule 23 — Command Injection

**Applies to:** Any code that runs shell commands

### ✅ Good — Use Argument Arrays
```python
subprocess.run(
    ["convert", filename, "output.png"],
    shell=False,
    timeout=30,
    capture_output=True
)
```

```javascript
import { execFile } from "child_process";
execFile("convert", [filename, "output.png"], { timeout: 30000 }, (err, stdout, stderr) => {});
```

---

## Rule 24 — Path Traversal

**Applies to:** Any code that reads/writes files based on user input

### ✅ Good — Resolve and Validate Path
```python
import os

BASE_DIR = "/var/uploads"

def safe_read(filename: str) -> str:
    requested_path = os.path.realpath(os.path.join(BASE_DIR, filename))
    if not requested_path.startswith(BASE_DIR + os.sep):
        raise ValueError("Path traversal detected")
    with open(requested_path) as f:
        return f.read()
```

---

## Rule 25 — Insecure Deserialization

**Applies to:** Any app that deserializes user-supplied data

### ✅ Good — Use Safe Formats
```python
import json
data = json.loads(user_supplied_string)

import yaml
data = yaml.safe_load(user_supplied_string)  # NOT yaml.load()
```

---

## Rule 26 — Cryptographic Failures

**Applies to:** Any code using cryptography

### ✅ Use These
```python
import secrets
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import bcrypt

token = secrets.token_urlsafe(32)
otp = secrets.randbelow(1000000)
```

### Rules
- Use AES-256-GCM for symmetric encryption
- Use RSA-2048+ or EC P-256+ for asymmetric operations
- Always use a unique, random nonce/IV per encryption
- Never reuse nonces with the same key

---

## Rule 27 — Security Misconfiguration

**Applies to:** All environments, frameworks, and services

### ✅ Checklist
- Remove default credentials on all services
- Disable debug mode in production
- Remove server version banners

```nginx
server_tokens off;
```

```javascript
app.disable("x-powered-by");
```

---

## Rule 28 — Mobile Security

**Applies to:** iOS, Android, React Native, Flutter apps

### ✅ Rules
```javascript
import * as Keychain from "react-native-keychain";
await Keychain.setGenericPassword("token", accessToken);
```

- **Certificate Pinning** for all API calls
- **Disable screenshots** on sensitive screens
- **Jailbreak / Root Detection**
- Never store tokens in `SharedPreferences` (Android) or `NSUserDefaults` (iOS)
- Validate deep links as untrusted input

---

## Rule 29 — WebSocket Security

**Applies to:** Any app using WebSockets

### ✅ Rules
```javascript
wss.on("connection", (ws, req) => {
  const origin = req.headers.origin;
  if (!["https://yourdomain.com"].includes(origin)) {
    ws.close(1008, "Unauthorized origin");
    return;
  }
  const token = new URLSearchParams(req.url.split("?")[1]).get("token");
  const user = verifyJWT(token);
  if (!user) { ws.close(1008, "Unauthorized"); return; }
  ws.on("message", (message) => {
    if (message.length > 10000) { ws.close(1009, "Message too large"); return; }
  });
});
```

---

## Rule 30 — Third-Party & OAuth Security

**Applies to:** Any app using OAuth or social login

### ✅ OAuth 2.0 / OIDC Best Practices
```javascript
const state = crypto.randomBytes(16).toString("hex");
req.session.oauthState = state;

app.get("/callback", (req, res) => {
  if (req.query.state !== req.session.oauthState) {
    return res.status(403).json({ error: "Invalid state — possible CSRF" });
  }
});
```

### Rules
- Always use PKCE for public clients
- Never use the implicit flow (deprecated)
- Validate `iss`, `aud`, `exp`, `nonce` in ID tokens
- Validate redirect URIs with exact match

---

## Rule 31 — Email Security

**Applies to:** Any app that sends or processes email

### ✅ SPF, DKIM, DMARC
```
example.com. TXT "v=spf1 include:sendgrid.net -all"
_dmarc.example.com. TXT "v=DMARC1; p=reject; rua=mailto:dmarc-reports@example.com; pct=100"
```

### ✅ Header Injection Prevention
```javascript
function sendEmail(to, subject, body) {
  if (/[\r\n]/.test(to) || /[\r\n]/.test(subject)) {
    throw new Error("Header injection detected");
  }
}
```

---

## Rule 32 — Privacy & GDPR Compliance

**Applies to:** Any app handling personal data

### ✅ Right to Erasure
```python
def delete_user_data(user_id: str):
    User.delete(user_id)
    Orders.anonymize(user_id)
    AuditLog.retain(user_id)
    Sessions.delete_all(user_id)
```

### Rules
- Collect only the data you actually need
- Never use production data in development — use synthetic data
- Implement consent management before collecting cookies

---

## Rule 33 — Monitoring, Alerting & Incident Response

**Applies to:** All production systems

### ✅ Alert on These Events
```yaml
security_alerts:
  - multiple_failed_logins:   threshold: 10 in 5 minutes
  - impossible_travel:        login from 2 countries within 1 hour
  - mass_data_export:         >1000 records in 1 hour
  - new_admin_user_created:   alert immediately
  - spike_in_4xx_5xx_errors:  >200% baseline in 5 minutes
```

---

## Rule 34 — GraphQL Security

**Applies to:** Any application using GraphQL

### ✅ Rules
```javascript
import depthLimit from "graphql-depth-limit";
import { createComplexityLimitRule } from "graphql-validation-complexity";

app.use("/graphql", graphqlHTTP({
  schema,
  validationRules: [
    depthLimit(5),
    createComplexityLimitRule(1000),
  ],
}));
```

- Disable introspection in production
- Per-resolver authorization checks
- Limit query aliases (batch query attack prevention)

---

## Rule 35 — Prototype Pollution (JS)

**Applies to:** JavaScript / Node.js

### ✅ Good
```javascript
function safeMerge(target, source) {
  for (let key of Object.keys(source)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
    target[key] = source[key];
  }
}
```

---

## Rule 36 — ReDoS (Regex Denial of Service)

**Applies to:** Any code using regular expressions on user input

### ✅ Good
```javascript
import RE2 from "re2";
const safe = new RE2("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
```

---

## Rule 37 — Cache Poisoning

**Applies to:** Any application using HTTP caches or CDNs

### ✅ Rules
```nginx
add_header Cache-Control "private, no-store" always;
```

- Unkeyed headers must never influence response content
- Never cache error responses that include user input

---

## Rule 38 — Clickable URLs & Markdown Injection

**Applies to:** Chat apps, documentation, and anywhere Markdown is rendered

### ✅ Good
```javascript
import DOMPurify from "dompurify";
import { marked } from "marked";

const renderer = new marked.Renderer();
renderer.link = (href, title, text) => {
  if (!href.startsWith("https://") && !href.startsWith("http://")) {
    return text;
  }
  return `<a href="${href}" rel="noopener noreferrer" target="_blank">${text}</a>`;
};
const html = DOMPurify.sanitize(marked(userInput, { renderer }));
```

---

## Rule 39 — Insecure Random Number Generation

**Applies to:** Tokens, OTPs, session IDs, nonces

### ✅ Good
```python
import secrets
token = secrets.token_urlsafe(32)
otp = str(secrets.randbelow(1000000)).zfill(6)
```

```javascript
import crypto from "crypto";
const token = crypto.randomBytes(32).toString("hex");
```

---

## Rule 40 — Secrets Rotation & Revocation

**Applies to:** All secrets, API keys, certificates

### ✅ Rotation Policy
| Secret Type | Rotation Frequency |
|------------|-------------------|
| Service API keys | Every 90 days |
| Database credentials | Every 90 days |
| JWT signing secrets | Every 30–90 days |
| TLS certificates | Before expiry (auto-renew) |
| SSH keys | Every 90 days |

---

## Rule 41 — HTTP Parameter Pollution

**Applies to:** Any web application that reads query parameters or POST body fields

### What It Is
HTTP Parameter Pollution (HPP) occurs when an attacker sends duplicate parameters. Some frameworks take the first value, some take the last, some merge them into an array — inconsistency creates exploitable behavior.

### ❌ Bad
```
GET /search?role=user&role=admin
// Backend may pick "admin" if it takes the last value
```

### ✅ Good
```javascript
import hpp from "hpp";
app.use(hpp({
  whitelist: ["tags", "filters"]  // Only allow arrays for these known fields
}));

// Or manually — always explicitly pick one value
const role = Array.isArray(req.query.role)
  ? req.query.role[0]   // Always take first
  : req.query.role;
```

### Rules
- Use the `hpp` middleware (Node.js) or equivalent in your framework
- Never pass query params directly to database queries without extracting a single scalar value
- Whitelist parameters that are legitimately multi-valued (e.g., filter arrays)
- Log requests with duplicate parameter names as potential attack signals

---

## Rule 42 — Insecure Direct Object Reference (IDOR)

**Applies to:** Any endpoint that accesses a resource by ID

### ❌ Bad
```javascript
app.get("/api/document/:id", authenticate, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  return res.json(doc);  // Any authenticated user can access any document
});
```

### ✅ Good
```javascript
app.get("/api/document/:id", authenticate, async (req, res) => {
  const doc = await Document.findOne({
    _id: req.params.id,
    ownerId: req.user.id  // Enforce ownership
  });
  if (!doc) return res.status(404).json({ error: "Not found" });
  return res.json(doc);
});
```

### ✅ Use Non-Guessable IDs
```javascript
// ❌ Bad — sequential integer IDs are trivially enumerable
GET /api/order/1001
GET /api/order/1002

// ✅ Good — UUIDs or opaque tokens
GET /api/order/550e8400-e29b-41d4-a716-446655440000
```

### Rules
- Always enforce resource ownership at the query level, not just in application logic
- Never expose sequential integer IDs for sensitive resources
- Use UUIDs v4 (random) for all resource identifiers
- Implement row-level security in PostgreSQL for critical multi-tenant data
- Log all 404 responses on authenticated endpoints — repeated 404s may indicate IDOR probing

---

## Rule 43 — Mass Assignment & Over-Posting

**Applies to:** Any framework that binds request body to model objects

### ❌ Bad
```javascript
// Express + Mongoose
app.put("/api/user/:id", authenticate, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, req.body); // User can set isAdmin: true
});
```

### ✅ Good
```javascript
const ALLOWED_USER_FIELDS = ["name", "bio", "avatarUrl", "timezone"];

app.put("/api/user/:id", authenticate, async (req, res) => {
  const safeUpdate = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => ALLOWED_USER_FIELDS.includes(key))
  );
  await User.findOneAndUpdate(
    { _id: req.params.id, _id: req.user.id },  // Must own the resource
    safeUpdate,
    { runValidators: true }
  );
});
```

```python
# FastAPI — use response_model and explicit field selection
class UserUpdate(BaseModel):
    name: Optional[str]
    bio: Optional[str]
    # No: role, is_admin, balance — these fields don't exist in this schema
```

### Rules
- Define an explicit allowlist of fields that can be set via user input
- Use separate DTOs (Data Transfer Objects) for create, update, and read operations
- Never use `update(req.body)`, `assign(params)`, or equivalent mass-assignment methods
- In Django: use `fields=` in ModelForm, never `fields="__all__"`
- In Rails: use `permit()` in strong parameters

---

## Rule 44 — Server-Side Template Injection (SSTI)

**Applies to:** Any app using server-side templating engines (Jinja2, Twig, Pebble, Freemarker, Handlebars, etc.)

### ❌ Bad
```python
from jinja2 import Template

# Attacker input: "{{ 7*7 }}" → renders as "49"
# Attacker input: "{{ config.SECRET_KEY }}" → leaks secret
# Attacker input: "{{ ''.__class__.__mro__[1].__subclasses__() }}" → RCE
template = Template(user_input)
return template.render()
```

### ✅ Good
```python
from jinja2 import Environment, select_autoescape

env = Environment(
    autoescape=select_autoescape(["html", "xml"]),
    # Use a sandboxed environment for user-controlled templates
)

# Never render user input AS a template — only render user input INTO a template
template = env.get_template("email_template.html")
return template.render(user_name=user_input)  # user_input is data, not code
```

### Rules
- Never pass user input as the template string itself — only as template variables
- Use a sandboxed template environment (`jinja2.sandbox.SandboxedEnvironment`) if user-defined templates are a product requirement
- Disable template engine features that allow code execution (e.g., disable `exec`, `import` in Jinja2 sandbox)
- Apply output encoding — templates must auto-escape HTML by default
- Test all template endpoints with `{{7*7}}`, `${7*7}`, `<%= 7*7 %>` to detect SSTI

---

## Rule 45 — LDAP Injection

**Applies to:** Any app that queries an LDAP/Active Directory server

### ❌ Bad
```python
ldap_filter = f"(uid={username})"  # Attacker: "*)(&(objectClass=*"
conn.search(base_dn, ldap_filter)
```

### ✅ Good
```python
import re

def sanitize_ldap(value: str) -> str:
    # Escape special LDAP filter characters
    replacements = {
        "\\": "\\5c", "*": "\\2a", "(": "\\28", ")": "\\29",
        "\x00": "\\00", "/": "\\2f"
    }
    for char, escaped in replacements.items():
        value = value.replace(char, escaped)
    return value

ldap_filter = f"(uid={sanitize_ldap(username)})"
conn.search(base_dn, ldap_filter)
```

### Rules
- Always escape user input before embedding in LDAP filters
- Use parameterized LDAP libraries where available
- Apply least privilege on the LDAP service account
- Never expose LDAP error messages to users — they reveal directory structure

---

## Rule 46 — XPath Injection

**Applies to:** Any app that queries XML documents using XPath

### ❌ Bad
```python
xpath_query = f"//user[username='{username}' and password='{password}']"
# Attacker: username = "' or '1'='1"  → returns all users
tree.xpath(xpath_query)
```

### ✅ Good
```python
from lxml import etree

# Use parameterized XPath (variable substitution — no string interpolation)
tree.xpath("//user[username=$username and password=$password]",
           username=username, password=password)
```

### Rules
- Use XPath variable binding (parameterized XPath) — never string-interpolate user input
- Validate and whitelist all XPath inputs before use
- Prefer JSON/relational databases over XML document stores for user data

---

## Rule 47 — HTML Injection & Content Spoofing

**Applies to:** Any page that reflects user input in HTTP responses

### ❌ Bad
```python
# User submits name = "<h1>You are hacked</h1><script>...</script>"
return f"<p>Welcome, {name}</p>"
```

### ✅ Good
```python
import html

safe_name = html.escape(name)
return f"<p>Welcome, {safe_name}</p>"
```

### Rules
- Always HTML-encode user-supplied data before inserting into HTML context
- Set `Content-Type: text/html; charset=UTF-8` — missing charset allows charset sniffing attacks
- Set `X-Content-Type-Options: nosniff` to prevent MIME sniffing
- Never reflect user input verbatim in HTTP responses without encoding

---

## Rule 48 — HTTP Request Smuggling

**Applies to:** Any deployment behind a reverse proxy, load balancer, or CDN

### What It Is
HTTP request smuggling exploits disagreements between how a front-end proxy and back-end server parse HTTP/1.1 `Transfer-Encoding` and `Content-Length` headers. Attackers can hijack other users' requests.

### ✅ Prevention
```nginx
# Nginx — reject ambiguous requests
proxy_http_version 1.1;
proxy_set_header Connection "";

# Reject requests with both Content-Length and Transfer-Encoding headers
if ($http_transfer_encoding ~* "chunked" ) {
    # Drop or reject if Content-Length also present
}
```

### Rules
- Use HTTP/2 end-to-end where possible — HTTP/2 is not vulnerable to classic smuggling
- Configure your proxy to reject requests with both `Content-Length` and `Transfer-Encoding: chunked` headers simultaneously
- Keep front-end and back-end servers consistent in their HTTP parsing behavior
- Test with `smuggler.py` or Burp Suite's HTTP Smuggling scanner
- Upgrade all proxy and web server software regularly

---

## Rule 49 — HTTP Response Splitting

**Applies to:** Any endpoint that writes user input into HTTP response headers

### ❌ Bad
```python
# Attacker: redirect_url = "/page\r\nSet-Cookie: session=hacked"
response.headers["Location"] = redirect_url
```

### ✅ Good
```python
import re

def safe_header_value(value: str) -> str:
    # Remove all CR, LF, and null bytes from header values
    if re.search(r"[\r\n\x00]", value):
        raise ValueError("Invalid characters in header value")
    return value

response.headers["Location"] = safe_header_value(redirect_url)
```

### Rules
- Never write user-supplied input directly into HTTP response headers
- Strip or reject any `\r`, `\n`, or `\x00` characters from header values
- Use framework-provided redirect functions — never manually set `Location` with user input
- Modern frameworks (Flask, Express, Django) auto-sanitize headers but still validate inputs

---

## Rule 50 — Insecure TLS/SSL Configuration

**Applies to:** All HTTPS endpoints, APIs, and internal services

### ✅ Strong TLS Configuration
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA';
ssl_prefer_server_ciphers on;
ssl_session_timeout 1d;
ssl_session_cache shared:MozSSL:10m;
ssl_session_tickets off;

# HSTS
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
```

### Rules
- Disable TLS 1.0 and TLS 1.1 — minimum TLS 1.2, prefer TLS 1.3
- Disable SSL 2.0, SSL 3.0 (POODLE)
- Disable weak ciphers: RC4, DES, 3DES, EXPORT ciphers, NULL ciphers
- Disable SSL session tickets or rotate the session ticket key regularly
- Enable OCSP stapling for certificate revocation checking
- Use 2048-bit minimum RSA keys; prefer EC P-256 or P-384
- Test your TLS config with `testssl.sh` or SSL Labs
- Enable HSTS preloading and submit to the HSTS preload list

---

## Rule 51 — Kubernetes & Container Orchestration Security

**Applies to:** Any deployment using Kubernetes, Docker Swarm, or similar

### ✅ Kubernetes Security
```yaml
# Pod Security Context
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: myapp:v1.2.3  # Always pin image tags — never use :latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      resources:
        limits:
          cpu: "500m"
          memory: "256Mi"
        requests:
          cpu: "100m"
          memory: "128Mi"
```

### ✅ Network Policies
```yaml
# Default deny all ingress/egress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

### ✅ Secrets Management in K8s
```yaml
# Use sealed secrets or external secrets — never commit plaintext Secrets
# Use external-secrets-operator with AWS Secrets Manager / Vault
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
```

### Rules
- Never use `privileged: true` containers in production
- Enable Pod Security Admission (PSA) with `restricted` profile
- Scan images with Trivy or Snyk before deploying
- Use `read-only` root filesystem for all containers
- Enable Kubernetes audit logging and ship to SIEM
- Rotate service account tokens — use short-lived tokens
- Never mount the host filesystem, Docker socket, or `/proc` in containers
- Run `kube-bench` to check CIS Kubernetes Benchmark compliance
- Use OPA/Gatekeeper or Kyverno for policy enforcement

---

## Rule 52 — Serverless Security

**Applies to:** AWS Lambda, GCP Cloud Functions, Azure Functions, Vercel Edge, etc.

### ✅ Serverless-Specific Security
```javascript
// AWS Lambda — least privilege IAM role
// Each function gets its own IAM role with minimal permissions

// ❌ Bad — overly permissive
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}

// ✅ Good — minimal permission
{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::my-bucket/uploads/*"
}
```

```javascript
// ✅ Always validate event input — Lambda events are untrusted
exports.handler = async (event) => {
  // event.body could be anything
  const body = JSON.parse(event.body ?? "{}");
  const { userId } = body;
  if (typeof userId !== "string" || !userId.match(/^[a-z0-9-]{36}$/)) {
    return { statusCode: 400, body: "Invalid input" };
  }
};
```

### Rules
- Each Lambda/function gets its own dedicated IAM role — no shared roles
- Never store secrets in Lambda environment variables in plaintext — use SSM Parameter Store or Secrets Manager
- Set function timeouts and memory limits to prevent resource abuse
- Cold start mitigation must not compromise security (don't cache auth state between cold starts)
- Disable function URL public access unless required — use API Gateway with auth
- Audit Lambda layers — a malicious layer can compromise the function
- Log all function invocations to CloudWatch and ship to SIEM
- Enable AWS Lambda Insights for anomaly detection

---

## Rule 53 — CI/CD Pipeline Security

**Applies to:** GitHub Actions, GitLab CI, Jenkins, CircleCI, and any CI/CD system

### ✅ Secure Pipeline Configuration
```yaml
name: Secure Deploy
on:
  push:
    branches: [main]

permissions:
  contents: read       # Minimal permissions — not write-all
  id-token: write      # For OIDC auth to cloud
  packages: write

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false  # Don't leave credentials in workspace

      - name: Secret Scan
        uses: gitleaks/gitleaks-action@v2

      - name: Dependency Audit
        run: npm audit --audit-level=high

      - name: SAST Scan
        uses: github/codeql-action/analyze@v3

      - name: Container Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          exit-code: 1
          severity: HIGH,CRITICAL

      - name: IaC Scan
        run: tfsec . --minimum-severity HIGH

      - name: SBOM Generation
        run: syft myapp:${{ github.sha }} -o cyclonedx-json > sbom.json
```

### Rules
- Pin all third-party GitHub Actions to a specific commit SHA, not a tag
```yaml
# ❌ Bad — tag can be moved
uses: actions/checkout@v4

# ✅ Good — pinned to immutable SHA
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
```
- Never print secrets in CI logs — use `::add-mask::` for dynamic secrets
- Use OIDC (short-lived tokens) for cloud auth — never store long-lived cloud credentials in CI
- Protect main branch with required PR reviews and status checks
- Never allow direct pushes to main/production branches
- Separate deployment credentials per environment (dev/staging/prod)
- Store artifacts in an immutable artifact registry with integrity verification
- Run pipeline in ephemeral, isolated environments

---

## Rule 54 — Browser Storage Security

**Applies to:** Any web application using cookies, localStorage, sessionStorage, IndexedDB

### ✅ Storage Security Rules

```javascript
// ❌ Bad — tokens in localStorage are accessible to any JS (XSS risk)
localStorage.setItem("access_token", token);
localStorage.setItem("user_id", userId);

// ✅ Good — use HttpOnly cookies for auth tokens
// Set via server response headers — not JS
res.cookie("access_token", token, {
  httpOnly: true,   // JS cannot read this
  secure: true,     // HTTPS only
  sameSite: "Strict",
  maxAge: 15 * 60 * 1000
});

// ✅ OK — localStorage is acceptable for non-sensitive preferences
localStorage.setItem("theme", "dark");
localStorage.setItem("language", "en");
```

### Storage Type Comparison

| Storage | Accessible to JS | Sent in requests | Use for |
|---------|-----------------|------------------|---------|
| `HttpOnly` cookie | ❌ No | ✅ Auto | Auth tokens |
| Regular cookie | ✅ Yes | ✅ Auto | Non-sensitive prefs |
| `localStorage` | ✅ Yes | ❌ Manual | Non-sensitive data only |
| `sessionStorage` | ✅ Yes | ❌ Manual | Temporary, non-sensitive |
| `IndexedDB` | ✅ Yes | ❌ Manual | Client-side data, not secrets |

### Rules
- Never store auth tokens, JWTs, session IDs, or API keys in `localStorage` or `sessionStorage`
- Never store PII in browser storage without encryption
- Clear all sensitive browser storage on logout
- Implement `Clear-Site-Data: "cookies", "storage"` header on logout endpoint
- `IndexedDB` data persists across sessions — audit what is stored

---

## Rule 55 — Iframe & Third-Party Widget Security

**Applies to:** Any page embedding iframes or third-party widgets

### ✅ Secure Iframe Configuration
```html
<!-- Sandbox iframes with minimal permissions -->
<iframe
  src="https://trusted-widget.example.com"
  sandbox="allow-scripts allow-same-origin"
  allow="camera 'none'; microphone 'none'; geolocation 'none'"
  referrerpolicy="no-referrer"
  loading="lazy"
></iframe>
```

### Rules
- Always use the `sandbox` attribute on third-party iframes
- Never use `sandbox="allow-same-origin allow-scripts"` together without strong justification — this combination defeats sandboxing
- Use `allow` attribute to restrict iframe access to browser APIs (camera, geolocation, payment)
- Use CSP `frame-src` directive to restrict which origins can be framed
- Never embed payment forms or sensitive forms inside iframes you don't control
- Audit all third-party scripts — a compromised CDN script can steal all form data (Magecart attacks)
- Use SRI (Subresource Integrity) for all third-party scripts

---

## Rule 56 — PostMessage Security

**Applies to:** Any app using `window.postMessage` for cross-origin communication

### ❌ Bad
```javascript
// Receiver — accepts messages from any origin
window.addEventListener("message", (event) => {
  eval(event.data);         // ⚠️ Never eval postMessage data
  document.body.innerHTML = event.data;  // ⚠️ XSS
});

// Sender — broadcasts to any origin
iframe.contentWindow.postMessage(sensitiveData, "*");
```

### ✅ Good
```javascript
// Receiver — always validate origin
const TRUSTED_ORIGINS = ["https://yourdomain.com", "https://app.yourdomain.com"];

window.addEventListener("message", (event) => {
  if (!TRUSTED_ORIGINS.includes(event.origin)) {
    console.warn("Rejected message from untrusted origin:", event.origin);
    return;
  }
  // Validate message structure
  if (typeof event.data !== "object" || event.data === null) return;
  const { type, payload } = event.data;
  // Handle specific, expected message types only
  if (type === "THEME_CHANGE") updateTheme(payload);
});

// Sender — always specify target origin explicitly
iframe.contentWindow.postMessage(data, "https://trusted-iframe.example.com");
```

### Rules
- Always validate `event.origin` before processing postMessage data
- Always specify target origin when sending — never use `"*"` for sensitive data
- Never execute or eval postMessage data
- Validate message schema/type before acting on it
- Never send auth tokens, passwords, or PII via postMessage

---

## Rule 57 — Service Worker Security

**Applies to:** Any Progressive Web App (PWA) using Service Workers

### ✅ Service Worker Security Rules

```javascript
// service-worker.js — only cache safe, public resources
const CACHE_ALLOWLIST = [
  "/",
  "/static/css/main.css",
  "/static/js/main.js",
  "/icons/logo.png"
];

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache authenticated API responses
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Never cache requests with Authorization headers
  if (event.request.headers.has("Authorization")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Only cache resources in the allowlist
  if (!CACHE_ALLOWLIST.includes(url.pathname)) {
    event.respondWith(fetch(event.request));
    return;
  }
});
```

### Rules
- Scope service workers to the minimum required path (`/app/` not `/`)
- Never cache responses containing auth tokens, session cookies, or personal data
- Serve service worker files with `Cache-Control: no-cache` so updates are picked up immediately
- Use HTTPS exclusively — service workers cannot be registered over HTTP
- Audit service worker logic regularly — a compromised SW can intercept all network requests
- Implement a versioned cache-busting strategy to invalidate stale service workers

---

## Rule 58 — WebAssembly Security

**Applies to:** Any app using WebAssembly (WASM) modules

### ✅ WebAssembly Security Rules
- **Validate WASM sources** — only load WASM modules from trusted origins with SRI hashes
- **Sandbox execution** — WASM runs in a sandbox, but can still call imported JS functions
- **Audit JS-WASM interface** — every function imported from JS into WASM is an attack surface
- **Limit memory** — set explicit memory limits on WASM modules to prevent memory exhaustion
- **Never execute user-supplied WASM** — treat user-provided `.wasm` files as executable code

```javascript
// ✅ Load WASM with integrity check
const response = await fetch("/module.wasm", {
  integrity: "sha384-abc123..."  // SRI hash
});
const buffer = await response.arrayBuffer();
const { instance } = await WebAssembly.instantiate(buffer, importObject);
```

### Rules
- Treat WASM binary files as code — apply the same supply chain security as JS dependencies
- Don't use WASM to "hide" security-sensitive logic — it can be decompiled
- Monitor WASM memory usage in production — unusual spikes may indicate exploitation

---

## Rule 59 — DNS Rebinding Attacks

**Applies to:** Any service accessible on localhost or internal networks

### What It Is
DNS rebinding allows attackers to make a victim's browser act as a proxy to attack internal services. An attacker's domain resolves to the attacker's server first, then rebinds to `127.0.0.1` after the page loads — bypassing the same-origin policy.

### ✅ Prevention
```javascript
// Always validate the Host header for services binding to localhost or internal IPs
app.use((req, res, next) => {
  const allowedHosts = [
    "yourdomain.com",
    "www.yourdomain.com",
    "localhost",       // Only if this is a local dev server
    "127.0.0.1"        // Only if this is a local dev server
  ];
  if (!allowedHosts.includes(req.headers.host?.split(":")[0])) {
    return res.status(400).send("Invalid Host header");
  }
  next();
});
```

### Rules
- Validate the `Host` header on all services exposed on localhost or internal IPs
- Use DNS-over-HTTPS (DoH) or DNSSEC to reduce DNS spoofing risk
- For local dev tools and admin UIs (Kubernetes dashboard, Redis Commander, etc.) — bind to `127.0.0.1` and require auth, or use a VPN/SSH tunnel
- Implement Private Network Access (PNA) headers to prevent browsers from making requests to private IP ranges from public pages

---

## Rule 60 — Insecure Randomness in UUIDs

**Applies to:** Any app generating IDs, tokens, or identifiers

### ❌ Bad
```javascript
// UUID v1 — timestamp-based, partially predictable
import { v1 as uuidv1 } from "uuid";
const id = uuidv1();  // Encodes MAC address and timestamp — guessable

// UUID v3/v5 — deterministic, derived from a namespace + name
const id = uuidv5("user@example.com", MY_NAMESPACE);  // Reproducible = predictable
```

### ✅ Good
```javascript
// UUID v4 — cryptographically random
import { v4 as uuidv4 } from "uuid";
const id = uuidv4();  // Cryptographically random — safe for resource IDs

// Or use crypto.randomUUID() (built-in Node.js 14.17+)
const id = crypto.randomUUID();
```

### Rules
- Use UUID v4 (random) for all resource identifiers (user IDs, order IDs, session IDs)
- Never use UUID v1 for security-sensitive identifiers — the timestamp component leaks timing information
- Never use UUID v3 or v5 as tokens — they are deterministic and predictable
- For tokens specifically (password reset, API keys), prefer `crypto.randomBytes(32).toString("hex")` — longer entropy than UUID v4

---

## Rule 61 — Uncontrolled Resource Consumption

**Applies to:** Any service that processes user-supplied data or runs computations

### ✅ Enforce Resource Limits
```javascript
// Request body size limit
import express from "express";
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ limit: "100kb", extended: false }));

// Timeout on all requests
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({ error: "Request timeout" });
  });
  next();
});
```

```python
# Limit nested/recursive data structures
import sys
sys.setrecursionlimit(100)  # Prevent stack overflow from deeply nested JSON

# Limit JSON parsing depth
import json
def safe_json_loads(data: str, max_depth: int = 10):
    obj = json.loads(data)
    def check_depth(obj, depth=0):
        if depth > max_depth:
            raise ValueError("JSON nesting too deep")
        if isinstance(obj, dict):
            for v in obj.values():
                check_depth(v, depth + 1)
        elif isinstance(obj, list):
            for item in obj:
                check_depth(item, depth + 1)
    check_depth(obj)
    return obj
```

### Rules
- Set maximum request body size limits on all endpoints
- Set request timeouts on all inbound and outbound connections
- Limit JSON/XML nesting depth to prevent stack overflow (billion laughs attack)
- Limit array/collection sizes in user-supplied data
- Set database query timeouts and result set size limits
- Rate-limit CPU-intensive operations (image resizing, report generation, search)
- Set maximum zip extraction size (zip bomb protection — limit to 50x compression ratio)
- Monitor memory and CPU per request; kill runaway requests

---

## Rule 62 — Integer Overflow & Underflow

**Applies to:** Financial calculations, counters, array indices, any arithmetic on user-supplied numbers

### ❌ Bad
```javascript
// JavaScript — all numbers are 64-bit floats; integers lose precision above 2^53
const price = req.body.price * req.body.quantity;  // No bounds check
const newBalance = user.balance + depositAmount;    // Could be manipulated
```

### ✅ Good
```javascript
import Decimal from "decimal.js";

// Use arbitrary-precision decimal for financial math
const price = new Decimal(req.body.price);
const quantity = new Decimal(req.body.quantity);

if (price.lte(0)) throw new Error("Price must be positive");
if (quantity.lte(0) || quantity.gt(10000)) throw new Error("Invalid quantity");

const total = price.mul(quantity);
if (total.gt(new Decimal("1000000"))) throw new Error("Order total exceeds maximum");
```

```python
from decimal import Decimal, InvalidOperation

MAX_AMOUNT = Decimal("1000000.00")
MIN_AMOUNT = Decimal("0.01")

try:
    amount = Decimal(str(user_input))
except InvalidOperation:
    raise ValueError("Invalid amount")

if amount < MIN_AMOUNT or amount > MAX_AMOUNT:
    raise ValueError(f"Amount must be between {MIN_AMOUNT} and {MAX_AMOUNT}")
```

### Rules
- Never use floating-point arithmetic for financial calculations — use `Decimal` or integer cents
- Always validate numeric ranges before arithmetic (min, max, positive-only)
- In C/C++: check for overflow before arithmetic operations; use `__builtin_add_overflow`
- Use `BigInt` (JS) or `int64` for large integer operations
- Never use user-supplied values directly as array indices without bounds checking

---

## Rule 63 — Type Juggling & Loose Comparison

**Applies to:** PHP, JavaScript, and any dynamically-typed language

### ❌ Bad (PHP)
```php
// PHP loose comparison — "0e462097431906509019562988736854" == "0" is TRUE (scientific notation)
if ($_GET['token'] == $stored_token) {  // Type juggling vulnerability
    grant_access();
}

// PHP — array bypass
if ($_POST['password'] == true) {  // Arrays are truthy
    // Attacker sends: password[]=anything
}
```

### ✅ Good (PHP)
```php
// Always use strict comparison ===
if ($_GET['token'] === $stored_token) {
    grant_access();
}

// Validate type before comparison
if (!is_string($_POST['password'])) {
    die("Invalid input");
}
```

### ❌ Bad (JavaScript)
```javascript
if (req.body.role == "admin") { }   // "0" == false == null are all true in some comparisons
if (req.body.count == 0) { }        // "" == 0 is true
```

### ✅ Good (JavaScript)
```javascript
if (req.body.role === "admin") { }   // Strict equality — checks type AND value
if (req.body.count === 0) { }
if (typeof req.body.count !== "number") throw new Error("Invalid type");
```

### Rules
- Always use strict equality (`===` in JS/PHP) for security-sensitive comparisons
- Validate the type of user input before using it in any comparison or computation
- In PHP: use `===` for all comparisons involving tokens, passwords, and session data
- Never compare a hash to user input using `==` in PHP (type juggling on hash strings)

---

## Rule 64 — Feature Flag & A/B Test Security

**Applies to:** Any app using feature flags, A/B testing, or configuration toggles

### ✅ Rules
```javascript
// ❌ Bad — feature flag state controllable by user
const enableAdminPanel = req.cookies.show_admin === "true";

// ✅ Good — feature flags from server-side config only
import { FeatureFlags } from "./config/feature-flags";
const enableAdminPanel = FeatureFlags.get("admin_panel", { userId: req.user.id });
```

### Rules
- Never evaluate feature flags from user-controlled inputs (cookies, query params, headers)
- Store feature flag configurations server-side (LaunchDarkly, Unleash, custom config service)
- Apply authorization checks independently of feature flags — a hidden feature is not a secured feature
- Audit feature flag changes — they can silently enable or disable security controls
- Do not use feature flags to hide security-critical functionality; use proper RBAC instead
- Never ship credentials or secret keys inside feature flag payloads

---

## Rule 65 — API Key Scope & Expiry

**Applies to:** Any app that issues or uses API keys

### ✅ API Key Best Practices
```javascript
import crypto from "crypto";

// Generate API key with scope and expiry
async function createApiKey(userId, scope, expiresInDays) {
  const key = `ak_${crypto.randomBytes(32).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");

  await ApiKey.create({
    userId,
    keyHash,          // Store only the hash — never the raw key
    scope,            // e.g., ["read:orders", "write:products"]
    expiresAt: new Date(Date.now() + expiresInDays * 86400 * 1000),
    lastUsedAt: null,
    isRevoked: false
  });

  return key;  // Return raw key once — never retrievable again
}

// Validate API key on each request
async function validateApiKey(rawKey) {
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const record = await ApiKey.findOne({
    keyHash,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });
  if (!record) throw new Error("Invalid or expired API key");
  await ApiKey.updateOne({ _id: record._id }, { lastUsedAt: new Date() });
  return record;
}
```

### Rules
- Generate API keys with cryptographically secure random bytes
- Store only a hash of the API key — never the raw key value in the database
- Scope every API key to minimum required permissions
- Set expiry on all API keys — no indefinite keys for production integrations
- Allow key revocation at any time
- Show the raw key only once (at creation) — make this explicit in the UI
- Prefix API keys with a recognizable prefix (`ak_`, `sk_`) to enable secret scanning
- Log API key usage with timestamps and IP addresses for audit

---

## Rule 66 — Dependency Confusion Attack

**Applies to:** Any project using npm, pip, RubyGems, or similar package managers

### What It Is
An attacker publishes a malicious public package with the same name as your private internal package. If your package manager searches public registries first, it installs the attacker's package instead of yours.

### ✅ Prevention
```bash
# npm — scope all private packages under your org name
# @mycompany/internal-utils  (scoped — only resolves to your org's private registry)
# NOT: internal-utils  (unscoped — attackers can publish this on npm)
```

```ini
# .npmrc — configure registry priority
@mycompany:registry=https://npm.mycompany.internal/
always-auth=true
```

```toml
# pip — use --index-url or --extra-index-url with caution
# In requirements.txt, pin exact versions and hashes
internal-package==1.2.3 --hash=sha256:abc123...
```

### Rules
- Scope all private npm packages under a company namespace (`@company/package`)
- Configure package managers to prefer private registry for scoped packages
- Use hash pinning (`--require-hashes` in pip) for all critical dependencies
- Register your internal package names on public registries (even as empty/placeholder packages) to prevent squatting
- Audit new package installations — alert if a previously-internal package is resolved from a public registry
- Enable `npm audit signatures` to verify npm package signatures

---

## Rule 67 — Software Composition Analysis (SCA)

**Applies to:** All projects with third-party dependencies

### ✅ SCA Tools & Process
```yaml
# GitHub Actions — automated SCA on every PR
- name: Snyk SCA Scan
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=high

- name: OWASP Dependency Check
  uses: dependency-check/Dependency-Check_Action@main
  with:
    project: "MyApp"
    path: "."
    format: "HTML"
    args: "--failOnCVSS 7"
```

### Rules
- Run SCA on every pull request — block merges with HIGH/CRITICAL CVEs
- Maintain an allowlist of known-acceptable vulnerabilities with documented justification
- Review and act on Dependabot alerts within SLA (Critical: 24h, High: 7d, Medium: 30d)
- Generate and store an SBOM (Software Bill of Materials) with every release
- Subscribe to security advisories for your top 20 dependencies
- Track transitive (indirect) dependencies — they represent 70%+ of CVE exposure

---

## Rule 68 — Zero-Trust Network Architecture

**Applies to:** Internal services, microservices, and inter-service communication

### ✅ Zero-Trust Principles in Practice
```yaml
# Istio service mesh — mutual TLS (mTLS) between all services
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT  # All inter-service traffic requires mutual TLS
```

```javascript
// Service-to-service authentication — use short-lived tokens
// Each service request includes a service identity token

const serviceToken = await getServiceIdentityToken({
  audience: "order-service",
  expiresIn: "5m"
});

const response = await fetch("https://order-service.internal/api/orders", {
  headers: {
    Authorization: `Bearer ${serviceToken}`,
    "X-Request-ID": crypto.randomUUID()
  }
});
```

### Rules
- Never trust network location — authenticate every service-to-service call
- Use mutual TLS (mTLS) for all internal service communication
- Issue short-lived service identity certificates (SPIFFE/SPIRE)
- Implement per-service network policies — services only communicate with explicit peers
- Log all inter-service calls for distributed tracing and audit
- Apply authorization at the service mesh layer (OPA + Envoy) in addition to application-level checks
- Never use a shared secret for service authentication — use PKI or OIDC workload identity

---

## Rule 69 — Hardware Security & TPM

**Applies to:** IoT devices, embedded systems, desktop apps, and high-security server deployments

### ✅ Rules
- Use Hardware Security Modules (HSMs) or TPM chips for storing private keys on physical devices
- Never derive device identity from software-only sources (MAC address, hostname) — these are spoofable
- Implement secure boot — verify firmware/OS integrity at boot time using TPM measurements
- Use attestation tokens to prove device integrity to backend services
- Encrypt storage with keys sealed to TPM state — wiped if device is tampered
- For IoT devices: disable JTAG/debug ports in production firmware
- Implement secure firmware update with signature verification before applying updates
- Never hardcode device credentials in firmware — use per-device provisioning

---

## Rule 70 — Browser Extension Security

**Applies to:** Any Chrome/Firefox/Edge extension, or web apps that interact with extensions

### ✅ Extension Security Rules
```json
// manifest.json — request minimal permissions
{
  "manifest_version": 3,
  "permissions": ["storage"],             // ✅ Only what you need
  "host_permissions": ["https://yourdomain.com/*"],  // ✅ Scoped host permissions
  // ❌ Never: "permissions": ["<all_urls>", "webRequest", "tabs", "history", "cookies"]
}
```

```javascript
// content-script.js — never execute arbitrary strings
// ❌ Bad
eval(chrome.runtime.getMessage().code);

// ✅ Good — use message passing with validated, structured messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return;  // Only accept from own extension
  if (message.type !== "KNOWN_ACTION") return;
  handleKnownAction(message.payload);
});
```

### Rules
- Use Manifest V3 — MV2 is deprecated and less secure
- Request the minimum set of permissions — avoid `<all_urls>`, `webRequest`, `nativeMessaging` unless critical
- Implement a strict Content Security Policy in `manifest.json`
- Never inject scripts from remote URLs — bundle all scripts locally
- Validate all messages in `chrome.runtime.onMessage` — check sender identity
- Store sensitive data with `chrome.storage.session` (in-memory) rather than `chrome.storage.local` (persisted)
- Submit to official extension stores only — they run security reviews
- Sign extension releases with your developer key

---

## How to Apply This to Your Project

### Frontend (React / Vue / Angular)
```bash
npm install dompurify helmet csurf re2 validator hpp
npm install --save-dev eslint-plugin-security safe-regex
```

### Backend (Node.js / Express)
```bash
npm install helmet cors express-rate-limit csurf bcrypt jsonwebtoken express-session connect-redis hpp
npm install --save-dev npm-audit-resolver
```

### Backend (Python / FastAPI / Django)
```bash
pip install bcrypt python-jose cryptography pydantic safety lxml bleach python-multipart
```

### Mobile (React Native / Flutter)
- `react-native-keychain` / `flutter_secure_storage` for tokens
- Certificate pinning for API calls
- Disable screenshots on sensitive screens
- Biometric authentication

### Database
```sql
-- Checklist:
-- 1. App user has least privilege ✅
-- 2. Data encrypted at rest ✅
-- 3. Backups encrypted ✅
-- 4. DB in private subnet ✅
-- 5. All queries parameterized ✅
-- 6. Statement timeouts set ✅
-- 7. Audit logging enabled ✅
```

### CI/CD Pipeline Security Additions
```yaml
- name: Secret Scanning
  uses: gitleaks/gitleaks-action@v2

- name: Dependency Audit
  run: npm audit --audit-level=moderate

- name: SAST
  uses: github/codeql-action/analyze@v3
  with:
    languages: javascript, python

- name: Docker Image Scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: your-image:latest
    severity: HIGH,CRITICAL

- name: Infrastructure Scan
  run: tfsec . --minimum-severity HIGH

- name: SBOM Generation
  run: syft your-image:latest -o cyclonedx-json > sbom.json

- name: SCA Scan
  uses: snyk/actions/node@master
  with:
    args: --severity-threshold=high
```

---

## Master Security Checklist

### Secrets & Configuration
- [ ] No secrets hardcoded in code, comments, or config files
- [ ] `.env` in `.gitignore`, `.env.example` committed
- [ ] Environment variables validated at startup
- [ ] Secrets stored in a secrets manager in production
- [ ] Secrets rotation schedule documented and automated
- [ ] API keys scoped to minimum permissions and have expiry

### Input & Output
- [ ] All user inputs validated: type, length, format, range
- [ ] SQL uses parameterized queries or ORM only
- [ ] NoSQL inputs typed and validated before querying
- [ ] HTML output escaped or sanitized (DOMPurify)
- [ ] File uploads: type, size, name, content validated
- [ ] No user input used in shell commands without strict sanitization
- [ ] URLs from users validated before server-side fetching (SSRF)
- [ ] Redirects validated against a whitelist
- [ ] XML processing disables external entities
- [ ] Template engine never renders user input AS a template (SSTI prevention)
- [ ] LDAP/XPath queries use parameterized values
- [ ] HTTP response headers never contain unvalidated user input
- [ ] HTTP Parameter Pollution mitigated
- [ ] JSON nesting depth limited

### Authentication & Authorization
- [ ] All endpoints require authentication (unless explicitly public)
- [ ] All state-changing actions check authorization
- [ ] Ownership enforced (IDOR prevention)
- [ ] Passwords hashed with bcrypt/argon2
- [ ] MFA available (required for admin accounts)
- [ ] JWT algorithm explicitly whitelisted
- [ ] Tokens short-lived and validated server-side
- [ ] Session regenerated after login
- [ ] Session destroyed on logout
- [ ] No mass assignment vulnerabilities (allowlist fields explicitly)

### Cryptography
- [ ] Only approved algorithms (AES-256-GCM, RSA-2048+, SHA-256+)
- [ ] Passwords use bcrypt/argon2 (not SHA-family)
- [ ] Cryptographically secure RNG for all tokens, nonces, OTPs
- [ ] Constant-time comparison for token/secret comparisons
- [ ] Nonces/IVs are unique per operation
- [ ] UUID v4 (not v1) for resource identifiers
- [ ] No floating-point math for financial calculations

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced with HSTS preload
- [ ] TLS 1.2+ only — TLS 1.0/1.1, SSL disabled
- [ ] Weak ciphers disabled (RC4, DES, NULL)
- [ ] No sensitive data in logs, errors, URLs, or analytics
- [ ] PII minimized and retention period defined
- [ ] No auth tokens in localStorage (use HttpOnly cookies)
- [ ] Clear-Site-Data header on logout

### Frontend Security
- [ ] CSP header configured and strict
- [ ] X-Frame-Options: DENY set
- [ ] X-Content-Type-Options: nosniff set
- [ ] SRI hashes on external scripts/styles
- [ ] rel="noopener noreferrer" on external links
- [ ] No eval() or innerHTML with user data
- [ ] postMessage origin validated before processing
- [ ] Iframes sandboxed with minimal permissions
- [ ] Service worker does not cache authenticated responses

### API & Network
- [ ] CORS whitelist configured
- [ ] Server version/tech stack headers removed
- [ ] HTTP TRACE/CONNECT methods disabled
- [ ] Webhook signatures verified
- [ ] Mass assignment prevented
- [ ] API returns minimal data
- [ ] HPP (HTTP Parameter Pollution) mitigated
- [ ] Host header validated

### Sessions
- [ ] Session IDs not in URLs
- [ ] Absolute and idle session timeouts configured
- [ ] Sessions stored in Redis/DB (not in-memory)

### Dependencies & Infrastructure
- [ ] `npm audit` / `safety check` passes (no HIGH/CRITICAL unresolved)
- [ ] Lockfile committed and used in CI
- [ ] CI Actions pinned to commit SHAs
- [ ] Docker container runs as non-root
- [ ] Docker image scanned for vulnerabilities
- [ ] No :latest image tags in production
- [ ] Rate limiting on auth and sensitive endpoints
- [ ] CAPTCHA on public forms
- [ ] Security headers set (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] Admin interfaces not publicly accessible
- [ ] Kubernetes pods run with restricted security context
- [ ] Default-deny network policies in Kubernetes
- [ ] Dependency confusion risk mitigated (scoped packages, registry config)
- [ ] SBOM generated for each release

### Business Logic
- [ ] Prices recalculated server-side
- [ ] Quantities/amounts validated as positive
- [ ] Integer/decimal bounds checked for all numeric inputs
- [ ] Race conditions handled with atomic DB operations
- [ ] Workflow state machine enforced server-side
- [ ] Coupon/promo codes: single-use and per-user limits enforced
- [ ] Feature flags not controllable by user input

### Monitoring & Response
- [ ] Centralized structured logging configured
- [ ] Security events generate alerts
- [ ] Incident response plan documented
- [ ] Log retention policy set and enforced
- [ ] Certificate expiry monitoring active
- [ ] API key usage logged and audited

### AI/LLM (if applicable)
- [ ] User input sanitized before adding to prompt
- [ ] System prompt separated from user prompt
- [ ] max_tokens enforced
- [ ] Per-user usage limits in place
- [ ] LLM output validated before rendering
- [ ] Prompt injection patterns detected and blocked
- [ ] RAG retrieval respects user authorization

---

## Prompt: Tell Any AI Agent This Ruleset

Copy-paste this into the system prompt of any AI coding assistant:

```
You are a security-first software engineer. Before writing any code, apply these non-negotiable security rules. Flag any violation with: // ⚠️ SECURITY: [issue and fix]

SECRETS: Never hardcode API keys, passwords, or tokens. Use environment variables. Validate secrets exist at startup. Never put secrets in URLs, client-side code, or comments.

INPUT VALIDATION: Every user-supplied input must be validated server-side: type, length, format, and range. Reject invalid inputs at the API boundary. Normalize unicode before validation. Limit JSON nesting depth.

SQL SECURITY: Always use parameterized queries or ORM. Never concatenate user input into SQL strings. Apply the same rule to NoSQL queries, LDAP filters, and XPath expressions.

AUTHENTICATION: Passwords must be hashed with bcrypt or argon2id. JWTs must whitelist allowed algorithms (never allow 'none'). Sessions use HttpOnly + Secure + SameSite=Strict cookie flags. Regenerate session ID after login. Invalidate session on logout.

AUTHORIZATION: Every endpoint must check both authentication AND that the authenticated user owns or has permission for the requested resource (prevent IDOR). Re-validate at every workflow step. Use explicit field allowlists to prevent mass assignment.

CRYPTOGRAPHY: Use AES-256-GCM for encryption. Use SHA-256+ for hashing (not passwords). Use bcrypt/argon2 for passwords. Use secrets.token_urlsafe / crypto.randomBytes for tokens — never Math.random() or random.randint(). Use constant-time comparison for all secret/token comparisons. Use UUID v4 for resource identifiers. Use Decimal arithmetic for financial calculations.

OUTPUT SAFETY: Never expose stack traces, internal errors, or sensitive fields to end users. Use generic error messages with error IDs. Strip server version/framework headers.

SSRF: Never fetch user-supplied URLs server-side without validating the resolved IP is not private, loopback, or cloud metadata range (169.254.0.0/16).

OPEN REDIRECT: Never redirect to user-supplied URLs without validating against a whitelist of allowed hosts.

COMMAND INJECTION: Never use shell=True / shell:true with user input. Always use argument arrays. Prefer libraries over shell commands.

PATH TRAVERSAL: Always resolve paths with realpath and verify they remain inside the expected base directory.

TEMPLATE INJECTION (SSTI): Never render user-supplied input AS a template string. User input is data passed INTO templates — not the template itself.

XML/XXE: Disable external entity resolution and DTD loading in all XML parsers.

DESERIALIZATION: Never deserialize untrusted data with pickle, Java native serialization, or PHP unserialize. Use JSON with schema validation.

HTTP PARAMETER POLLUTION: Use hpp middleware or equivalent. Always extract a single scalar value from parameters before using them in security decisions.

HTTP HEADER INJECTION: Strip CR, LF, and null bytes from any user input written into HTTP response headers.

REQUEST SMUGGLING: Use HTTP/2 end-to-end. Configure proxies to reject requests with ambiguous Content-Length + Transfer-Encoding headers.

POSTMESSAGE: Always validate event.origin. Never use "*" as target origin for sensitive data. Never eval postMessage data.

DEPENDENCIES: Pin all dependency versions to commit SHAs in CI. Run npm audit or safety check. Scope private packages to prevent dependency confusion. Generate SBOM for each release.

LOGGING: Never log passwords, tokens, PII, or secrets. Use structured logging with field redaction.

HEADERS: Always set: Content-Security-Policy, Strict-Transport-Security, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy.

RATE LIMITING: All auth endpoints must have rate limiting and account lockout after 5 failed attempts.

ENCRYPTION: Data in transit uses HTTPS/TLS 1.2+. Disable TLS 1.0/1.1 and weak ciphers. Sensitive data at rest uses AES-256-GCM with unique nonces.

SESSIONS: Store sessions server-side (Redis). Set absolute and idle timeouts. Never put session IDs in URLs.

BUSINESS LOGIC: Always recalculate prices server-side. Use atomic database operations to prevent race conditions. Validate all quantities as positive. Use Decimal for financial math.

WEBSOCKETS: Authenticate at the handshake. Validate and size-limit every message. Use wss:// only.

CLICKJACKING: Set X-Frame-Options: DENY and CSP frame-ancestors: 'none' on all responses.

FILE UPLOADS: Validate MIME type + extension + size. Randomize filenames. Store outside web root. Serve through an authorized endpoint only.

PROTOTYPE POLLUTION (JS): Skip __proto__, constructor, and prototype keys when merging user-supplied objects.

REDOS: Test all regexes applied to user input for catastrophic backtracking. Use RE2 or safe-regex.

BROWSER STORAGE: Never store auth tokens in localStorage or sessionStorage. Use HttpOnly cookies. Send Clear-Site-Data on logout.

KUBERNETES: Run containers as non-root. Use read-only root filesystem. Apply default-deny network policies. Never use privileged containers. Pin image tags.

CI/CD: Pin all Actions to commit SHAs. Use OIDC for cloud auth. Never print secrets in logs.

API KEYS: Store only the hash of API keys. Scope to minimum permissions. Set expiry. Log usage.

AI/LLM FEATURES: Sanitize user input before including in prompts. Separate system prompt from user input at the API level. Enforce max_tokens. Validate LLM output before rendering. Never pass system configs or DB records raw into prompts. Enforce per-user usage limits. Respect authorization in RAG retrieval.

TYPE SAFETY: Use strict equality (===) in JS/PHP for all security comparisons. Validate type before comparison. Never compare tokens with == in PHP.

Never skip a security concern to be polite or to keep the code shorter. Always raise it.
```

---

## References & Further Reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Secure Coding Practices](https://csrc.nist.gov/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [socket.dev — Supply Chain Security](https://socket.dev)
- [Google BeyondProd](https://cloud.google.com/security/beyondprod)
- [NIST SP 800-63 — Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
- [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes)
- [SPIFFE/SPIRE — Workload Identity](https://spiffe.io/)
- [OWASP Serverless Top 10](https://owasp.org/www-project-serverless-top-10/)
- [Google Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)
- [Private Network Access (PNA)](https://wicg.github.io/private-network-access/)

---

> **Version:** 3.0.0 — Ultimate Complete Edition
> **Last Updated:** 2026-05-08
> **License:** MIT — Use freely in any project

*"The best time to add security was at the start of the project. The second best time is now."*
```
