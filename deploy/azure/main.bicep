targetScope = 'subscription'

@description('Azure region for all resources')
param location string

@description('Number of AKS nodes')
@minValue(1)
@maxValue(10)
param nodeCount int = 4

@description('VM size for AKS nodes')
param nodeVmSize string = 'Standard_D2as_v5'

@description('Kubernetes version (empty string = latest stable)')
param kubernetesVersion string = ''

@description('GitHub organization/owner for federated credential')
param githubOrg string

@description('GitHub repository name for federated credential')
param githubRepo string

var resourceGroupName = 'rg-promptyard'
var clusterName = 'aks-promptyard'
var acrName = 'acrpromptyard'
var ciIdentityName = 'id-promptyard-ci'
var tags = {
  project: 'promptyard'
  managedBy: 'bicep'
}

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module acr 'modules/acr.bicep' = {
  name: 'acr'
  scope: rg
  params: {
    location: location
    acrName: acrName
    tags: tags
  }
}

module ciIdentity 'modules/identity.bicep' = {
  name: 'ciIdentity'
  scope: rg
  params: {
    location: location
    identityName: ciIdentityName
    acrId: acr.outputs.acrId
    githubOrg: githubOrg
    githubRepo: githubRepo
    tags: tags
  }
}

module aks 'modules/aks.bicep' = {
  name: 'aks'
  scope: rg
  params: {
    location: location
    clusterName: clusterName
    nodeCount: nodeCount
    nodeVmSize: nodeVmSize
    kubernetesVersion: kubernetesVersion
    acrId: acr.outputs.acrId
    tags: tags
  }
}

@description('Name of the resource group')
output resourceGroupName string = rg.name

@description('ACR login server URL')
output acrLoginServer string = acr.outputs.loginServer

@description('Name of the AKS cluster')
output aksClusterName string = aks.outputs.clusterName

@description('Client ID of the CI managed identity (use in GitHub Actions)')
output ciIdentityClientId string = ciIdentity.outputs.clientId
