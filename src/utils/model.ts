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

  export interface PredictionData {
    ds: string
    yhat: number
    yhat_lower: number
    yhat_upper: number
  }

  export interface PredictionModel{
    dates: Array<string>
    yhat: Array<number>
    yhat_lower: Array<number>
    yhat_upper: Array<number>
  }
  