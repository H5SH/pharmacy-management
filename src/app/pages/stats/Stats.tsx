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
import { useAppContext } from '../../../utils/appContext'
import { useAuth } from '../../modules/auth'


const DashboardPage = () => {

  const {predictionData, setPredictionData, predictionByName, setPredictionByName, selectedMedName, setSelectedMedName, meds, setMeds, percentage, setPercentage} = useAppContext()
  const {currentUser} = useAuth()


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
        const response = await fetch(`${process.env.REACT_APP_SALES_PREDICTION}/predict-sales-medicine/?name=${selectedMedName}`)
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
      const response = await getDocs(query(collection(firestore, 'pharmacy', currentUser.uid || '', "medicines")))
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
      const response = await fetch(`${process.env.REACT_APP_SALES_PREDICTION}/predict-sales`)
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
    getAllMeds()
    // We have to show toolbar only for dashboard page
    document.getElementById('kt_layout_toolbar')?.classList.remove('d-none')
    return () => {
      document.getElementById('kt_layout_toolbar')?.classList.add('d-none')
    }
  }, [])

  console.log(meds, 'meds')

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
            description='medications'
            descriptionColor='white'
          />
        </div>

        <div className='col-xl-4'>
          <StatisticsWidget5
            className='card-xl-stretch mb-xl-8'
            svgIcon='cheque'
            color='primary'
            iconColor='white'
            title={`Total Meds: ${meds?.length}`}
            titleColor='white'
            descriptionColor='white'
            description={`Tablets: ${meds?.filter((med)=> med.medicineType === 'liquid').length}, liquid: ${meds?.filter((med)=> med.medicineType === 'tablets').length}, Others: ${meds?.filter((med)=> med.medicineType === 'powder').length}`}
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
            description={`${percentage}% Increased for FY25`}
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
