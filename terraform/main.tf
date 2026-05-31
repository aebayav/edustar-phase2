# =============================================================================
# EduStar Phase 2 — Complete Azure Infrastructure as Code
# Group 5 | Scenario 5 — Online Education Platform
# Auto-generated from live Azure resources on 2026-05-30
# =============================================================================

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

# =============================================================================
# RESOURCE GROUP
# =============================================================================
resource "azurerm_resource_group" "edustar" {
  name     = var.resource_group_name
  location = var.location
}

# =============================================================================
# NETWORK: VNet + 3 Subnets
# =============================================================================
resource "azurerm_virtual_network" "edustar" {
  name                = var.vnet_name
  address_space       = var.vnet_address_space
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

resource "azurerm_subnet" "bastion" {
  name                 = "AzureBastionSubnet"
  resource_group_name  = azurerm_resource_group.edustar.name
  virtual_network_name = azurerm_virtual_network.edustar.name
  address_prefixes     = ["10.0.3.0/26"]
}

# =============================================================================
# NETWORK SECURITY GROUPS
# =============================================================================

# NSG attached to VM's NIC (public-subnet)
resource "azurerm_network_security_group" "vm" {
  name                = "edustar-vm-nsg"
  location            = azurerm_resource_group.edustar.location
  resource_group_name = azurerm_resource_group.edustar.name

  security_rule {
    name                       = "SSH"
    priority                   = 300
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "10.0.3.0/26"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTPS"
    priority                   = 310
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTP"
    priority                   = 320
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Deny-SSH-Internet"
    priority                   = 330
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }
}

# NSG attached to private-subnet
resource "azurerm_network_security_group" "private" {
  name                = "private-nsg"
  location            = azurerm_resource_group.edustar.location
  resource_group_name = azurerm_resource_group.edustar.name

  security_rule {
    name                       = "PostgreSQL-5432"
    priority                   = 400
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = "10.0.1.0/24"
    destination_address_prefix = "*"
  }
}

# Legacy NSG (currently unattached, exists in Azure)
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
    source_address_prefix      = var.admin_ssh_ip
    destination_address_prefix = "*"
  }
}

# =============================================================================
# NSG — SUBNET ASSOCIATIONS
# =============================================================================
resource "azurerm_subnet_network_security_group_association" "public" {
  subnet_id                 = azurerm_subnet.public.id
  network_security_group_id = azurerm_network_security_group.vm.id
}

resource "azurerm_subnet_network_security_group_association" "private" {
  subnet_id                 = azurerm_subnet.private.id
  network_security_group_id = azurerm_network_security_group.private.id
}

# =============================================================================
# PUBLIC IP ADDRESSES
# =============================================================================
resource "azurerm_public_ip" "vm" {
  name                = "edustar-vm-ip"
  resource_group_name = azurerm_resource_group.edustar.name
  location            = azurerm_resource_group.edustar.location
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = ["2"]
}

resource "azurerm_public_ip" "bastion" {
  name                = "edustar-bastion-ip"
  resource_group_name = azurerm_resource_group.edustar.name
  location            = azurerm_resource_group.edustar.location
  allocation_method   = "Static"
  sku                 = "Standard"
}

# =============================================================================
# NETWORK INTERFACE (VM)
# =============================================================================
resource "azurerm_network_interface" "vm" {
  name                = "edustar-vm528_z2"
  resource_group_name = azurerm_resource_group.edustar.name
  location            = azurerm_resource_group.edustar.location

  accelerated_networking_enabled = true

  ip_configuration {
    name                          = "ipconfig1"
    subnet_id                     = azurerm_subnet.public.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.vm.id
  }
}

# Attach VM NSG to NIC
resource "azurerm_network_interface_security_group_association" "vm" {
  network_interface_id      = azurerm_network_interface.vm.id
  network_security_group_id = azurerm_network_security_group.vm.id
}

