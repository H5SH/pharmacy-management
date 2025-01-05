import { createContext, useContext, useState } from "react";

const AppContext = createContext(null)

export const useAppContext = ()=> useContext(AppContext)

export default function Provider({children}: {children: any}){

    const [refresh, setRefresh] = useState(false)

    return (
        <AppContext.Provider value={{
            refresh,
            setRefresh
        }}>
            {children}
        </AppContext.Provider>
    )
}