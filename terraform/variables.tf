# =============================================================================
# EduStar Phase 2 — Terraform Variables
# Group 5 | Scenario 5
# =============================================================================

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "edustar-rg"
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "Spain Central"
}

variable "vnet_name" {
  description = "Name of the virtual network"
  type        = string
  default     = "edustar-vnet"
}

variable "vnet_address_space" {
  description = "Address space for the VNet"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "admin_ssh_ip" {
  description = "IP address allowed to SSH (used in legacy public-nsg)"
  type        = string
  default     = "78.175.235.143"
}

variable "tenant_id" {
  description = "Azure tenant ID"
  type        = string
  default     = "f0657e4e-050e-48c7-a0e0-b521d4c6fac5"
}

variable "db_admin_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
  default     = "EduStar2026!"
}
