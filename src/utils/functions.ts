import { UserModel } from "../app/modules/auth"
import { UserRole } from "./model"

export function getPharmacyId(currentUser: UserModel){
    if(currentUser.role === UserRole.PHARMACY_ADMIN){
      return currentUser.uid
    }else if(currentUser.admin){
      return currentUser.admin.uid
    }else{
      return currentUser.pharmacyId
    }
  }