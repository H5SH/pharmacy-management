import { toast } from "react-toastify";


export function Toast(type:string, msg:string){
    toast[type](msg)
}