---
name: blue-team
description: Blue team defense technologies. Detection engineering, SOC operations, incident response, digital forensics. Use when the user mentions blue team, detection rules, Sigma, YARA, SIEM, alerts, incident response, forensics, or SOC.
---

# ❄ Dark Ice Codex · Blue Team

## Defense Chain

```
Prevention → Detection → Response → Recovery
  │       │       │       │
  └─ Hardening ─┴─ SIEM ─┴─ IR ─┴─ Forensics
```

## Detection Engineering

### Sigma Rules

```yaml
# Mimikatz Detection
title: Mimikatz Credential Dumping
id: 0d65953c-7f75-4f4b-9a16-8b8f9f2b6d5e
status: stable
description: Detects Mimikatz credential dumping via LSASS access
references:
    - https://attack.mitre.org/techniques/T1003/001/
tags:
    - attack.credential_access
    - attack.t1003.001
logsource:
    category: process_access
    product: windows
detection:
    selection:
        TargetImage|endswith: '\lsass.exe'
        GrantedAccess:
            - '0x1010'
            - '0x1038'
            - '0x1410'
    filter_system:
        SourceImage|startswith:
            - 'C:\Windows\System32\'
    condition: selection and not filter_system
level: high
---
# Suspicious PowerShell
title: Suspicious PowerShell Download
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        CommandLine|contains:
            - 'IEX'
            - 'Invoke-Expression'
            - 'DownloadString'
            - 'Net.WebClient'
            - '-enc'
            - 'FromBase64String'
    condition: selection
level: high
---
# DCSync Detection
title: DCSync Attack
logsource:
    product: windows
    service: security
detection:
    selection:
        EventID: 4662
        Properties|contains:
            - '1131f6ad-9c07-11d1-f79f-00c04fc2dcd2'
            - '1131f6aa-9c07-11d1-f79f-00c04fc2dcd2'
    filter_dc:
        SubjectUserName|endswith: '$'
    condition: selection and not filter_dc
level: critical
```

### Sigma Conversion
```bash
# Installation
pip install sigma-cli

# Convert to various platform formats
sigma convert -t splunk -p sysmon rules/
sigma convert -t elasticsearch rules/
sigma convert -t azure-monitor rules/
```

### YARA Rules

```yara
rule Mimikatz_Memory {
    meta:
        description = "Detects Mimikatz in memory"
        severity = "critical"
    strings:
        $s1 = "mimikatz" ascii wide nocase
        $s2 = "sekurlsa::logonpasswords" ascii wide
        $s3 = "lsadump::dcsync" ascii wide
        $func = "kuhl_m_" ascii
    condition:
        2 of ($s*) or $func
}

rule Cobalt_Strike_Beacon {
    meta:
        description = "Detects Cobalt Strike Beacon"
    strings:
        $config = { 69 68 69 68 69 6B 69 68 }
        $sleep = "sleeptime" ascii
        $jitter = "jitter" ascii
    condition:
        $config or all of ($sleep, $jitter)
}

rule Webshell_Generic {
    meta:
        description = "Generic webshell detection"
    strings:
        $php = "<?php" nocase
        $eval = /eval\s*\(\s*\$_(GET|POST|REQUEST)/ nocase
        $system = /system\s*\(\s*\$_(GET|POST)/ nocase
    condition:
        $php and any of ($eval, $system)
}
```

## Key Log Sources

### Windows Security Logs
```python
CRITICAL_EVENTS = {
    # Logon Events
    '4624': 'Successful Logon',
    '4625': 'Failed Logon',
    '4648': 'Explicit Credential Logon',

    # Process Events
    '4688': 'Process Creation',
    '4689': 'Process Termination',

    # Account Events
    '4720': 'User Account Created',
    '4728': 'Member Added to Security Group',
    '4732': 'Member Added to Local Group',

    # Kerberos
    '4768': 'TGT Request',
    '4769': 'Service Ticket Request',
    '4771': 'Pre-Auth Failed',

    # Directory Service
    '4662': 'Directory Service Access',
}
```

