// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { Card, Modal, Offcanvas } from 'react-bootstrap'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import {firestore} from '../../../firebase/config'
import { useFormik, FieldArray, FormikProvider } from 'formik'
import * as Yup from 'yup'
import { Manufacturer, Medicine } from '../../../utils/model'
import MedicinesForm from './form/MedicinesForm'
import { useAppContext } from '../../../utils/appContext'
import { DeleteModal } from '../../../utils/component/DeleteModal'
import { Toast } from '../../../utils/utilities'


export default function Medicines() {

  const {refresh, setRefresh} = useAppContext()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [showDrawer, setShowDrawer] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)

  const fetchManufacturers = async () => {
    const querySnapshot = await getDocs(collection(firestore, 'manufacturers'))
    const manufacturerList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }))
    setManufacturers(manufacturerList)
  }

  const fetchMedicines = async () => {
    const querySnapshot = await getDocs(collection(firestore, 'medicines'))
    const medicineList = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data()
        const manufacturer = manufacturers.find((m) => m.id === data.manufacturerId)
        return {
          id: doc.id,
          name: data.name,
          manufacturerId: data.manufacturerId,
          manufacturerName: manufacturer?.name || 'Unknown',
          chemicals: data.chemicals,
          description: data.description,
          customFields: data.customFields || [],
        }
      })
    )
    setMedicines(medicineList)
  }

  
  const handleEdit = (medicine: Medicine) => {
    setSelectedMedicine(medicine)
    setShowDrawer(true)
  }
  
  const handleDelete = async () => {
    if (selectedMedicine) {
      try {
        await deleteDoc(doc(firestore, 'medicines', selectedMedicine.id))
        Toast('success', 'Deleted Successfuly')
        setShowDeleteModal(false)
        setSelectedMedicine(null)
        setRefresh(!refresh)
      } catch (error) {
        Toast('error', 'Something Went Wrong PLease Try Again')
        console.error('Error deleting medicine:', error)
      }
    }
  }
  
  const handleAddNew = () => {
    setSelectedMedicine(null)
    setShowDrawer(true)
  }

  useEffect(() => {
    fetchManufacturers()
  }, [])

  useEffect(() => {
    if (manufacturers.length > 0) {
      fetchMedicines()
    }
  }, [manufacturers, refresh])

  return (
    <div className='container-fluid'>
      <Card className='shadow-sm'>
        <Card.Header className='border-0 pt-5'>
          <h3 className='card-title align-items-start flex-column'>
            <span className='card-label fw-bold fs-3 mb-1'>Medicines</span>
          </h3>
          <div className='card-toolbar'>
            <button className='btn btn-primary' onClick={handleAddNew}>
              Add New Medicine
            </button>
          </div>
        </Card.Header>
        <Card.Body>
          <div className='table-responsive'>
            <table className='table align-middle table-row-dashed fs-6 gy-5'>
              <thead>
                <tr className='text-start text-muted fw-bold fs-7 text-uppercase gs-0'>
                  <th>Name</th>
                  <th>Manufacturer</th>
                  <th>Chemicals</th>
                  <th>Description</th>
                  <th className='text-end'>Actions</th>
                </tr>
              </thead>
              <tbody className='text-gray-600 fw-semibold'>
                {medicines.map((medicine) => (
                  <tr key={medicine.id}>
                    <td>{medicine.name}</td>
                    <td>{medicine.manufacturerName}</td>
                    <td>{medicine.chemicals}</td>
                    <td>{medicine.description}</td>
                    <td className='text-end'>
                      <button
                        className='btn btn-sm btn-light-primary me-2'
                        onClick={() => handleEdit(medicine)}
                      >
                            <i className="bi bi-pencil fs-1"></i>
                      </button>
                      <button
                        className='btn btn-sm btn-light-danger'
                        onClick={() => {
                          setSelectedMedicine(medicine)
                          setShowDeleteModal(true)
                        }}
                      >
                            <i class="bi bi-trash fs-1"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      <MedicinesForm setShowDrawer={setShowDrawer} showDrawer={showDrawer} manufacturers={manufacturers} medicine={selectedMedicine} setMedicine={setSelectedMedicine}/>

      <DeleteModal showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal} item={selectedMedicine} handleDelete={handleDelete}/>
    </div>
  )
}