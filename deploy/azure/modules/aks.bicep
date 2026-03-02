@description('Azure region for the cluster')
param location string

@description('Name of the AKS cluster')
param clusterName string

@description('Number of nodes in the system pool')
@minValue(1)
@maxValue(10)
param nodeCount int = 3

@description('VM size for the system node pool')
param nodeVmSize string = 'Standard_D2as_v5'

@description('Kubernetes version (empty string = latest stable)')
param kubernetesVersion string = ''

@description('Resource ID of the ACR to grant AcrPull access')
param acrId string

@description('Tags to apply to the cluster')
param tags object = {}

resource aks 'Microsoft.ContainerService/managedClusters@2024-01-01' = {
  name: clusterName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    kubernetesVersion: kubernetesVersion != '' ? kubernetesVersion : null
    dnsPrefix: clusterName
    agentPoolProfiles: [
      {
        name: 'system'
        count: nodeCount
        vmSize: nodeVmSize
        mode: 'System'
        osType: 'Linux'
        osDiskType: 'Managed'
        osDiskSizeGB: 30
      }
    ]
    networkProfile: {
      networkPlugin: 'azure'
      networkPluginMode: 'overlay'
      loadBalancerSku: 'standard'
    }
    oidcIssuerProfile: {
      enabled: true
    }
    securityProfile: {
      workloadIdentity: {
        enabled: true
      }
    }
  }
}

@description('Built-in AcrPull role definition')
resource acrPullRole 'Microsoft.Authorization/roleDefinitions@2022-04-01' existing = {
  name: '7f951dda-4ed3-4680-a7ca-43fe172d538d'
  scope: subscription()
}

resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(aks.id, acrId, acrPullRole.id)
  properties: {
    principalId: aks.properties.identityProfile.kubeletidentity.objectId
    principalType: 'ServicePrincipal'
    roleDefinitionId: acrPullRole.id
  }
}

@description('Name of the AKS cluster')
output clusterName string = aks.name
