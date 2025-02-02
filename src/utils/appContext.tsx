import { createContext, useContext, useState } from "react";
import { PredictionModel } from "./model";

const AppContext = createContext(null)

export const useAppContext = ()=> useContext(AppContext)

export default function Provider({children}: {children: any}){

    const [refresh, setRefresh] = useState(false)
    const [predictionData, setPredictionData] = useState<PredictionModel | undefined>()
    const [predictionByName, setPredictionByName] = useState<{ dates: Array<string>, yhat: Array<number>, yhat_lower: Array<number>, yhat_upper: Array<number>, average: number, averagelower: number, averageUpper: number } | undefined>();
    const [selectedMedName, setSelectedMedName] = useState<any>();
    const [meds, setMeds] = useState<Array<any>>();
    const [percentage, setPercentage] = useState(0)

    return (
        <AppContext.Provider value={{
            refresh,
            setRefresh,
            predictionData,
            setPredictionData,
            predictionByName,
            setPredictionByName,
            selectedMedName,
            setSelectedMedName,
            meds,
            setMeds,
            percentage,
            setPercentage
        }}>
            {children}
        </AppContext.Provider>

    )
}