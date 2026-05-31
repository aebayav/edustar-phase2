# =============================================================================
# EduStar Phase 2 — Terraform Outputs
# Group 5 | Scenario 5
# =============================================================================

output "resource_group_name" {
  description = "Provisioned resource group"
  value       = azurerm_resource_group.edustar.name
}

output "resource_group_location" {
  description = "Region of the resource group"
  value       = azurerm_resource_group.edustar.location
}

output "vnet_name" {
  description = "Name of the virtual network"
  value       = azurerm_virtual_network.edustar.name
}

output "vnet_id" {
  description = "ID of the virtual network"
  value       = azurerm_virtual_network.edustar.id
}

output "vnet_address_space" {
  description = "Address space of the VNet"
  value       = azurerm_virtual_network.edustar.address_space
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = azurerm_subnet.public.id
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = azurerm_subnet.private.id
}

output "bastion_subnet_id" {
  description = "ID of the bastion subnet"
  value       = azurerm_subnet.bastion.id
}

output "vm_public_ip" {
  description = "Public IP address of the VM"
  value       = azurerm_public_ip.vm.ip_address
}

output "bastion_public_ip" {
  description = "Public IP address of Bastion"
  value       = azurerm_public_ip.bastion.ip_address
}

output "postgresql_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = azurerm_postgresql_flexible_server.edustar.fqdn
}

output "storage_account_name" {
  description = "Blob Storage account name"
  value       = azurerm_storage_account.edustar.name
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.edustar.vault_uri
}

output "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID"
  value       = azurerm_log_analytics_workspace.edustar.id
}

output "vm_nsg_id" {
  description = "ID of edustar-vm-nsg"
  value       = azurerm_network_security_group.vm.id
}

output "private_nsg_id" {
  description = "ID of private-nsg"
  value       = azurerm_network_security_group.private.id
}
