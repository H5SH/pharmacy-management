import { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { PageTitle } from '../../../_metronic/layout/core'
import {
  MixedWidget6,
  MixedWidget7,
  MixedWidget8,
  StatisticsWidget5,
} from '../../../_metronic/partials/widgets'
import { PredictionData, PredictionModel } from '../../../utils/model'
import { Toast } from '../../../utils/utilities'
import { collection, getDocs, query } from 'firebase/firestore'
import { firestore } from '../../../firebase/config'


const DashboardPage = () => {

  const [predictionData, setPredictionData] = useState<PredictionModel | undefined>()
  const [predictionByName, setPredictionByName] = useState<{ dates: Array<string>, yhat: Array<number>, yhat_lower: Array<number>, yhat_upper: Array<number>, average: number, averagelower: number, averageUpper: number } | undefined>();
  const [selectedMedName, setSelectedMedName] = useState<any>();
  const [meds, setMeds] = useState<Array<any>>();
  const [percentage, setPercentage] = useState(0)

  function organisePredictionByNameData(result: {name: '', forecast: []}) {
    const dates = []
    const yhat = []
    const yhat_lower = []
    const yhat_upper = []
    let totalSales = 0
    let totalUpperSales = 0
    let totalLowerSales = 0
    result.forecast.map((row: PredictionData) => {
      dates.push(row.ds.split('T')[0])

      totalSales = totalSales + row.yhat
      totalLowerSales = totalLowerSales + row.yhat_lower
      totalUpperSales = totalUpperSales + row.yhat_upper

      yhat.push(Math.floor(row.yhat / 10))
      yhat_lower.push(Math.floor(row.yhat_lower / 10))
      yhat_upper.push(Math.floor(row.yhat_upper / 10))
    })
    const average = Math.floor(totalSales / result.forecast.length)
    const averagelower = Math.floor(totalLowerSales / result.forecast.length)
    const averageUpper = Math.floor(totalUpperSales / result.forecast.length)

    setPredictionByName({ dates, yhat, yhat_lower, yhat_upper, average, averagelower, averageUpper })
  }

  async function getSalesByName() {
    if (selectedMedName) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/predict-sales-medicine/?name=${selectedMedName}`)
        const result = await response.json()
        if (Array.isArray(result.forecast)) {
          organisePredictionByNameData(result)
        }
      } catch (er) {
        console.log(er)
        Toast('error', 'Failed To get Medicines Predictions')
      }
    }
  }

  async function getAllMeds() {
    try {
      // const q = query(collection(firestore, 'medicines'))
      const response = await getDocs(query(collection(firestore, 'medicines')))
      if (!response.empty) {
        setMeds(response.docs.map((med) => med.data()))
        setSelectedMedName(response.docs[0].data().name)
      }
    } catch (er) {
      console.log(er)
    }
  }

  async function getSalePrediction() {
    try {
      const response = await fetch('http://127.0.0.1:8000/predict-sales')
      const result: Array<PredictionData> = await response.json()
      if (Array.isArray(result)) {
        const dates = []
        const yhat = []
        const yhat_lower = []
        const yhat_upper = []
        let average = 0
        result.map((row: PredictionData) => {
          dates.push(row.ds.split('T')[0])
          yhat.push(Math.floor(row.yhat / 10))
          average += row.yhat
          yhat_lower.push(Math.floor(row.yhat_lower / 10))
          yhat_upper.push(Math.floor(row.yhat_upper / 10))
        })
        setPercentage(Math.floor(average / result.length))
        setPredictionData({ dates, yhat, yhat_lower, yhat_upper })
      }
    } catch (er) {
      console.log(er)
    }
  }

  useEffect(() => {
    getSalesByName()
  }, [selectedMedName])

  useEffect(() => {
    getSalePrediction()
    getSalesByName()
    getAllMeds()
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
            meds={meds}
            predictionData={predictionByName}
            setSelectedMedName={setSelectedMedName}
            selectedMedName={selectedMedName}
          />
        </div>

        <div className='col-xl-4'>
          <MixedWidget7 percentage={percentage}  className='card-xl-stretch' chartColor='primary' chartHeight='225px' />
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
      <PageTitle breadcrumbs={[]}>{intl.formatMessage({ id: 'MENU.DASHBOARD' })}</PageTitle>
      <DashboardPage />
    </>
  )
}

export { DashboardWrapper }
