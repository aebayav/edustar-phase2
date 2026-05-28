terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "edustar" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_virtual_network" "edustar" {
  name                = var.vnet_name
  address_space       = var.vnet_address_space
  location            = azurerm_resource_group.edustar.location
  resource_group_name = azurerm_resource_group.edustar.name
}

resource "azurerm_subnet" "public" {
  name                 = var.public_subnet_name
  resource_group_name  = azurerm_resource_group.edustar.name
  virtual_network_name = azurerm_virtual_network.edustar.name
  address_prefixes     = var.public_subnet_prefix
}

resource "azurerm_subnet" "private" {
  name                 = var.private_subnet_name
  resource_group_name  = azurerm_resource_group.edustar.name
  virtual_network_name = azurerm_virtual_network.edustar.name
  address_prefixes     = var.private_subnet_prefix
}

resource "azurerm_network_security_group" "public" {
  name                = var.public_nsg_name
  location            = azurerm_resource_group.edustar.location
  resource_group_name = azurerm_resource_group.edustar.name

  security_rule {
    name                       = "allow-http"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-ssh"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.admin_ssh_ip
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_security_group" "private" {
  name                = var.private_nsg_name
  location            = azurerm_resource_group.edustar.location
  resource_group_name = azurerm_resource_group.edustar.name

  security_rule {
    name                       = "allow-postgres"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = var.public_subnet_prefix[0]
    destination_address_prefix = "*"
  }
}