### Sysmon Events
```python
SYSMON_EVENTS = {
    '1': 'Process Create',
    '3': 'Network Connection',
    '7': 'Image Loaded',
    '8': 'CreateRemoteThread',
    '10': 'ProcessAccess',
    '11': 'FileCreate',
    '12': 'Registry Key Create/Delete',
    '13': 'Registry Value Set',
    '17': 'Pipe Created',
    '22': 'DNS Query',
    '23': 'FileDelete',
}
```

## SOC Operations

### Alert Triage
```yaml
P1 - Critical (15-minute response):
  - Confirmed intrusion activity
  - Ransomware execution
  - Data exfiltration
  - Privileged account compromised

P2 - High (1-hour response):
  - Suspicious lateral movement
  - Credential theft attempt
  - C2 communication detected
  - Anomalous privileged operations

P3 - Medium (4-hour response):
  - Suspicious process execution
  - Anomalous network connections
  - Policy violations

P4 - Low (24-hour response):
  - Informational alerts
  - Compliance checks
```

### Alert Quality Metrics
```python
class AlertMetrics:
    def calculate(self, alerts):
        total = len(alerts)
        tp = sum(1 for a in alerts if a['verified'] == 'true_positive')
        fp = sum(1 for a in alerts if a['verified'] == 'false_positive')

        return {
            'true_positive_rate': tp / total * 100,
            'false_positive_rate': fp / total * 100,
            'mean_time_to_detect': self._mttd(alerts),
            'mean_time_to_respond': self._mttr(alerts),
        }
```

## Incident Response

### IR Workflow
```
┌─────────────────────────────────────────────────────────────┐
│                    Incident Response Workflow                 │
├─────────────────────────────────────────────────────────────┤
│  1. Preparation                                             │
│  └─ Tool prep, process docs, contact list                   │
│                        ↓                                     │
│  2. Identification                                          │
│  └─ Confirm incident, assess scope, initial triage          │
│                        ↓                                     │
│  3. Containment                                             │
│  └─ Isolate systems, block comms, preserve evidence         │
│                        ↓                                     │
│  4. Eradication                                             │
│  └─ Remove malware, patch vulns, reset credentials          │
│                        ↓                                     │
│  5. Recovery                                                │
│  └─ Restore systems, enhance monitoring, resume ops         │
│                        ↓                                     │
│  6. Lessons Learned                                         │
│  └─ Incident report, improvement actions, knowledge base    │
└─────────────────────────────────────────────────────────────┘
```

### Rapid Containment
```bash
# Windows - Isolate Host
netsh advfirewall set allprofiles state on
netsh advfirewall firewall add rule name="Block All" dir=out action=block

# Linux - Isolate Host
iptables -P INPUT DROP
iptables -P OUTPUT DROP
iptables -A INPUT -s TRUSTED_IP -j ACCEPT

# Disable Account
net user compromised_user /active:no
passwd -l compromised_user

# Terminate Malicious Process
taskkill /F /PID <pid>
kill -9 <pid>
```

### Evidence Collection
```bash
# Windows
wmic process list full > processes.txt
netstat -ano > netstat.txt
reg export HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run run.reg
wevtutil epl Security security.evtx

# Linux
ps auxf > processes.txt
netstat -tulpn > netstat.txt
cat /etc/passwd > passwd.txt
last > logins.txt
cp /var/log/auth.log .
```

## Digital Forensics

### Memory Forensics
```bash
# Memory Acquisition
# Windows - WinPMEM
winpmem_mini_x64.exe memory.raw

# Linux - LiME
insmod lime.ko "path=/tmp/memory.lime format=lime"

# Analysis - Volatility
vol.py -f memory.raw imageinfo
vol.py -f memory.raw --profile=Win10x64 pslist
vol.py -f memory.raw --profile=Win10x64 netscan
vol.py -f memory.raw --profile=Win10x64 malfind
vol.py -f memory.raw --profile=Win10x64 dlllist
```

### Disk Forensics
```bash
# Image Acquisition
dd if=/dev/sda of=disk.img bs=4M status=progress

# Mount for Analysis
mount -o ro,loop disk.img /mnt/evidence

# Timeline Analysis
log2timeline.py timeline.plaso disk.img
psort.py -o l2tcsv timeline.plaso -w timeline.csv

# File Recovery
foremost -i disk.img -o recovered/
photorec disk.img
```

