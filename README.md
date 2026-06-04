# EduStar — CMPE433 Phase 2 Infrastructure

**Group 5 | Scenario 5 — Online Education Platform**

## Team

| Name | Role |
|---|---|
| Ahmet Efe Bayav | Cloud Architect |
| Barış Özpulat | DevOps / Implementation Lead |
| Utku Oğul Bolat | Security & Compliance Lead |
| Meriç Mete Güleç | Business Analyst |

---

## Architecture Overview

- **Cloud Provider:** Microsoft Azure (Spain Central)
- **CDN / Security:** Cloudflare Pro
- **IaaS Workload:** Ubuntu VM running Node.js REST API
- **PaaS Workload:** Azure Database for PostgreSQL Flexible Server
- **Storage:** Azure Blob Storage
- **IaC Tool:** Terraform
- **Monitoring:** Azure Monitor + Log Analytics

```
                          Internet
                             │
                      ┌──────┴──────┐
                      │  Cloudflare  │
                      │     Pro      │
                      └──────┬──────┘
                             │
                    ┌────────┴────────┐
                    │   public-nsg    │
                    │  HTTP:80 ✓      │
                    │  SSH:22 (admin) │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │  public-subnet  │
                    │   10.0.1.0/24   │
                    │                 │
                    │  ┌───────────┐  │
                    │  │ edustar-vm │  │
                    │  │  Node.js   │  │
                    │  └─────┬─────┘  │
                    └────────┼────────┘
                             │
                    ┌────────┴────────┐
                    │  private-nsg    │
                    │  PostgreSQL:5432│
                    │  from 10.0.1.0  │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │ private-subnet  │
                    │  10.0.2.0/24    │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │  PostgreSQL  │ │
                    │ │   Flexible   │ │
                    │ └─────────────┘ │
                    └─────────────────┘

                   ┌──────────────────┐
                   │  Blob Storage    │
                   │  videos (private)│
                   └──────────────────┘
```

---

## Repository Structure

```
edustar-phase2/
├── terraform/
│   ├── main.tf          # Resource group, VNet, subnets, NSGs
│   ├── variables.tf     # Configurable variables
│   └── outputs.tf       # Output values after deployment
├── app/
│   └── index.js         # Node.js API (courses, health)
├── .gitignore
└── README.md
```

---

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) v1.5+
- [Azure CLI](https://aka.ms/installazurecliwindows)
- An active Azure subscription
- Azure CLI logged in: `az login`

---

## How to Deploy (Terraform)

### 1. Clone the repository

```bash
git clone https://github.com/aebayav/edustar-phase2.git
cd edustar-phase2/terraform
```

### 2. Login to Azure

```bash
az login
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Preview changes

```bash
terraform plan
```

### 5. Apply infrastructure

```bash
terraform apply
```

Type `yes` when prompted.

### 6. What gets created

| Resource | Name | Details |
|---|---|---|
| Resource Group | `edustar-rg` | Spain Central |
| Virtual Network | `edustar-vnet` | 10.0.0.0/16 |
| Public Subnet | `public-subnet` | 10.0.1.0/24 |
| Private Subnet | `private-subnet` | 10.0.2.0/24 |
| Public NSG | `public-nsg` | HTTP:80 (any), SSH:22 (admin IP only) |
| Private NSG | `private-nsg` | PostgreSQL:5432 (from public subnet only) |

### 7. Customize variables

```bash
# Using a .tfvars file
cat > terraform.tfvars << EOF
resource_group_name = "edustar-rg"
location            = "West Europe"
admin_ssh_ip        = "YOUR_PUBLIC_IP"
EOF

terraform apply -var-file=terraform.tfvars
```

---

## Manually Deployed Resources

The following were deployed via Azure Portal and are managed outside Terraform state:

### IaaS — Virtual Machine

- **Name:** `edustar-vm`
- **OS:** Ubuntu Server 24.04 LTS
- **Size:** Standard_B2ats_v2
- **Subnet:** public-subnet

**Node.js API endpoints:**

```
GET /courses   → returns course list
GET /health    → returns health status
```

### PaaS — PostgreSQL Flexible Server

- **Server:** `edustar-db.postgres.database.azure.com`
- **Version:** PostgreSQL 18
- **Tier:** Burstable (Standard_B1ms)
- **Database:** `edustar`
- **Tables:** `users`, `courses`, `enrollments`

### Storage — Azure Blob Storage

- **Account:** `edustarstorage`
- **Container:** `videos` (Private access)
- **Redundancy:** LRS

---

## Monitoring

### Log Analytics

- **Workspace:** `edustar-logs`
- **SKU:** PerGB2018 | **Retention:** 30 days
- **Agent:** Azure Monitor Agent installed on `edustar-vm`
- **DCR:** `edustar-dcr` — collects CPU, Memory every 60s

### Alert Rules

| Alert | Type | Condition | Action |
|---|---|---|---|
| `Percentage CPU - edustar-vm` | Metric | VM CPU > 80% | Email |
| `VM-Unavailable-Metric` | Metric | Availability < 1 for 5 min | Email |
| `VM-Deallocated-Alert` | Activity Log | VM deallocate/stop | Email |

### Dashboard

- **Name:** `edustar-dashboard`
- **Panels:**
  - VM CPU Usage (Percentage CPU)
  - VM Available Memory (Available Memory %)
  - PostgreSQL CPU (cpu_percent)
  - PostgreSQL Active Connections (active_connections)

---

## Security Notes

- Private subnet has no direct internet access
- PostgreSQL port 5432 only accessible from public subnet (10.0.1.0/24)
- SSH restricted to admin IP via `admin_ssh_ip` variable
- Blob Storage container is private — access via SAS tokens
- NSG rules follow least-privilege principle

---

## Destroy Infrastructure

To remove all Terraform-managed resources:

```bash
terraform destroy
```

> **Note:** This only removes resources tracked by Terraform state. Manually created resources (VM, PostgreSQL, Storage, Monitoring) must be deleted via Azure Portal or Azure CLI.

---

## References

- [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)
- [Terraform AzureRM Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Monitor Documentation](https://learn.microsoft.com/en-us/azure/azure-monitor/)
- [Azure Database for PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/)
