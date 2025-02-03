import { FC } from 'react'
import clsx from 'clsx'
import { KTIcon, toAbsoluteUrl } from '../../../helpers'
import {
  HeaderNotificationsMenu,
  HeaderUserMenu,
  QuickLinks,
  Search,
  ThemeModeSwitcher,
} from '../../../partials'
import { useLayout } from '../../core'
import { useAppContext } from '../../../../utils/appContext'
import { UserRole } from '../../../../utils/model'
import { useAuth } from '../../../../app/modules/auth'
import { useNavigate } from 'react-router-dom'

const itemClass = 'ms-1 ms-lg-3',
  btnClass = 'btn btn-icon btn-active-light-primary w-30px h-30px w-md-40px h-md-40px',
  userAvatarClass = 'symbol-30px symbol-md-40px'

const Topbar: FC = () => {
  const { config } = useLayout()
  const { currentUser, logout, setCurrentUser } = useAuth()
  const navigate = useNavigate()



  function goAdmin() {
    return currentUser?.role === UserRole.BRANCH_MANAGER && currentUser?.admin?.role === UserRole.PHARMACY_ADMIN
  }

  return (
    <div className='d-flex align-items-stretch flex-shrink-0'>
      {/* Search 
      <div className={clsx('d-flex align-items-stretch', itemClass)}>
        <Search />
      </div>
      */}

      {/* Activities 
      <div className={clsx('d-flex align-items-center', itemClass)}>
       
        <div className={btnClass} id='kt_activities_toggle'>
          <i className='bi bi-bell fs-2' />
        </div>
       
      </div>
      */}

      {/* Quick links 
      <div className={clsx('d-flex align-items-center', itemClass)}>
       
        <div
          className={btnClass}
          data-kt-menu-trigger='click'
          data-kt-menu-attach='parent'
          data-kt-menu-placement='bottom-end'
        >
          <i className='bi bi-clipboard-check fs-2' />
        </div>
        <QuickLinks />
     
      </div>
      


      {/* CHAT 
      <div className={clsx('d-flex align-items-center', itemClass)}>
      
        <div
          className={clsx(
            'btn btn-icon btn-active-light-primary btn-custom position-relative',
            btnClass,
            'pulse pulse-success'
          )}
          id='kt_drawer_chat_toggle'
        >
          <i className='bi bi-app-indicator fs-2' />
          <span className='pulse-ring w-45px h-45px' />
        </div>
       
      </div>
      */}

      <div className='d-flex flex-column'>
        <div className='fw-bolder d-flex align-items-center fs-5 pt-5'>
          {currentUser?.first_name} {currentUser?.first_name}
        </div>
        <a href='#' className='fw-bold text-muted text-hover-primary fs-7'>
          {currentUser?.email}
        </a>
      </div>

      <div className='menu-item px-5'>
        <a onClick={!goAdmin() ? () => logout() : () => {
          setCurrentUser({ ...currentUser.admin })
          navigate('/')
        }} className='menu-link px-5'>
          {goAdmin() ? <i className="bi bi-person-fill-up  fs-1"></i> : <i className="bi bi-box-arrow-right  fs-1 pt-2"></i>}
        </a>
      </div>



      {/* begin::Theme mode */}
      <div className={clsx('d-flex align-items-center', itemClass)}>
        <ThemeModeSwitcher toggleBtnClass={btnClass} />
      </div>
      {/* end::Theme mode */}

      {/* begin::User */}
      {/* <div className={clsx('d-flex align-items-center', itemClass)} id='kt_header_user_menu_toggle'>
        <div
          className={clsx('cursor-pointer symbol', userAvatarClass)}
          data-kt-menu-trigger='click'
          data-kt-menu-attach='parent'
          data-kt-menu-placement='bottom-end'
        >
          <img src={toAbsoluteUrl('/media/avatars/300-1.jpg')} alt='metronic' />
        </div>
        <HeaderUserMenu />
      </div> */}
      {/* end::User */}

      {/* begin::Aside Toggler */}
      {config.header.left === 'menu' && (
        <div className='d-flex align-items-center d-lg-none ms-2' title='Show header menu'>
          <div
            className='btn btn-icon btn-active-color-primary w-30px h-30px w-md-40px h-md-40px'
            id='kt_header_menu_mobile_toggle'
          >
            <KTIcon iconName='text-align-left' className='fs-1' />
          </div>
        </div>
      )}
    </div>
  )
}

export { Topbar }
