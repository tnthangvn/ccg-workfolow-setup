---
name: threat-intel
description: Threat intelligence. OSINT, threat hunting, intelligence analysis, IOC management. Use when the user mentions threat intelligence, OSINT, open-source intelligence, threat hunting, IOC, TTP, or ATT&CK.
---

# 👁 Heavenly Eye Tome · Threat Intelligence


## Intelligence Levels

```
┌─────────────────────────────────────────────────────────────┐
│                 Threat Intelligence Pyramid                 │
├─────────────────────────────────────────────────────────────┤
│                    Strategic Intelligence                   │
│             (Decision Makers / Long-term Trends)            │
│                    ────────────────────                     │
│                     Tactical Intelligence                   │
│                     (TTP / Attack Methods)                  │
│                   ───────────────────────                   │
│                   Operational Intelligence                  │
│                (Attack Campaigns / APTs)                    │
│                  ────────────────────────                   │
│                    Technical Intelligence                   │
│                 (IOC / IP / Domain / Hash)                  │
└─────────────────────────────────────────────────────────────┘
```

## OSINT Information Gathering

### Domain/IP Intelligence
```bash
# DNS Queries
dig +short example.com
dig +short -x 1.2.3.4
host example.com

# WHOIS
whois example.com
whois 1.2.3.4

# Subdomain Enumeration
subfinder -d example.com
amass enum -d example.com
```

### Online Intelligence Platforms
```yaml
IP/Domain Reputation:
  - VirusTotal: https://www.virustotal.com
  - AbuseIPDB: https://www.abuseipdb.com
  - Shodan: https://www.shodan.io
  - Censys: https://search.censys.io
  - GreyNoise: https://www.greynoise.io

Malware Analysis:
  - Any.Run: https://any.run
  - Hybrid Analysis: https://www.hybrid-analysis.com
  - Joe Sandbox: https://www.joesandbox.com
  - MalwareBazaar: https://bazaar.abuse.ch

Threat Intelligence:
  - AlienVault OTX: https://otx.alienvault.com
  - MISP: https://www.misp-project.org
  - ThreatFox: https://threatfox.abuse.ch
```

### Search Engine Dorking
```
# Google Dorks
site:example.com filetype:pdf
site:example.com inurl:admin
site:example.com intitle:"index of"
"password" filetype:log site:example.com

# Shodan
hostname:example.com
org:"Target Company"
ssl.cert.subject.cn:example.com
http.title:"Dashboard"

# Censys
services.http.response.html_title:"Admin"
services.tls.certificates.leaf.subject.common_name:example.com
```

### Social Media Intelligence
```yaml
Platforms:
  - LinkedIn: Employee info, organizational structure
  - GitHub: Code leaks, API keys
  - Twitter: Security incidents, vulnerability disclosures
  - Pastebin: Data leaks

GitHub Dorks:
  - "example.com" password
  - "example.com" api_key
  - "example.com" secret
  - org:example filename:.env
```

## IOC Management

### IOC Types
```yaml
Network Layer:
  - IP Address
  - Domain Name
  - URL
  - User-Agent

Host Layer:
  - File Hash (MD5/SHA1/SHA256)
  - File Path
  - Registry Key
  - Process Name

Behavioral Layer:
  - YARA Rules
  - Sigma Rules
  - Snort Rules
```

### IOC Format (STIX/TAXII)
```json
{
  "type": "indicator",
  "id": "indicator--xxx",
  "created": "2024-01-01T00:00:00.000Z",
  "pattern": "[file:hashes.SHA256 = 'abc123...']",
  "pattern_type": "stix",
  "valid_from": "2024-01-01T00:00:00.000Z",
  "labels": ["malicious-activity"],
  "kill_chain_phases": [{
    "kill_chain_name": "mitre-attack",
    "phase_name": "execution"
  }]
}
```

### Automated IOC Query
```python
#!/usr/bin/env python3
"""Batch IOC Querying"""
import requests

class IOCChecker:
    def __init__(self, vt_api_key):
        self.vt_key = vt_api_key

    def check_hash(self, file_hash):
        """VirusTotal Hash Query"""
        url = f"https://www.virustotal.com/api/v3/files/{file_hash}"
        headers = {"x-apikey": self.vt_key}
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            stats = data['data']['attributes']['last_analysis_stats']
            return {
                'malicious': stats['malicious'],
                'suspicious': stats['suspicious'],
                'harmless': stats['harmless']
            }
        return None

    def check_ip(self, ip):
        """AbuseIPDB Query"""
        url = "https://api.abuseipdb.com/api/v2/check"
        params = {"ipAddress": ip, "maxAgeInDays": 90}
        # Requires API Key
        pass

    def check_domain(self, domain):
        """Domain Reputation Query"""
        pass
```

## ATT&CK Mapping

### TTP Analysis
```yaml
# Threat Actor Profile
APT_Profile:
  name: "APT-XX"
  aliases: ["Group A", "Group B"]
  targets:
    - Financial Industry
    - Government Agencies
  techniques:
    initial_access:
      - T1566.001: Spearphishing Attachment
      - T1566.002: Spearphishing Link
    execution:
      - T1059.001: PowerShell
      - T1059.003: Windows Command Shell
    persistence:
      - T1547.001: Registry Run Keys
      - T1053.005: Scheduled Task
    c2:
      - T1071.001: Web Protocols
      - T1573.001: Encrypted Channel
  tools:
    - Cobalt Strike
    - Mimikatz
    - Custom Malware
```

