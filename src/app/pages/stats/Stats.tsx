import {useEffect, useState} from 'react'
import {useIntl} from 'react-intl'
import {PageTitle} from '../../../_metronic/layout/core'
import {
  MixedWidget6,
  MixedWidget7,
  MixedWidget8,
  StatisticsWidget5,
} from '../../../_metronic/partials/widgets'
import { PredictionData, PredictionModel } from '../../../utils/model'


const DashboardPage = () => {

  const [predictionData, setPredictionData] = useState<PredictionModel | undefined>()

  async function getSalePrediction(){
    try{
      const response = await fetch('http://127.0.0.1:8000/predict-sales')
      const result: Array<PredictionData> = await response.json()
      console.log(result, 'result')
      if(Array.isArray(result)){
        const dates = []
        const yhat = []
        const yhat_lower = []
        const yhat_upper = []
        result.map((row: PredictionData, index)=> {
            dates.push(row.ds.split('T')[0])
            yhat.push(Math.floor(row.yhat / 10))
            yhat_lower.push(Math.floor(row.yhat_lower / 10))
            yhat_upper.push(Math.floor(row.yhat_upper / 10))
        })
        setPredictionData({dates, yhat, yhat_lower, yhat_upper})
      }
    }catch(er){
      console.log(er)
    }
  }

  useEffect(() => {
    getSalePrediction()
    // We have to show toolbar only for dashboard page
    document.getElementById('kt_layout_toolbar')?.classList.remove('d-none')
    return () => {
      document.getElementById('kt_layout_toolbar')?.classList.add('d-none')
    }
  }, [])

  return (
    <>
      <PageTitle breadcrumbs={[]} description='#XRS-45670'>
        Dashboard
      </PageTitle>
      <div className='row g-5 g-xl-8'>
        <div className='col-xl-4'>
          <StatisticsWidget5
            className='card-xl-stretch mb-xl-8'
            svgIcon='basket'
            color='danger'
            iconColor='white'
            title='Shopping Cart'
            titleColor='white'
            description='Lands, Houses, Ranchos, Farms'
            descriptionColor='white'
          />
        </div>

        <div className='col-xl-4'>
          <StatisticsWidget5
            className='card-xl-stretch mb-xl-8'
            svgIcon='cheque'
            color='primary'
            iconColor='white'
            title='Total Meds: 50'
            titleColor='white'
            descriptionColor='white'
            description='Tablets: 10, liquid: 30, Others: 10'
          />
        </div>

        <div className='col-xl-4'>
          <StatisticsWidget5
            className='card-xl-stretch mb-5 mb-xl-8'
            svgIcon='chart-simple-3'
            color='success'
            iconColor='white'
            titleColor='white'
            descriptionColor='white'
            title='Sales Stats'
            description='50% Increased for FY20'
          />
        </div>
      </div>

      <div className='row gy-5 g-xl-8'>
        <div className='col-xl-4'>
          <MixedWidget6
            className='card-xl-stretch mb-xl-8'
            chartColor='primary'
            chartHeight='150px'
          />
        </div>

        <div className='col-xl-4'>
          <MixedWidget7 className='card-xl-stretch' chartColor='primary' chartHeight='225px' />
        </div>

        <div className='col-xl-4'>
          <MixedWidget8
            className='card-xl-stretch mb-5 mb-xl-8'
            chartColor='danger'
            chartHeight='150px'
            predictionData={predictionData}
          />
        </div>
      </div>

      {/* <div className='row gy-5 g-xl-8'>
        <div className='col-xxl-4'>
          <ListsWidget9 className='card-xxl-stretch' />
        </div>

        <div className='col-xxl-8'>
          <TablesWidget9 className='card-xxl-stretch mb-5 mb-xl-8' />
        </div>
      </div>

      <div className='row g-5 g-xl-8'>
        <div className='col-xl-4'>
          <ListsWidget4 className='card-xl-stretch mb-xl-8' />
        </div>

        <div className='col-xl-4'>
          <ListsWidget5 className='card-xl-stretch mb-xl-8' />
        </div>

        <div className='col-xl-4'>
          <ListsWidget3 className='card-xl-stretch mb-5 mb-xl-8' />
        </div>
      </div>

      <div className='g-5 gx-xxl-8'>
        <TablesWidget11 className='' />
      </div> */}
    </>
  )
}

const DashboardWrapper = () => {
  const intl = useIntl()
  return (
    <>
      <PageTitle breadcrumbs={[]}>{intl.formatMessage({id: 'MENU.DASHBOARD'})}</PageTitle>
      <DashboardPage />
    </>
  )
}

export {DashboardWrapper}
