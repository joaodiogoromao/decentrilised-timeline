import axios from "axios"
import React from "react";
import { useEffect, useState } from "react"

export interface RequireConnectionProps {
    endpoint: string,
    children: JSX.Element
}

enum ErrorStage {
    WAITING,
    NO_ERROR,
    ERROR
}

export const ConnectionContext = React.createContext<string>("");

export const RequireConnection = ({endpoint, children }: RequireConnectionProps) => {
    const [ errorStage, setErrorStage ] = useState(ErrorStage.WAITING)
    const [ data, setData ] = useState("")

    useEffect(() => {
        axios.get(endpoint)
            .then((data) => {
                setData(data.data)
                setErrorStage(ErrorStage.NO_ERROR)
            })
            .catch((err) => {
                console.error(err);
                setErrorStage(ErrorStage.ERROR)
            })
    }, [])

    switch(errorStage) {
        case ErrorStage.WAITING:
            return <p>Trying to connect...</p>
        case ErrorStage.NO_ERROR:
            return <ConnectionContext.Provider value={data}>
                {children}
            </ConnectionContext.Provider>
        case ErrorStage.ERROR:
            return <p style={{color: "red"}}>Unable to connect</p>
    }
}