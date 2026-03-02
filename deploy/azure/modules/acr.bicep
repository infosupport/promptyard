@description('Azure region for the registry')
param location string

@description('Name of the container registry')
param acrName string

@description('SKU tier for the registry')
@allowed(['Basic', 'Standard', 'Premium'])
param sku string = 'Basic'

@description('Tags to apply to the registry')
param tags object = {}

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: false
  }
}

@description('Resource ID of the container registry')
output acrId string = acr.id

@description('Login server URL of the container registry')
output loginServer string = acr.properties.loginServer

@description('Name of the container registry')
output acrName string = acr.name
