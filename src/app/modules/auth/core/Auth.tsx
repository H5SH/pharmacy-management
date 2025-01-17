// @ts-nocheck
import {
  createContext,
  Dispatch,
  FC,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { WithChildren } from '../../../../_metronic/helpers'
import { auth } from '../../../../firebase/config'
import SplashScreen from '../components/SplashScreen'
import { UserModel } from './_models'

type AuthContextProps = {
  currentUser: UserModel | undefined
  setCurrentUser: Dispatch<SetStateAction<UserModel | undefined>>
  logout: () => void
}

const initAuthContextPropsState = {
  currentUser: undefined,
  setCurrentUser: () => {},
  logout: () => {},
}

const AuthContext = createContext<AuthContextProps>(initAuthContextPropsState)

const useAuth = () => {
  return useContext(AuthContext)
}

const AuthProvider: FC<WithChildren> = ({children}) => {
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>()

  const logout = () => {
    setCurrentUser(undefined)
    auth.signOut()
  }

  return (
    <AuthContext.Provider value={{currentUser, setCurrentUser, logout}}>
      {children}
    </AuthContext.Provider>
  )
}

const AuthInit: FC<WithChildren> = ({children}) => {
  const didRequest = useRef(false)
  const {setCurrentUser} = useAuth()
  const [showSplashScreen, setShowSplashScreen] = useState(true)
  // We should request user by authToken (IN OUR EXAMPLE IT'S API_TOKEN) before rendering the application
  useEffect(() => {
    auth.onAuthStateChanged((user)=>{
      if(user?.emailVerified){
        setCurrentUser({...user})
      }
      setShowSplashScreen(false)
    })
  }, [])

  return showSplashScreen ? <SplashScreen />:<>{children}</> 
}

export { AuthInit, AuthProvider, useAuth }

