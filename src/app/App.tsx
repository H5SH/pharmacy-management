import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { I18nProvider } from '../_metronic/i18n/i18nProvider'
import { LayoutProvider, LayoutSplashScreen, useLayout } from '../_metronic/layout/core'
import { MasterInit } from '../_metronic/layout/MasterInit'
import { AuthInit } from './modules/auth'
import { ThemeModeProvider } from '../_metronic/partials'
import Provider from '../utils/appContext'
import { ToastContainer } from 'react-toastify'

const App = () => {
  const { classes } = useLayout()

  return (
    <Suspense fallback={<LayoutSplashScreen />}>
      <I18nProvider>
        <LayoutProvider>
          <ThemeModeProvider>
            <AuthInit>
              <Provider>
                <Outlet />
                <MasterInit />
              </Provider>
            </AuthInit>
          </ThemeModeProvider>
        </LayoutProvider>
      </I18nProvider>     
    </Suspense>
  )
}

export { App }
