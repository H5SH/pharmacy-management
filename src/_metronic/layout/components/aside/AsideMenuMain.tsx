/* eslint-disable react/jsx-no-target-blank */
import { useIntl } from 'react-intl'
import { AsideMenuItemWithSubMain } from './AsideMenuItemWithSubMain'
import { AsideMenuItemWithSub } from './AsideMenuItemWithSub'
import { AsideMenuItem } from './AsideMenuItem'
import { useAuth } from '../../../../app/modules/auth'
import { UserRole } from '../../../../utils/model'

export function AsideMenuMain() {
  const intl = useIntl()
  const { currentUser } = useAuth()
  return (
    <>
      <AsideMenuItem
        to='/dashboard'
        title='Home'
        fontIcon='bi-house fs-2'
        bsTitle={intl.formatMessage({ id: 'MENU.DASHBOARD' })}
        className='py-2'
      />

      <AsideMenuItem
        to='/pharmacist'
        title='Pharmacist'
        fontIcon='bi bi-chat'
        bsTitle={intl.formatMessage({ id: 'MENU.DASHBOARD' })}
        className='py-2'
      />

      <AsideMenuItem
        to='/manufacturer'
        title='Manufacturer'
        fontIcon='bi-file-text'
        bsTitle={intl.formatMessage({ id: 'MENU.DASHBOARD' })}
        className='py-2'
      />

      <AsideMenuItem
        to='/medicines'
        title='Medicines'
        fontIcon='bi-file-medical fs-2'
        bsTitle={intl.formatMessage({ id: 'MENU.DASHBOARD' })}
        className='py-2'
      />
      
      {currentUser?.role === UserRole.PHARMACY_ADMIN ? (
        <>
          <AsideMenuItem
            to='/branch'
            title='Branch'
            fontIcon='bi-house fs-2'
            bsTitle={intl.formatMessage({ id: 'MENU.DASHBOARD' })}
            className='py-2'
          />
        </>
      ) : (
        <>
          <AsideMenuItem
            to='/stats'
            title='Stats'
            fontIcon='bi bi-speedometer2 fs-2'
            bsTitle={intl.formatMessage({ id: 'MENU.DASHBOARD' })}
            className='py-2'
          />
        </>
      )
      }
    </>
  )
}