### Log Analysis
```bash
# Windows Event Logs
# Parse using EvtxECmd
EvtxECmd.exe -f Security.evtx --csv output/

# Linux Logs
grep "Failed password" /var/log/auth.log
grep "Accepted" /var/log/auth.log | awk '{print $1,$2,$3,$9,$11}'
zcat /var/log/auth.log.*.gz | grep "sudo"
```

## Threat Hunting

### Hunting Hypothesis
```yaml
# ATT&CK-based Hunting Hypothesis
hypothesis: "Adversaries may use PowerShell to download and execute malicious code"
technique: T1059.001
data_sources:
  - Windows PowerShell Logs
  - Sysmon Process Creation
query: |
  EventID=4104 AND ScriptBlockText CONTAINS ("IEX" OR "DownloadString")
```

### Hunting Query Examples
```sql
-- Anomalous Parent-Child Process Relationship
SELECT parent_name, process_name, command_line
FROM processes
WHERE parent_name = 'winword.exe'
  AND process_name IN ('cmd.exe', 'powershell.exe', 'wscript.exe')

-- Anomalous Network Connections
SELECT process_name, remote_address, remote_port
FROM network_connections
WHERE remote_port NOT IN (80, 443, 53)
  AND process_name NOT IN ('chrome.exe', 'firefox.exe')

-- Suspicious Scheduled Tasks
SELECT name, command, trigger
FROM scheduled_tasks
WHERE command LIKE '%powershell%' OR command LIKE '%cmd%'
```

## Tool Inventory

| Tool | Purpose |
|------|---------|
| Sigma | Generic Detection Rules |
| YARA | Malware Detection |
| Splunk/Elastic | SIEM Platforms |
| Volatility | Memory Forensics |
| Autopsy | Disk Forensics |
| Velociraptor | Endpoint Response |
| TheHive | Incident Management |
| MISP | Threat Intelligence |

## Key Management

### Key Lifecycle
```
Generation → Storage → Distribution → Usage → Rotation → Revocation → Destruction
```

### Core Tools
| Tool | Type | Features |
|------|------|----------|
| HashiCorp Vault | Platform | Dynamic secrets, AppRole, multi-backend |
| AWS KMS | Cloud Service | Managed keys, envelope encryption, auto-rotation |
| AWS Secrets Manager | Cloud Service | Auto-rotation, Lambda integration |
| Sealed Secrets | K8s | GitOps friendly, encrypted storage |
| External Secrets | K8s | Multi-backend sync (Vault/AWS/GCP) |

### Key Management Checklist
```yaml
Generation and Storage:
  - [ ] Cryptographically strong random number generator
  - [ ] Key length meets standards (AES-256, RSA-2048+)
  - [ ] Centralized storage in KMS + encryption at rest + access control

Distribution and Usage:
  - [ ] Least privilege + short-lived credentials preferred (dynamic secrets)
  - [ ] No hardcoding, use environment variables or mounted volumes
  - [ ] Encryption in transit (TLS)

Rotation and Revocation:
  - [ ] Regular automatic rotation (P0 Annual/P1 Quarterly/P2 Monthly/P3 Hourly)
  - [ ] Support emergency revocation + post-rotation validation + audit logs

Monitoring:
  - [ ] Log all key access + anomaly detection alerts + regular compliance audits
```

### Vault Key Operations Quick Reference
```bash
# KV Read/Write
vault kv put secret/myapp/config db_password="xxx" api_key="yyy"
vault kv get -field=db_password secret/myapp/config

# Dynamic Database Credentials
vault read database/creds/readonly

# AppRole Login
vault write auth/approle/login role_id="<id>" secret_id="<id>"
```

### Secret Classification Policy
| Level | Type | Rotation Period | Storage |
|-------|------|-----------------|---------|
| P0 | Root Keys, Master Keys | Annual | HSM |
| P1 | Data Encryption Keys | Quarterly | Vault |
| P2 | API Keys | Monthly | Secrets Manager |
| P3 | Session Tokens | Hourly | Redis |

---
