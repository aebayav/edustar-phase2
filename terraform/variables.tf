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

variable "public_subnet_name" {
  description = "Name of the public subnet"
  type        = string
  default     = "public-subnet"
}

variable "public_subnet_prefix" {
  description = "Address prefix for public subnet"
  type        = list(string)
  default     = ["10.0.1.0/24"]
}

variable "private_subnet_name" {
  description = "Name of the private subnet"
  type        = string
  default     = "private-subnet"
}

variable "private_subnet_prefix" {
  description = "Address prefix for private subnet"
  type        = list(string)
  default     = ["10.0.2.0/24"]
}

variable "public_nsg_name" {
  description = "Name of the public NSG"
  type        = string
  default     = "public-nsg"
}

variable "private_nsg_name" {
  description = "Name of the private NSG"
  type        = string
  default     = "private-nsg"
}

variable "admin_ssh_ip" {
  description = "IP address allowed to SSH into public subnet (your public IP)"
  type        = string
  default     = "78.175.235.143"
}
