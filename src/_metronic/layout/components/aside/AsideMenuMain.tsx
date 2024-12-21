/* eslint-disable react/jsx-no-target-blank */
import { useIntl } from 'react-intl'
import { AsideMenuItemWithSubMain } from './AsideMenuItemWithSubMain'
import { AsideMenuItemWithSub } from './AsideMenuItemWithSub'
import { AsideMenuItem } from './AsideMenuItem'

export function AsideMenuMain() {
  const intl = useIntl()
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

      {/* <AsideMenuItemWithSubMain
        to='/builder'
        title='Resources'
        bsTitle='Resources'
        fontIcon='bi-gear'
      >
        <AsideMenuItem to='/builder' title='Layout builder' fontIcon='bi-layers fs-3' />
        <AsideMenuItem
          to={process.env.REACT_APP_PREVIEW_DOCS_URL + '/docs/changelog'}
          outside={true}
          title={`Changelog ${process.env.REACT_APP_VERSION}`}
          fontIcon='bi-card-text fs-3'
        />
      </AsideMenuItemWithSubMain> */}
    </>
  )
}
