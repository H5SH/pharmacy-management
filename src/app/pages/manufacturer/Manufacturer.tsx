import React, { useState, useEffect } from 'react'
import { Card } from 'react-bootstrap'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { firestore as db } from '../../../firebase/config'
import { useAppContext } from '../../../utils/appContext'
import ManufacturerForm from './form/ManufacturerForm'
import { DeleteModal } from '../../../utils/component/DeleteModal'
import { Manufacturer as ManufacturerModal} from '../../../utils/model'
import { Toast } from '../../../utils/utilities'



export default function Manufacturer() {

  const {refresh} = useAppContext()
  const [manufacturers, setManufacturers] = useState<ManufacturerModal[]>([])
  const [showDrawer, setShowDrawer] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedManufacturer, setSelectedManufacturer] = useState<ManufacturerModal | null>(null)

  const fetchManufacturers = async () => {
    const querySnapshot = await getDocs(collection(db, 'manufacturers'))
    const manufacturerList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }))
    setManufacturers(manufacturerList)
  }

  
  const handleEdit = (manufacturer: ManufacturerModal) => {
    setSelectedManufacturer(manufacturer)
    setShowDrawer(true)
  }
  
  const handleDelete = async () => {
    if (selectedManufacturer) {
      try {
        await deleteDoc(doc(db, 'manufacturers', selectedManufacturer.id))
        Toast('success', 'Deleted Successfully')
        setShowDeleteModal(false)
        setSelectedManufacturer(null)
        fetchManufacturers()
      } catch (error) {
        Toast('error', 'Something Went Wrong')
        console.error('Error deleting manufacturer:', error)
      }
    }
  }
  
  const handleAddNew = () => {
    setSelectedManufacturer(null)
    setShowDrawer(true)
  }

  useEffect(() => {
    fetchManufacturers()
  }, [refresh])

  return (
    <div className='container-fluid'>
      <Card className='shadow-sm'>
        <Card.Header className='border-0 pt-5'>
          <h3 className='card-title align-items-start flex-column'>
            <span className='card-label fw-bold fs-3 mb-1'>Manufacturers</span>
          </h3>
          <div className='card-toolbar'>
            <button className='btn btn-primary' onClick={handleAddNew}>
              Add New Manufacturer
            </button>
          </div>
        </Card.Header>
        <Card.Body>
          <div className='table-responsive'>
            <table className='table align-middle table-row-dashed fs-6 gy-5'>
              <thead>
                <tr className='text-start text-muted fw-bold fs-7 text-uppercase gs-0'>
                  <th>Name</th>
                  <th className='text-end'>Actions</th>
                </tr>
              </thead>
              <tbody className='text-gray-600 fw-semibold'>
                {manufacturers.map((manufacturer) => (
                  <tr key={manufacturer.id}>
                    <td>{manufacturer.name}</td>
                    <td className='text-end'>
                      <button
                        className='btn btn-sm btn-light-primary me-2'
                        onClick={() => handleEdit(manufacturer)}
                      >
                        Edit
                      </button>
                      <button
                        className='btn btn-sm btn-light-danger'
                        onClick={() => {
                          setSelectedManufacturer(manufacturer)
                          setShowDeleteModal(true)
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      <ManufacturerForm setShowDrawer={setShowDrawer} setSelectedManufacturer={setSelectedManufacturer} selectedManufacturer={selectedManufacturer} showDrawer={showDrawer}/>

      <DeleteModal showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal} handleDelete={handleDelete} item={selectedManufacturer}/>
    </div>
  )
}