# =============================================================================
# VIRTUAL MACHINE (IaaS)
# =============================================================================
resource "azurerm_linux_virtual_machine" "vm" {
  name                            = "edustar-vm"
  resource_group_name             = azurerm_resource_group.edustar.name
  location                        = azurerm_resource_group.edustar.location
  size                            = "Standard_B2ats_v2"
  admin_username                  = "cloud-user"
  disable_password_authentication = false
  zone                            = "2"

  network_interface_ids = [
    azurerm_network_interface.vm.id,
  ]

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 30
  }

  source_image_reference {
    publisher = "canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }

  boot_diagnostics {
    storage_account_uri = null
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {}
}

# Azure Monitor Linux Agent extension
resource "azurerm_virtual_machine_extension" "monitor_agent" {
  name                       = "AzureMonitorLinuxAgent"
  virtual_machine_id         = azurerm_linux_virtual_machine.vm.id
  publisher                  = "Microsoft.Azure.Monitor"
  type                       = "AzureMonitorLinuxAgent"
  type_handler_version       = "1.0"
  auto_upgrade_minor_version = true
}

# VMAccess for Linux extension (enablevmAccess)
resource "azurerm_virtual_machine_extension" "vm_access" {
  name                       = "enablevmAccess"
  virtual_machine_id         = azurerm_linux_virtual_machine.vm.id
  publisher                  = "Microsoft.OSTCExtensions"
  type                       = "VMAccessForLinux"
  type_handler_version       = "1.5"
  auto_upgrade_minor_version = true
}

# =============================================================================
# PaaS: POSTGRESQL FLEXIBLE SERVER
# =============================================================================
resource "azurerm_postgresql_flexible_server" "edustar" {
  name                   = "edustar-db"
  resource_group_name    = azurerm_resource_group.edustar.name
  location               = azurerm_resource_group.edustar.location
  version                = "16"
  administrator_login    = "dbadmin"
  administrator_password = var.db_admin_password

  sku_name   = "B_Standard_B1ms"
  storage_mb = 32768
  storage_tier = "P4"

  public_network_access_enabled = true

  backup_retention_days = 7

  zone = "1"

  tags = {}

  lifecycle {
    ignore_changes = [
      version,
      sku_name,
    ]
  }
}

resource "azurerm_postgresql_flexible_server_database" "edustar" {
  name      = "edustar"
  server_id = azurerm_postgresql_flexible_server.edustar.id
}

# =============================================================================
# STORAGE ACCOUNT (Blob Storage)
# =============================================================================
resource "azurerm_storage_account" "edustar" {
  name                     = "edustarstorage"
  resource_group_name      = azurerm_resource_group.edustar.name
  location                 = azurerm_resource_group.edustar.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"
  access_tier              = "Hot"

  enable_https_traffic_only       = true
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false

  tags = {}
}

resource "azurerm_storage_container" "videos" {
  name                  = "videos"
  storage_account_name  = azurerm_storage_account.edustar.name
  container_access_type = "private"
}

# Lifecycle policy — auto-delete after 30 days
resource "azurerm_storage_management_policy" "edustar" {
  storage_account_id = azurerm_storage_account.edustar.id

  rule {
    name    = "auto-delete"
    enabled = true
    filters {
      blob_types = ["blockBlob"]
    }
    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 30
      }
    }
  }
}

# =============================================================================
# KEY VAULT
# =============================================================================
resource "azurerm_key_vault" "edustar" {
  name                       = "edustar-kv-433"
  resource_group_name        = azurerm_resource_group.edustar.name
  location                   = azurerm_resource_group.edustar.location
  tenant_id                  = var.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 90

  enable_rbac_authorization = true

  tags = {}
}

resource "azurerm_key_vault_secret" "db_connection" {
  name         = "db-connection-string"
  value        = "postgresql://dbadmin@edustar-db:${var.db_admin_password}@edustar-db.postgres.database.azure.com:5432/edustar"
  key_vault_id = azurerm_key_vault.edustar.id

  tags = {
    "file-encoding" = "utf-8"
  }
}

# =============================================================================
# BASTION HOST
# =============================================================================
resource "azurerm_bastion_host" "edustar" {
  name                = "edustar-bastion"
  resource_group_name = azurerm_resource_group.edustar.name
  location            = azurerm_resource_group.edustar.location

  ip_configuration {
    name                 = "bastion_ip_config"
    subnet_id            = azurerm_subnet.bastion.id
    public_ip_address_id = azurerm_public_ip.bastion.id
  }
}

