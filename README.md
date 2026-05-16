# EduStar — CMPE433 Phase 2 Infrastructure

**Group 5 | Scenario 5 — Online Education Platform**

## Team
| Name | Role |
|------|------|
| Ahmet Efe Bayav | Cloud Architect |
| Barış | DevOps / Implementation Lead |
| Utku | Security & Compliance Lead |
| Meriç | Business Analyst |

---

## Architecture Overview

- **Cloud Provider:** Microsoft Azure (Spain Central)
- **CDN / Security:** Cloudflare Pro
- **IaaS Workload:** Ubuntu VM running Node.js REST API
- **PaaS Workload:** Azure Database for PostgreSQL Flexible Server
- **Storage:** Azure Blob Storage
- **IaC Tool:** Terraform

---

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) v1.5+
- [Azure CLI](https://aka.ms/installazurecliwindows)
- An active Azure subscription
- Azure CLI logged in: `az login`

---

## Repository Structure

```
edustar-phase2/
├── main.tf          # VNet, subnets, NSGs
├── .gitignore
└── README.md
```

---

## How to Deploy

### 1. Clone the repository
```bash
git clone https://github.com/aebayav/edustar-phase2.git
cd edustar-phase2
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

Type `yes` when prompted. This will create:
- Resource group: `edustar-rg` (Spain Central)
- Virtual network: `edustar-vnet` (10.0.0.0/16)
- Public subnet: `public-subnet` (10.0.1.0/24)
- Private subnet: `private-subnet` (10.0.2.0/24)
- NSG for public subnet (allow HTTP:80, SSH:22)
- NSG for private subnet (allow PostgreSQL:5432 from public subnet only)

---

## Deployed Resources (Manual)

The following resources were deployed via Azure Portal and connected to the Terraform-managed VNet:

### IaaS — Virtual Machine
- **Name:** `edustar-vm`
- **OS:** Ubuntu Server 24.04 LTS
- **Size:** Standard_B2ats_v2
- **Public IP:** 68.221.160.164
- **Subnet:** public-subnet

**Node.js API endpoints:**
```
GET http://68.221.160.164/courses   → returns course list
GET http://68.221.160.164/health    → returns health status
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

## Security Notes

- Private subnet has no direct internet access
- PostgreSQL port 5432 only accessible from public subnet (10.0.1.0/24)
- Blob Storage container is private — access via Signed URLs (see Utku's security documentation)
- All secrets managed via Azure Key Vault (see security documentation)

---

## Destroy Infrastructure

To remove all Terraform-managed resources:
```bash
terraform destroy
```

> **Note:** This only removes resources tracked by Terraform state. Manually created resources (VM, PostgreSQL, Storage) must be deleted via Azure Portal.