---
name: infrastructure
description: Cloud-native infrastructure. Kubernetes, Helm, Kustomize, Operator, CRD, GitOps, ArgoCD, Flux, IaC, Terraform, Pulumi, CDK. Route here when the user mentions K8s, Helm, GitOps, or IaC.
license: MIT
user-invocable: false
disable-model-invocation: false
---

# Cloud Native Infrastructure · Infrastructure

## Domain Overview

```
                    GitOps Control Plane
                          |
        +-----------------+-----------------+
        |                 |                 |
    ArgoCD/Flux      Kubernetes         IaC Layer
        |                 |                 |
   Git Repo ------> Helm/Kustomize --> Terraform/Pulumi
        |                 |                 |
   Declarative Config  Container Orchestration Cloud Resource Mgmt
```

---

## Kubernetes Container Orchestration

### Helm Chart Development

Standard Structure: `Chart.yaml` + `values.yaml` + `templates/` + `charts/`

Core Points:
- Chart.yaml: `apiVersion: v2`, dependencies declare sub-charts (condition controls enablement)
- values.yaml Design: image / replicaCount / resources / autoscaling / service / ingress / probes / env / persistence
- Deployment Template: Use `_helpers.tpl` to define `fullname` / `labels` / `selectorLabels`
- Configuration Validation: `checksum/config: {{ include ... | sha256sum }}` triggers rolling updates
- Security Context: `runAsNonRoot: true, runAsUser: 1000`

Key Commands:
- `helm lint` / `helm template --debug` validation
- `helm install -f values-prod.yaml` deployment
- `helm upgrade --reuse-values` upgrade
- `helm rollback <release> <revision>` rollback
- `helm push <chart>.tgz oci://registry` push OCI

### Kustomize Configuration Management

Directory Structure: `base/` + `overlays/{dev,staging,production}/`

Core Capabilities:
- base/kustomization.yaml: resources / commonLabels / images / configMapGenerator / secretGenerator
- overlay: namespace / patchesStrategicMerge / patchesJson6902 / replicas / images / configMapGenerator(behavior: merge)
- Commands: `kubectl apply -k overlays/production` / `kubectl diff -k`

### Operator Pattern

- CRD Definition: openAPIV3Schema declares spec/status, subresources(status/scale)
- Controller Core Loop: Get CR → Build desired state → Create/Update sub-resources → Update Status
- OwnerReferences: Sub-resources associated with CR, cascading deletion
- Initialization: `operator-sdk init` → `create api` → `make manifests` → `make install`

### Deployment Strategies

| Strategy | Implementation | Applicable Scenarios |
|----------|----------------|----------------------|
| Rolling Update | `strategy.rollingUpdate` maxSurge/maxUnavailable | Default strategy |
| Blue-Green | Two Deployments + Service selector switch | Zero-downtime cutover |
| Canary | stable(9) + canary(1) shared Service | Progressive validation |
| Flagger | `Canary` CRD + Automated metric analysis | Automated canary |

### K8s Checklist

- [ ] Health Checks: livenessProbe + readinessProbe are mandatory
- [ ] Resource Limits: requests + limits prevent resource exhaustion
- [ ] HPA: CPU/Memory/Custom metrics auto-scaling
- [ ] PDB: `minAvailable` prevents rolling update disruptions
- [ ] ResourceQuota + LimitRange: Namespace resource quotas
- [ ] Images use Digest to ensure consistency
- [ ] Pod Anti-affinity spreads across different nodes
- [ ] Externalize Secrets: External Secrets Operator

---

## GitOps Continuous Deployment

### ArgoCD vs Flux

| Feature | ArgoCD | Flux |
|---------|--------|------|
| Web UI | Powerful | None (Weave GitOps available) |
| Multi-tenant | Projects + RBAC | Needs extra config |
| Multi-cluster | Native support | Native support |
| Auto Image Updates | Needs Image Updater | Native support |
| Progressive Delivery| Argo Rollouts | Flagger |
| CNCF | Graduated | Graduated |

### ArgoCD Core Patterns