# =============================================================================
# LOG ANALYTICS WORKSPACE
# =============================================================================
resource "azurerm_log_analytics_workspace" "edustar" {
  name                = "edustar-logs"
  resource_group_name = azurerm_resource_group.edustar.name
  location            = azurerm_resource_group.edustar.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# =============================================================================
# DATA COLLECTION RULE (Azure Monitor Agent → Log Analytics)
# =============================================================================
resource "azurerm_monitor_data_collection_rule" "edustar" {
  name                = "edustar-dcr"
  resource_group_name = azurerm_resource_group.edustar.name
  location            = azurerm_resource_group.edustar.location

  destinations {
    log_analytics {
      workspace_resource_id = azurerm_log_analytics_workspace.edustar.id
      name                  = "edustar-logs-dest"
    }
  }

  data_sources {
    performance_counter {
      streams                       = ["Microsoft-Perf"]
      sampling_frequency_in_seconds = 60
      counter_specifiers = [
        "\\Processor(_Total)\\% Processor Time",
        "\\Memory\\% Committed Bytes In Use",
        "\\Memory\\Available Bytes",
        "\\LogicalDisk(_Total)\\% Disk Time",
        "\\Network Interface(*)\\Bytes Total/sec"
      ]
      name = "perf-counters"
    }
  }

  data_flow {
    streams      = ["Microsoft-Perf"]
    destinations = ["edustar-logs-dest"]
  }
}

# =============================================================================
# ACTION GROUPS (Alert Destinations)
# =============================================================================

# Auto-created by Azure Recommendations
resource "azurerm_monitor_action_group" "recommended" {
  name                = "RecommendedAlertRules-AG-1"
  resource_group_name = azurerm_resource_group.edustar.name
  short_name          = "recalert1"

  email_receiver {
    name                    = "Email0_-EmailAction-"
    email_address           = "abayavefe@gmail.com"
    use_common_alert_schema = true
  }

  azure_app_push_receiver {
    name          = "AzureApp0_-AzureAppAction-"
    email_address = "abayavefe@gmail.com"
  }
}

# Custom EduStar alert action group
resource "azurerm_monitor_action_group" "edustar" {
  name                = "edustar-alerts"
  resource_group_name = azurerm_resource_group.edustar.name
  location            = "swedencentral" # must match existing
  short_name          = "EduStar"
}

# =============================================================================
# ALERT RULES
# =============================================================================

# 1. Percentage CPU > 80% (Severity 3 - Informational)
resource "azurerm_monitor_metric_alert" "cpu" {
  name                = "Percentage CPU - edustar-vm"
  resource_group_name = azurerm_resource_group.edustar.name
  scopes              = [azurerm_linux_virtual_machine.vm.id]
  description         = "Alert when CPU on edustar-vm exceeds 80%"
  severity            = 3
  frequency           = "PT5M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Compute/virtualMachines"
    metric_name      = "Percentage CPU"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80.0
  }

  action {
    action_group_id = azurerm_monitor_action_group.recommended.id
  }
}

# 2. VM Unavailable (Severity 1 - Error)
resource "azurerm_monitor_metric_alert" "vm_unavailable" {
  name                = "VM Unavailable - edustar-vm"
  resource_group_name = azurerm_resource_group.edustar.name
  scopes              = [azurerm_linux_virtual_machine.vm.id]
  description         = "Alert when VM availability drops below 1"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Compute/virtualMachines"
    metric_name      = "VmAvailabilityMetric"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 1.0
  }

  action {
    action_group_id = azurerm_monitor_action_group.edustar.id
  }
}

# 3. VM Unavailable Metric (Minimum aggregation, Severity 1)
resource "azurerm_monitor_metric_alert" "vm_unavailable_metric" {
  name                = "VM-Unavailable-Metric"
  resource_group_name = azurerm_resource_group.edustar.name
  scopes              = [azurerm_linux_virtual_machine.vm.id]
  description         = "VM availability below 1 for 5 min"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Compute/virtualMachines"
    metric_name      = "VmAvailabilityMetric"
    aggregation      = "Minimum"
    operator         = "LessThan"
    threshold        = 1.0
  }

  action {
    action_group_id = azurerm_monitor_action_group.edustar.id
  }
}

# 4. Low Available Memory < 500 MB (Severity 2 - Warning)
resource "azurerm_monitor_metric_alert" "low_memory" {
  name                = "Low Available Memory - edustar-vm"
  resource_group_name = azurerm_resource_group.edustar.name
  scopes              = [azurerm_linux_virtual_machine.vm.id]
  description         = "Alert when available memory on edustar-vm drops below 500 MB"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Compute/virtualMachines"
    metric_name      = "Available Memory Bytes"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 524288000.0
  }

  action {
    action_group_id = azurerm_monitor_action_group.edustar.id
  }
}

