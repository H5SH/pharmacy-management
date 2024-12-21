// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { Card, Modal, Offcanvas } from 'react-bootstrap'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import {firestore} from '../../../firebase/config'
import { useFormik, FieldArray, FormikProvider } from 'formik'
import * as Yup from 'yup'

interface Medicine {
  id: string
  name: string
  manufacturerId: string
  manufacturerName: string
  chemicals: string
  description: string
  customFields: Array<{ key: string; value: string }>
}

interface Manufacturer {
  id: string
  name: string
}

export default function Medicines() {
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

  useEffect(() => {
    fetchManufacturers()
  }, [])

  useEffect(() => {
    if (manufacturers.length > 0) {
      fetchMedicines()
    }
  }, [manufacturers])

  const formik = useFormik({
    initialValues: {
      name: '',
      manufacturerId: '',
      chemicals: '',
      description: '',
      customFields: [{ key: '', value: '' }],
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Medicine name is required'),
      manufacturerId: Yup.string().required('Manufacturer is required'),
      chemicals: Yup.string().required('Chemicals are required'),
      description: Yup.string().required('Description is required'),
      customFields: Yup.array().of(
        Yup.object().shape({
          key: Yup.string().required('Field name is required'),
          value: Yup.string().required('Field value is required'),
        })
      ),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const medicineData = {
          name: values.name,
          manufacturerId: values.manufacturerId,
          chemicals: values.chemicals,
          description: values.description,
          customFields: values.customFields,
        }

        if (selectedMedicine) {
          await updateDoc(doc(firestore, 'medicines', selectedMedicine.id), medicineData)
        } else {
          await addDoc(collection(firestore, 'medicines'), medicineData)
        }
        resetForm()
        setShowDrawer(false)
        setSelectedMedicine(null)
        fetchMedicines()
      } catch (error) {
        console.error('Error saving medicine:', error)
      }
    },
  })

  const handleEdit = (medicine: Medicine) => {
    setSelectedMedicine(medicine)
    formik.setValues({
      name: medicine.name,
      manufacturerId: medicine.manufacturerId,
      chemicals: medicine.chemicals,
      description: medicine.description,
      customFields: medicine.customFields,
    })
    setShowDrawer(true)
  }

  const handleDelete = async () => {
    if (selectedMedicine) {
      try {
        await deleteDoc(doc(firestore, 'medicines', selectedMedicine.id))
        setShowDeleteModal(false)
        setSelectedMedicine(null)
        fetchMedicines()
      } catch (error) {
        console.error('Error deleting medicine:', error)
      }
    }
  }

  const handleAddNew = () => {
    setSelectedMedicine(null)
    formik.resetForm()
    setShowDrawer(true)
  }

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
                        Edit
                      </button>
                      <button
                        className='btn btn-sm btn-light-danger'
                        onClick={() => {
                          setSelectedMedicine(medicine)
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
            {selectedMedicine ? 'Edit Medicine' : 'Add New Medicine'}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <FormikProvider value={formik}>
            <form onSubmit={formik.handleSubmit}>
              <div className='mb-3'>
                <label className='form-label required'>Medicine Name</label>
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

              <div className='mb-3'>
                <label className='form-label required'>Manufacturer</label>
                <select
                  className={`form-select ${
                    formik.touched.manufacturerId && formik.errors.manufacturerId
                      ? 'is-invalid'
                      : ''
                  }`}
                  {...formik.getFieldProps('manufacturerId')}
                >
                  <option value=''>Select Manufacturer</option>
                  {manufacturers.map((manufacturer) => (
                    <option key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </option>
                  ))}
                </select>
                {formik.touched.manufacturerId && formik.errors.manufacturerId && (
                  <div className='invalid-feedback'>{formik.errors.manufacturerId}</div>
                )}
              </div>

              <div className='mb-3'>
                <label className='form-label required'>Chemicals</label>
                <input
                  type='text'
                  className={`form-control ${
                    formik.touched.chemicals && formik.errors.chemicals ? 'is-invalid' : ''
                  }`}
                  {...formik.getFieldProps('chemicals')}
                />
                {formik.touched.chemicals && formik.errors.chemicals && (
                  <div className='invalid-feedback'>{formik.errors.chemicals}</div>
                )}
              </div>

              <div className='mb-3'>
                <label className='form-label required'>Description</label>
                <textarea
                  className={`form-control ${
                    formik.touched.description && formik.errors.description ? 'is-invalid' : ''
                  }`}
                  rows={3}
                  {...formik.getFieldProps('description')}
                />
                {formik.touched.description && formik.errors.description && (
                  <div className='invalid-feedback'>{formik.errors.description}</div>
                )}
              </div>

              <div className='mb-3'>
                <label className='form-label'>Custom Fields</label>
                <FieldArray
                  name='customFields'
                  render={(arrayHelpers) => (
                    <div>
                      {formik.values.customFields.map((field, index) => (
                        <div key={index} className='row g-3 mb-3'>
                          <div className='col'>
                            <input
                              type='text'
                              className={`form-control ${
                                formik.touched.customFields?.[index]?.key &&
                                formik.errors.customFields?.[index]?.key
                                  ? 'is-invalid'
                                  : ''
                              }`}
                              placeholder='Field Name'
                              {...formik.getFieldProps(`customFields.${index}.key`)}
                            />
                          </div>
                          <div className='col'>
                            <input
                              type='text'
                              className={`form-control ${
                                formik.touched.customFields?.[index]?.value &&
                                formik.errors.customFields?.[index]?.value
                                  ? 'is-invalid'
                                  : ''
                              }`}
                              placeholder='Field Value'
                              {...formik.getFieldProps(`customFields.${index}.value`)}
                            />
                          </div>
                          <div className='col-auto'>
                            <button
                              type='button'
                              className='btn btn-light-danger'
                              onClick={() => arrayHelpers.remove(index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type='button'
                        className='btn btn-light-primary'
                        onClick={() => arrayHelpers.push({ key: '', value: '' })}
                      >
                        Add Field
                      </button>
                    </div>
                  )}
                />
              </div>

              <div className='text-end'>
                <button type='submit' className='btn btn-primary'>
                  {selectedMedicine ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </FormikProvider>
        </Offcanvas.Body>
      </Offcanvas>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete {selectedMedicine?.name}? This action cannot be undone.
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