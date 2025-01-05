export interface Medicine {
    id: string
    name: string
    manufacturerId: string
    manufacturerName: string
    chemicals: string
    description: string
    customFields: Array<{ key: string; value: string }>
  }
  
  export interface Manufacturer {
    id: string
    name: string
  }