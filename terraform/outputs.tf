output "resource_group_name" {
  description = "Provisioned resource group"
  value       = azurerm_resource_group.edustar.name
}

output "resource_group_location" {
  description = "Region of the resource group"
  value       = azurerm_resource_group.edustar.location
}

output "vnet_id" {
  description = "ID of the virtual network"
  value       = azurerm_virtual_network.edustar.id
}

output "vnet_name" {
  description = "Name of the virtual network"
  value       = azurerm_virtual_network.edustar.name
}

output "vnet_address_space" {
  description = "Address space of the VNet"
  value       = azurerm_virtual_network.edustar.address_space
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = azurerm_subnet.public.id
}

output "public_subnet_prefix" {
  description = "Address prefix of public subnet"
  value       = azurerm_subnet.public.address_prefixes
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = azurerm_subnet.private.id
}

output "private_subnet_prefix" {
  description = "Address prefix of private subnet"
  value       = azurerm_subnet.private.address_prefixes
}

output "public_nsg_id" {
  description = "ID of the public NSG"
  value       = azurerm_network_security_group.public.id
}

output "private_nsg_id" {
  description = "ID of the private NSG"
  value       = azurerm_network_security_group.private.id
}
