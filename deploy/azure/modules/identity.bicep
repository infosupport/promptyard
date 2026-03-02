@description('Azure region for the identity')
param location string

@description('Name of the managed identity')
param identityName string

@description('Resource ID of the ACR to grant AcrPush access')
param acrId string

@description('GitHub organization/owner name')
param githubOrg string

@description('GitHub repository name')
param githubRepo string

@description('Tags to apply to the identity')
param tags object = {}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
  tags: tags
}

resource federatedCredential 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: identity
  name: 'github-actions'
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:${githubOrg}/${githubRepo}:ref:refs/heads/main'
    audiences: ['api://AzureADTokenExchange']
  }
}

@description('Built-in AcrPush role definition')
resource acrPushRole 'Microsoft.Authorization/roleDefinitions@2022-04-01' existing = {
  name: '8311e382-0749-4cb8-b61a-304f252e45ec'
  scope: subscription()
}

resource acrPushAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(identity.id, acrId, acrPushRole.id)
  scope: acr
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: acrPushRole.id
  }
}

@description('Reference to the ACR for scoping the role assignment')
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: last(split(acrId, '/'))
}

@description('Client ID of the managed identity (use in GitHub Actions)')
output clientId string = identity.properties.clientId

@description('Principal ID of the managed identity')
output principalId string = identity.properties.principalId

@description('Resource ID of the managed identity')
output identityId string = identity.id