# 5. VM Deallocated Alert (Activity Log)
resource "azurerm_monitor_activity_log_alert" "vm_deallocated" {
  name                = "VM-Deallocated-Alert"
  resource_group_name = azurerm_resource_group.edustar.name
  description         = "Alert when VM is deallocated/stopped"

  scopes = [azurerm_resource_group.edustar.id]

  criteria {
    category       = "Administrative"
    operation_name = "Microsoft.Compute/virtualMachines/deallocate/action"
    status         = "Started"
  }

  action {
    action_group_id = azurerm_monitor_action_group.edustar.id
  }
}

# 6. HTTP Error Rate 401-403-500 (Scheduled Query Alert)
resource "azurerm_monitor_scheduled_query_rules_alert_v2" "http_errors" {
  name                = "HTTP Error Rate 401-403-500"
  resource_group_name = azurerm_resource_group.edustar.name
  location            = azurerm_resource_group.edustar.location

  evaluation_frequency = "PT5M"
  window_duration      = "PT5M"
  severity             = 2
  description          = "Alert when HTTP 401/403/500 errors exceed threshold"

  scopes = [azurerm_log_analytics_workspace.edustar.id]

  criteria {
    query = <<-KQL
      Syslog
      | where Facility contains "auth" or Facility contains "daemon"
      | where SeverityLevel in ("err", "warning")
      | summarize count() by Computer, Facility, SeverityLevel
    KQL

    time_aggregation_method = "Count"
    threshold               = 10
    operator                = "GreaterThan"

    metric_measure_column = "count_"
    resource_id_column    = "Computer"
  }

  action {
    action_groups = [azurerm_monitor_action_group.edustar.id]
  }
}

# =============================================================================
# DASHBOARD
# =============================================================================
resource "azurerm_portal_dashboard" "edustar" {
  name                = "edustar-dashboard"
  resource_group_name = azurerm_resource_group.edustar.name
  location            = azurerm_resource_group.edustar.location

  tags = {
    hidden-title = "EduStar Dashboard"
  }

  dashboard_properties = <<DASH
{
  "lenses": [
    {
      "order": 0,
      "parts": [
        {
          "position": {"x": 0, "y": 0, "rowSpan": 4, "colSpan": 6},
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {"id": "${azurerm_linux_virtual_machine.vm.id}"},
                        "name": "Percentage CPU",
                        "aggregationType": 4,
                        "namespace": "Microsoft.Compute/virtualMachines",
                        "metricVisualization": {"displayName": "Percentage CPU"}
                      }
                    ],
                    "title": "VM CPU Usage",
                    "visualization": {"chartType": 2, "legendVisualization": {"isVisible": true}}
                  }
                }
              }
            }
          }
        },
        {
          "position": {"x": 6, "y": 0, "rowSpan": 4, "colSpan": 6},
          "metadata": {
            "inputs": [],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {"id": "${azurerm_linux_virtual_machine.vm.id}"},
                        "name": "Available Memory Bytes",
                        "aggregationType": 4,
                        "namespace": "Microsoft.Compute/virtualMachines",
                        "metricVisualization": {"displayName": "Available Memory %"}
                      }
                    ],
                    "title": "VM Available Memory",
                    "visualization": {"chartType": 2}
                  }
                }
              }
            }
          }
        },
        {
          "position": {"x": 0, "y": 4, "rowSpan": 4, "colSpan": 6},
          "metadata": {
            "inputs": [],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {"id": "${azurerm_postgresql_flexible_server.edustar.id}"},
                        "name": "cpu_percent",
                        "aggregationType": 4,
                        "namespace": "Microsoft.DBforPostgreSQL/flexibleServers",
                        "metricVisualization": {"displayName": "PostgreSQL CPU"}
                      }
                    ],
                    "title": "PostgreSQL CPU",
                    "visualization": {"chartType": 2}
                  }
                }
              }
            }
          }
        },
        {
          "position": {"x": 6, "y": 4, "rowSpan": 4, "colSpan": 6},
          "metadata": {
            "inputs": [],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {"id": "${azurerm_postgresql_flexible_server.edustar.id}"},
                        "name": "active_connections",
                        "aggregationType": 4,
                        "namespace": "Microsoft.DBforPostgreSQL/flexibleServers",
                        "metricVisualization": {"displayName": "Active Connections"}
                      }
                    ],
                    "title": "PostgreSQL Active Connections",
                    "visualization": {"chartType": 2}
                  }
                }
              }
            }
          }
        }
      ]
    }
  ]
}
DASH
}
