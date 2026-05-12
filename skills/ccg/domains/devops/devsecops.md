---
name: devsecops
description: DevSecOps. CI/CD security, supply chain security, compliance automation. Use when the user mentions DevSecOps, CI/CD, supply chain security, SAST, or DAST.
---

# 🔧 炼器秘典 · DevSecOps


## Shift-Left Security

```
┌─────────────────────────────────────────────────────────────┐
│                    Shift-Left Security                      │
├─────────────────────────────────────────────────────────────┤
│  Plan → Code → Build → Test → Release → Deploy → Ops → Mon  │
│    │      │      │      │      │      │      │      │       │
│  Threat SAST   SCA   DAST   Sign   Config  Logs   Alert     │
│  Model  IDE    Deps  Pen    Verify Harden  Audit  Respond   │
└─────────────────────────────────────────────────────────────┘
```

## CI/CD Security

### GitHub Actions
```yaml
name: Security Pipeline

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # SAST - Static Analysis
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: p/security-audit

      # SCA - Dependency Scanning
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'

      # Secret Scanning
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2

      # Container Scanning
      - name: Build and scan image
        run: |
          docker build -t myapp:${{ github.sha }} .
          trivy image myapp:${{ github.sha }}
```

### GitLab CI
```yaml
stages:
  - test
  - security
  - build
  - deploy

sast:
  stage: security
  image: semgrep/semgrep
  script:
    - semgrep --config=p/security-audit .

dependency_scan:
  stage: security
  image: aquasec/trivy
  script:
    - trivy fs --severity HIGH,CRITICAL .

container_scan:
  stage: security
  image: aquasec/trivy
  script:
    - trivy image $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

## Security Scanning Tools

### SAST (Static Analysis)
```yaml
Tools:
  - Semgrep: Multi-language, rich rules
  - SonarQube: Enterprise-grade
  - CodeQL: GitHub native
  - Bandit: Python specific

Integration:
  - IDE Plugins
  - Pre-commit hooks
  - CI/CD pipeline
```

### SCA (Dependency Scanning)
```yaml
Tools:
  - Trivy: All-in-one scanning
  - Snyk: Commercial solution
  - OWASP Dependency-Check
  - npm audit / pip-audit

Checks:
  - Known vulnerabilities (CVE)
  - License compliance
  - Outdated dependencies
```

### DAST (Dynamic Analysis)
```yaml
Tools:
  - OWASP ZAP
  - Nuclei
  - Burp Suite

Integration:
  - Automated scanning after deployment
  - Scheduled scanning
  - PR environment scanning
```

## Supply Chain Security

### Dependency Management
```yaml
Principles:
  - Lock dependency versions
  - Update regularly
  - Review new dependencies
  - Use private registries

Tools:
  - Dependabot
  - Renovate
  - Snyk
```

### Image Security
```yaml
Principles:
  - Use official base images
  - Minimize images
  - Scan for vulnerabilities
  - Signature verification

Tools:
  - Trivy
  - Cosign (Signing)
  - Notary
```

### SBOM (Software Bill of Materials)
```bash
# Generate SBOM
syft packages dir:. -o spdx-json > sbom.json

# Scan SBOM
grype sbom:sbom.json
```

## Security Gates

```yaml
Blocking conditions:
  - Critical vulnerabilities
  - High-risk dependencies
  - Secret leakage
  - License violations

Warning conditions:
  - High vulnerabilities
  - Medium-risk dependencies
  - Code quality issues
```

## Compliance Automation

```yaml
Check items:
  - CIS Benchmark
  - PCI DSS
  - SOC 2
  - GDPR

Tools:
  - Open Policy Agent (OPA)
  - Checkov
  - Terrascan
```