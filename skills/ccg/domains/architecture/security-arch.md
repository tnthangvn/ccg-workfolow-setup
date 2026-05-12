---
name: security-arch
description: Security architecture design. Zero trust, identity authentication, threat modeling. Use when the user mentions security architecture, zero trust, IAM, identity authentication, or threat modeling.
---

# 🏗 Array Manual · Security Architecture Design


## Zero Trust Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Zero Trust Principles                     │
├─────────────────────────────────────────────────────────────┤
│  1. Never trust, always verify                               │
│  2. Least privilege access                                   │
│  3. Assume breach                                            │
│  4. Explicitly verify every request                          │
│  5. Continuous monitoring and validation                     │
└─────────────────────────────────────────────────────────────┘
```

### Core Components
```yaml
Authentication:
  - Multi-Factor Authentication (MFA)
  - Single Sign-On (SSO)
  - Certificate Authentication

Device Trust:
  - Device health checks
  - Endpoint Detection and Response (EDR)
  - Mobile Device Management (MDM)

Network Segmentation:
  - Micro-segmentation
  - Software Defined Perimeter (SDP)
  - Network Access Control

Data Protection:
  - Encryption in transit/at rest
  - Data classification
  - DLP
```

## Identity and Access Management (IAM)

### Authentication Methods
```yaml
Password Authentication:
  - Strong password policy
  - Password hashing (bcrypt/argon2)
  - Anti-brute force

Multi-Factor Authentication:
  - TOTP (Google Authenticator)
  - FIDO2/WebAuthn
  - SMS/Email verification codes

Single Sign-On:
  - SAML 2.0
  - OAuth 2.0 / OIDC
  - Kerberos
```

### Authorization Models
```yaml
RBAC (Role-Based):
  User → Role → Permissions
  Example:
    - admin: [read, write, delete]
    - editor: [read, write]
    - viewer: [read]

ABAC (Attribute-Based):
  Policy = f(Subject Attributes, Resource Attributes, Environment Attributes)
  Example:
    - Department=Finance AND Level>=3 → Access Financial Reports

PBAC (Policy-Based):
  Use policy languages to define complex rules
  Example: OPA/Rego
```

### JWT Best Practices
```yaml
Signature Algorithms:
  - Use RS256 or ES256
  - Avoid HS256 (Shared Secret)
  - Forbid none algorithm

Token Management:
  - Short-lived access tokens (15 minutes)
  - Long-lived refresh tokens (7 days)
  - Token rotation
  - Blacklist mechanism

Claims:
  - iss: Issuer
  - sub: Subject
  - aud: Audience
  - exp: Expiration Time
  - iat: Issued At
  - jti: Unique Identifier
```

## Threat Modeling

### STRIDE Model
```yaml
S - Spoofing:
  Threat: Impersonating a user identity
  Mitigation: Strong authentication, MFA

T - Tampering:
  Threat: Modifying data
  Mitigation: Integrity checks, signatures

R - Repudiation:
  Threat: Denying an action
  Mitigation: Audit logs, digital signatures

I - Information Disclosure:
  Threat: Data leakage
  Mitigation: Encryption, access controls

D - Denial of Service:
  Threat: Service unavailability
  Mitigation: Rate limiting, redundancy

E - Elevation of Privilege:
  Threat: Gaining higher privileges
  Mitigation: Least privilege, input validation
```

### Threat Modeling Process
```
1. Identify Assets
   └─ Data, Services, Infrastructure

2. Draw Data Flow Diagrams
   └─ Trust boundaries, Data flows

3. Identify Threats
   └─ Analyze using STRIDE

4. Assess Risks
   └─ Likelihood × Impact

5. Develop Mitigations
   └─ Technical controls, Process controls

6. Validate and Iterate
   └─ Penetration testing, Code auditing
```

## Security Design Principles

```yaml
Defense in Depth:
  - Multiple layers of security controls
  - Single point of failure is not fatal

Least Privilege:
  - Grant only necessary permissions
  - Regularly review permissions

Secure Defaults:
  - Default deny
  - Explicit allow

Fail Safe:
  - Deny access upon failure
  - Do not leak sensitive information

Separation of Duties:
  - Critical operations require multiple people
  - Separation of Development/Operations
```

## Security Architecture Checklist

```yaml
Authentication:
  - [ ] Implement MFA
  - [ ] Password policy
  - [ ] Session management
  - [ ] Account lockout

