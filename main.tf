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
  skip_provider_registration = true
}

resource "azurerm_resource_group" "edustar" {
  name     = "edustar-rg"
  location = "Spain Central"
}

resource "azurerm_virtual_network" "edustar" {
  name                = "edustar-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.edustar.location
  resource_group_name = azurerm_resource_group.edustar.name
}

resource "azurerm_subnet" "public" {
  name                 = "public-subnet"
  resource_group_name  = azurerm_resource_group.edustar.name
  virtual_network_name = azurerm_virtual_network.edustar.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "private" {
  name                 = "private-subnet"
  resource_group_name  = azurerm_resource_group.edustar.name
  virtual_network_name = azurerm_virtual_network.edustar.name
  address_prefixes     = ["10.0.2.0/24"]
}

resource "azurerm_network_security_group" "public" {
  name                = "public-nsg"
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
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_security_group" "private" {
  name                = "private-nsg"
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
    source_address_prefix      = "10.0.1.0/24"
    destination_address_prefix = "*"
  }
}