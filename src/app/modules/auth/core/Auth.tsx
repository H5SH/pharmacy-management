// @ts-nocheck
import {
  FC,
  useState,
  useEffect,
  createContext,
  useContext,
  useRef,
  Dispatch,
  SetStateAction,
} from 'react'
import {LayoutSplashScreen} from '../../../../_metronic/layout/core'
import {UserModel} from './_models'
import {WithChildren} from '../../../../_metronic/helpers'
import { auth, firestore } from '../../../../firebase/config'
import { doc, getDoc } from 'firebase/firestore'

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
    auth.onAuthStateChanged(async (user)=>{
      console.log(user, 'user', auth.currentUser)
      setShowSplashScreen(true)
      if(user){
        const _user = await getDoc(doc(firestore, 'users', auth.currentUser?.uid))
        console.log(user?.emailVerified, _user.exists(), 'if')
        if(user?.emailVerified && _user.exists()){
          setCurrentUser({...user, ..._user.data()})
        }
      }
      setShowSplashScreen(false)
    })
  }, [])

  return showSplashScreen ? <LayoutSplashScreen /> : <>{children}</>
}

export {AuthProvider, AuthInit, useAuth}