Authorization:
  - [ ] Least privilege
  - [ ] RBAC/ABAC
  - [ ] API authorization

Data Protection:
  - [ ] Encryption in transit (TLS)
  - [ ] Encryption at rest
  - [ ] Key management

Logging and Auditing:
  - [ ] Security event logging
  - [ ] Access logs
  - [ ] Log protection

Network:
  - [ ] Network segmentation
  - [ ] Firewall rules
  - [ ] WAF
```

## Data Security

### Data Classification
| Level | Type | Protection Measures | Example |
|------|------|----------|------|
| Public | Public | No special requirements | Product docs |
| Internal | Internal | Access control | Internal Wiki |
| Confidential | Confidential | Encryption + Auditing | Customer data |
| Restricted | Restricted | Encryption + Auditing + MFA | Keys, PII |

### Encryption Requirements
```yaml
Encryption in Transit:
  - TLS 1.2+ (Disable 1.0/1.1)
  - Recommended: TLS_AES_256_GCM_SHA384 / TLS_CHACHA20_POLY1305_SHA256
  - HSTS + Certificate Management

Encryption at Rest:
  - AES-256-GCM (Symmetric) + Separation of keys and data (KMS/Vault) + Regular rotation

Password Storage:
  - bcrypt (rounds>=12) or argon2, forbid MD5/SHA1
```

### Privacy Protection
```yaml
Data Masking: Name(Zhang**) / Phone(138****1234) / Email(z***@x.com)
Data Minimization: Only collect necessary data / Limit retention periods / Regular cleanup / Anonymization
Lifecycle: Create(Classify)→Store(Encrypt)→Use(Audit)→Share(Mask)→Archive(Compress)→Destroy(Secure Delete)
```

### Data Security Checklist
```yaml
- [ ] Data asset inventory + Sensitive data identification + Data flow mapping
- [ ] Encryption in transit + Encryption at rest + Access control + Data masking
- [ ] Access logs + Anomaly detection + DLP
```

## Compliance and Auditing

### Compliance Framework Quick Reference
| Framework | Scope | Core Requirements | Penalties |
|------|----------|----------|------|
| GDPR | EU user data | Data protection, User rights | 4% of revenue or €20M |
| SOC 2 | SaaS/Cloud services | Security, Availability, Confidentiality, Privacy | Loss of customer trust |
| HIPAA | Healthcare data | PHI protection | $50K-$1.5M/occurrence |
| PCI DSS | Payment card data | Cardholder data protection | $5K-$100K/month |

### GDPR User Rights (DSAR)
| Right | API | SLA |
|------|-----|-----|
| Right of Access | `GET /users/{id}/data-export` | 30 days |
| Right to Erasure | `DELETE /users/{id}/data` | 30 days |
| Data Portability | `GET /users/{id}/data-export?format=json` | 30 days |
| Restriction of Processing | `POST /users/{id}/restrict` | 72 hours |

### SOC 2 Key Controls
```yaml
Access Control: Mandatory MFA + RBAC + Least privilege + Quarterly review + Revoke upon departure
Change Management: PR reviews + Multi-environment deployment + Approval process + Rollback plans
Monitoring & Alerting: Security event monitoring + Anomaly login detection + Data access auditing
Incident Response: Documented IR plan + Regular drills + 72-hour notification + Post-mortem reviews
```

### Audit Log Requirements
```yaml
Must Audit: Logins/MFA/Password changes | Permission/Role changes | Sensitive data access/export/deletion | Configuration/Deployment changes
Storage: Immutability (WORM) + Encryption + Offsite backups
Retention: Security events >= 1 year / Access logs >= 90 days / Changes >= 3 years / Compliance audits >= 7 years
```

### Compliance as Code (OPA)
```rego
deny[msg] {
    input.resource_type == "aws_s3_bucket"
    input.resource.acl == "public-read"
    msg := sprintf("S3 %s must not be public", [input.resource.name])
}
```

### Compliance Checklist
```yaml
GDPR: Privacy policy + Consent management + DSAR(30 days) + Encryption + Retention policy + Breach notification(72h)
SOC2: Access control+MFA + Change management + IR plan + Vulnerability management + Security training
Auditing: Logs cover critical operations + Immutability + Compliant retention periods
```