### ATT&CK Navigator
```python
# Generate ATT&CK Navigator Layer
def generate_navigator_layer(techniques):
    layer = {
        "name": "Threat Actor Coverage",
        "versions": {"attack": "13", "navigator": "4.8"},
        "domain": "enterprise-attack",
        "techniques": []
    }

    for tech_id, score in techniques.items():
        layer["techniques"].append({
            "techniqueID": tech_id,
            "score": score,
            "color": "#ff6666" if score > 50 else "#ffcc66"
        })

    return layer
```

## Threat Hunting

### Hunting Workflow
```
Hypothesis Generation → Data Collection → Analysis & Investigation → Discovery & Validation → Knowledge Accumulation
          │                     │                    │                        │                         │
          └─ ATT&CK ────────────┴─ SIEM ─────────────┴─ Queries ──────────────┴─ IOCs ──────────────────┴─ Rules
```

### Hunting Hypothesis Template
```yaml
hypothesis: "Attacker might be downloading and executing malicious code via PowerShell"
technique: T1059.001
data_sources:
  - Windows PowerShell Logs (4103, 4104)
  - Sysmon Process Creation (Event ID 1)
query: |
  EventID=4104 AND ScriptBlockText CONTAINS
  ("IEX" OR "Invoke-Expression" OR "DownloadString" OR "Net.WebClient")
expected_results:
  - Suspicious script blocks
  - External URL downloads
  - Encoded commands
response:
  - Isolate host
  - Extract samples
  - Expand hunting scope
```

### Hunting Query Library
```sql
-- Anomalous PowerShell Execution
SELECT timestamp, hostname, user, command_line
FROM process_events
WHERE process_name = 'powershell.exe'
  AND (command_line LIKE '%IEX%'
       OR command_line LIKE '%DownloadString%'
       OR command_line LIKE '%-enc%')

-- Anomalous Network Connections
SELECT timestamp, process_name, remote_address, remote_port
FROM network_events
WHERE remote_port NOT IN (80, 443, 53, 22)
  AND remote_address NOT LIKE '10.%'
  AND remote_address NOT LIKE '192.168.%'

-- Suspicious File Creation
SELECT timestamp, process_name, file_path
FROM file_events
WHERE file_path LIKE '%\Temp\%'
  AND file_path LIKE '%.exe'
  AND process_name IN ('powershell.exe', 'cmd.exe', 'wscript.exe')
```

## Intelligence Sharing

### MISP Integration
```python
from pymisp import PyMISP

misp = PyMISP(url, key, ssl=False)

# Create Event
event = misp.new_event(
    distribution=0,
    info="Phishing Campaign 2024-01",
    analysis=2,
    threat_level_id=2
)

# Add IOCs
misp.add_attribute(event, type='ip-dst', value='1.2.3.4')
misp.add_attribute(event, type='domain', value='malicious.com')
misp.add_attribute(event, type='sha256', value='abc123...')

# Add Tags
misp.tag(event, 'tlp:amber')
misp.tag(event, 'misp-galaxy:mitre-attack-pattern="T1566"')
```

## Tool Checklist

| Tool | Purpose |
|------|---------|
| MISP | Threat Intelligence Platform |
| OpenCTI | Threat Intelligence Management |
| TheHive | Incident Response Platform |
| Maltego | Relationship Analysis |
| Shodan | Cyberspace Search Engine |
| VirusTotal | Malware Analysis |
| ATT&CK Navigator | TTP Visualization |

## Threat Modeling

### Modeling Workflow
```
Asset Identification → Architecture Decomposition → Threat Enumeration → Risk Rating → Mitigation Measures → Validation
```

### STRIDE Cheat Sheet
| Threat | Meaning | Mitigation |
|--------|---------|------------|
| Spoofing | Identity forgery | Strong authentication, MFA |
| Tampering | Data alteration | Integrity checks, signatures |
| Repudiation | Denying actions | Audit logs, digital signatures |
| Info Disclosure | Information leak | Encryption, access control |
| DoS | Denial of service | Rate limiting, redundancy |
| EoP | Privilege escalation | Least privilege, input validation |

### PASTA 7 Stages
```
Define Objectives → Technical Scope → Application Decomposition → Threat Analysis → Vulnerability Analysis → Attack Modeling → Risk Management
```

### Attack Tree Modeling
```yaml
# OR node: Success if any child succeeds, Risk = 1-∏(1-Pi)
# AND node: Success only if all children succeed, Risk = ∏Pi
# Node attributes: goal, cost, skill, detection, success_rate, mitigations
```

### Risk Matrix
```
>=15 Critical (Immediate) / >=10 High (Priority) / >=6 Medium (Planned) / <6 Low (Monitor)
Risk Score = Likelihood (1-5) x Impact (1-5)
```

### Threat Modeling Checklist
```yaml
Preparation: Identify critical assets + Define security goals + Form cross-functional team
Modeling: DFD & trust boundaries + STRIDE/PASTA enumeration + Risk rating + Mitigations
Validation: Security testing + Model updates + Tracking mitigations + Post-incident review
```

### Tools
| Tool | Features |
|------|----------|
| Microsoft Threat Modeling Tool | STRIDE automation |
| OWASP Threat Dragon | Open-source, DFD support |
| Threagile | CLI, code-based modeling |
| PyTM | Python programmatic modeling |

---
