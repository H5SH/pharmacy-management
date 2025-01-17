import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { MenuComponent } from '../assets/ts/components'
import { ActivityDrawer, DrawerMessenger, InviteUsers, UpgradePlan } from '../partials'
import { AsideDefault } from './components/aside/AsideDefault'
import { Content } from './components/Content'
import { Footer } from './components/Footer'
import { HeaderWrapper } from './components/header/HeaderWrapper'
import { ScrollTop } from './components/ScrollTop'
import { Toolbar } from './components/toolbar/Toolbar'
import { PageDataProvider } from './core'

const MasterLayout = () => {
  const location = useLocation()

  useEffect(() => {
    setTimeout(() => {
      MenuComponent.reinitialization()
    }, 500)
  }, [location.key])

  return (
    <PageDataProvider>
      <div className='d-flex flex-column flex-root'>
        {/* begin::Page */}
        <div className='page d-flex flex-row flex-column-fluid'>
          <AsideDefault />
          {/* begin::Wrapper */}
          <div className='wrapper d-flex flex-column flex-row-fluid' id='kt_wrapper'>
            <HeaderWrapper /> 

            <Toolbar />

            <ToastContainer />

            {/* begin::Content */}
            <div id='kt_content' className='content d-flex flex-column flex-column-fluid'>
              <Content>
                <Outlet />
              </Content>
            </div>
            {/* end::Content */}
            <Footer />
          </div>
          {/* end::Wrapper */}
        </div>
        {/* end::Page */}
      </div>

      {/* begin:: Drawers */}
      <ActivityDrawer />
      {/* <RightToolbar /> */}
      <DrawerMessenger />
      {/* end:: Drawers */}

      {/* begin:: Modals */}
      <InviteUsers /> 
      <UpgradePlan />
      {/* end:: Modals */}
      <ScrollTop />
    </PageDataProvider>
  )
}

export { MasterLayout }

