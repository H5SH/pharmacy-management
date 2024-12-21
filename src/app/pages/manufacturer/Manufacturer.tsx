import React, { useState, useEffect } from 'react'
import { Card, Modal, Offcanvas } from 'react-bootstrap'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { firestore as db } from '../../../firebase/config'
import { useFormik } from 'formik'
import * as Yup from 'yup'

interface Manufacturer {
  id: string
  name: string
}

export default function Manufacturer() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [showDrawer, setShowDrawer] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null)

  const fetchManufacturers = async () => {
    const querySnapshot = await getDocs(collection(db, 'manufacturers'))
    const manufacturerList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }))
    setManufacturers(manufacturerList)
  }

  useEffect(() => {
    fetchManufacturers()
  }, [])

  const formik = useFormik({
    initialValues: {
      name: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Manufacturer name is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        if (selectedManufacturer) {
          await updateDoc(doc(db, 'manufacturers', selectedManufacturer.id), {
            name: values.name,
          })
        } else {
          await addDoc(collection(db, 'manufacturers'), {
            name: values.name,
          })
        }
        resetForm()
        setShowDrawer(false)
        setSelectedManufacturer(null)
        fetchManufacturers()
      } catch (error) {
        console.error('Error saving manufacturer:', error)
      }
    },
  })

  const handleEdit = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer)
    formik.setValues({ name: manufacturer.name })
    setShowDrawer(true)
  }

  const handleDelete = async () => {
    if (selectedManufacturer) {
      try {
        await deleteDoc(doc(db, 'manufacturers', selectedManufacturer.id))
        setShowDeleteModal(false)
        setSelectedManufacturer(null)
        fetchManufacturers()
      } catch (error) {
        console.error('Error deleting manufacturer:', error)
      }
    }
  }

  const handleAddNew = () => {
    setSelectedManufacturer(null)
    formik.resetForm()
    setShowDrawer(true)
  }

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

      <Offcanvas show={showDrawer} onHide={() => setShowDrawer(false)} placement='end'>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            {selectedManufacturer ? 'Edit Manufacturer' : 'Add New Manufacturer'}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <form onSubmit={formik.handleSubmit}>
            <div className='mb-3'>
              <label className='form-label required'>Manufacturer Name</label>
              <input
                type='text'
                className={`form-control ${
                  formik.touched.name && formik.errors.name ? 'is-invalid' : ''
                }`}
                {...formik.getFieldProps('name')}
              />
              {formik.touched.name && formik.errors.name && (
                <div className='invalid-feedback'>{formik.errors.name}</div>
              )}
            </div>
            <div className='text-end'>
              <button type='submit' className='btn btn-primary'>
                {selectedManufacturer ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </Offcanvas.Body>
      </Offcanvas>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete {selectedManufacturer?.name}? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-light' onClick={() => setShowDeleteModal(false)}>
            Cancel
          </button>
          <button className='btn btn-danger' onClick={handleDelete}>
            Delete
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}