- Application: source(repoURL/path/targetRevision) + destination(server/namespace)
- syncPolicy: `automated(prune: true, selfHeal: true)` + retry
- ignoreDifferences: Ignore `/spec/replicas` modified by HPA
- ApplicationSet: Git directory generator, one template manages multiple environments
- Multi-cluster: `argocd cluster add` registers cluster
- Notifications: ConfigMap configures Slack/Email notification templates
- Rollouts: `Canary` CRD + steps(setWeight/pause) + AnalysisTemplate(Prometheus query)

### Flux Core Patterns

- GitRepository: `interval: 1m`, ref branch, secretRef
- Kustomization: path + prune + healthChecks + postBuild substitute
- HelmRepository + HelmRelease: chart + values + install/upgrade remediation
- ImageRepository + ImagePolicy + ImageUpdateAutomation: Automatically detects new images and commits to Git

### Multi-Environment Management

```
fleet-infra/
├── clusters/{dev,staging,production}/  # Entry per cluster
├── infrastructure/base + overlays/     # Foundation components
└── apps/base + overlays/               # App configs
```

### Secrets Management

- Sealed Secrets: `kubeseal` encrypts → commits to Git → Controller decrypts
- External Secrets Operator: SecretStore(AWS SM) + ExternalSecret → Automatic sync

### GitOps Checklist

- [ ] Git is the single source of truth, all changes via PR
- [ ] Auto-sync + selfHeal
- [ ] Encrypted secret storage (Sealed Secrets / External Secrets)
- [ ] Progressive delivery (Rollouts / Flagger)
- [ ] Multi-environment directory isolation
- [ ] Rollback strategy: Retain historical versions

---

## Infrastructure as Code (IaC)

### Tool Comparison

| Tool | Language | State Management | Cloud Support | Learning Curve |
|------|----------|------------------|---------------|----------------|
| Terraform | HCL | Explicit (S3/TF Cloud) | All platforms | Medium |
| Pulumi | Python/TS/Go | Automatic (Pulumi Cloud) | All platforms | Lower |
| AWS CDK | Python/TS | CloudFormation | AWS | Medium |

### Terraform Core Patterns

Project Structure: `modules/{vpc,eks,rds}/` + `environments/{dev,staging,prod}/`

- Provider: Version lock `required_providers` + `default_tags`
- Backend: S3 + DynamoDB lock + KMS encryption
- Modularization: `variable` → `resource` → `output`, environments reference via `module`
- Remote State: `data "terraform_remote_state"` cross-module referencing
- Command Flow: `init` → `validate` → `fmt` → `plan -out=tfplan` → `apply tfplan`
- State Management: `state list/show/mv/rm` / `import` import existing resources
- Workspace: `workspace new/select` multi-environment isolation

### Pulumi Core Patterns

- ComponentResource: Custom resource groups (VPC/EKS encapsulated as classes)
- Config: `pulumi.Config()` reads stack configuration
- Outputs: `pulumi.export()` exports values
- Commands: `preview` → `up` → `stack output` / `destroy`

### AWS CDK Core Patterns

- Stack: Inherits `Stack`, uses L2 Constructs (`ec2.Vpc` / `eks.Cluster`)
- Cross-Stack Reference: Passed via constructor parameters
- Commands: `synth` → `diff` → `deploy --all` / `bootstrap`

### IaC Checklist

- [ ] Modularization: Reusable components abstracted as modules
- [ ] Environment Isolation: Different environments, different States
- [ ] Remote state + state locking
- [ ] Provider version locking
- [ ] Secrets Management: Secrets Manager / SSM
- [ ] Unified resource tags
- [ ] Human review after Plan before Apply
- [ ] CI/CD integration automation

---

## Best Practices

| Layer | Tool Selection | Principles |
|-------|----------------|------------|
| Application Deployment | Helm + Kustomize | Templating + Environment variances |
| Continuous Delivery | ArgoCD / Flux | Git as single source of truth |
| Infrastructure | Terraform / Pulumi | Declarative + State management |
| Config Management | External Secrets | Externalize secrets |
| Observability | Prometheus + Grafana | Metrics + Visualization |

## Trigger Words

Kubernetes, K8s, Helm, Kustomize, Operator, CRD, GitOps, ArgoCD, Flux, IaC, Terraform, Pulumi, CDK, Infrastructure as Code
