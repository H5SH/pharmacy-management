// @ts-nocheck
import { FieldArray, FormikProvider, useFormik } from "formik";
import { Offcanvas } from "react-bootstrap";
import * as Yup from 'yup';
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { firestore } from "../../../../firebase/config";
import { useAppContext } from "../../../../utils/appContext";
import { Toast } from "../../../../utils/utilities";
import { useState } from "react";

interface MedicinesModal {
  setShowDrawer: any
  showDrawer: any
  manufacturers: Array<any>
  medicine: any
  setMedicine: any
}

export default function MedicinesForm({ setShowDrawer, showDrawer, manufacturers, medicine, setMedicine }: MedicinesModal) {

  const { refresh, setRefresh } = useAppContext()
  const [btnLoading, setBtnLoading] = useState(false)

  const formik = useFormik({
    initialValues: medicine || {
      name: '',
      manufacturerId: '',
      chemicals: '',
      description: '',
      customFields: [{ key: '', value: '' }],
      medicineType: '', // 'liquid', 'tablets', 'powder'
      quantity: 0,
      pricePerUnit: 0,
      // Additional fields based on medicine type
      liquidMl: 0,
      tabletsPerBox: 0,
      powderWeight: 0,
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().required('Medicine name is required'),
      manufacturerId: Yup.string().required('Manufacturer is required'),
      chemicals: Yup.string().required('Chemicals are required'),
      description: Yup.string().required('Description is required'),
      medicineType: Yup.string().required('Medicine type is required'),
      quantity: Yup.number().min(0, 'Quantity must be positive').required('Quantity is required'),
      pricePerUnit: Yup.number().min(0, 'Price must be positive').required('Price is required'),
      liquidMl: Yup.number().when('medicineType', {
        is: 'liquid',
        then: () => Yup.number().min(0, 'Volume must be positive').required('Volume is required'),
      }),
      tabletsPerBox: Yup.number().when('medicineType', {
        is: 'tablets',
        then: () => Yup.number().min(0, 'Tablets per box must be positive').required('Tablets per box is required'),
      }),
      powderWeight: Yup.number().when('medicineType', {
        is: 'powder',
        then: () => Yup.number().min(0, 'Weight must be positive').required('Weight is required'),
      }),
      customFields: Yup.array().of(
        Yup.object().shape({
          key: Yup.string(),
          value: Yup.string()
        })
      ),
    }),
    onSubmit: async (values, { resetForm }) => {
      setBtnLoading(true)
      try {
        const medicineData = {
          name: values.name,
          manufacturerId: values.manufacturerId,
          chemicals: values.chemicals,
          description: values.description,
          customFields: values.customFields,
          medicineType: values.medicineType,
          quantity: values.quantity,
          pricePerUnit: values.pricePerUnit,
          ...(values.medicineType === 'liquid' && { liquidMl: values.liquidMl }),
          ...(values.medicineType === 'tablets' && { tabletsPerBox: values.tabletsPerBox }),
          ...(values.medicineType === 'powder' && { powderWeight: values.powderWeight }),
        }

        if (medicine?.id) {
          await updateDoc(doc(firestore, 'medicines', medicine.id), medicineData)
          Toast('success', 'Medicine updated successfully')
        } else {
          await addDoc(collection(firestore, 'medicines'), medicineData)
          Toast('success', 'Medicine added successfully')
        }
        resetForm()
        setShowDrawer(false)
        setMedicine(null)
        setRefresh(!refresh)
      } catch (error) {
        console.error('Error saving medicine:', error)
        Toast('error', 'Error saving medicine')
      }
      setBtnLoading(false)
    },
  })

  return (
    <Offcanvas show={showDrawer} onHide={() => setShowDrawer(false)} placement='end' style={{ width: '50%' }}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          {medicine ? 'Edit Medicine' : 'Add New Medicine'}
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit}>
            <div className="row">
              <div className='mb-3 col-6'>
                <label className='form-label required'>Medicine Name</label>
                <input
                  type='text'
                  className={`form-control ${formik.touched.name && formik.errors.name ? 'is-invalid' : ''
                    }`}
                  {...formik.getFieldProps('name')}
                />
                {formik.touched.name && formik.errors.name && (
                  <div className='invalid-feedback'>{formik.errors.name}</div>
                )}
              </div>

              <div className='mb-3 col-6'>
                <label className='form-label required'>Manufacturer</label>
                <select
                  className={`form-select ${formik.touched.manufacturerId && formik.errors.manufacturerId
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
            </div>

            <div className="row">
              <div className='mb-3 col-6'>
                <label className='form-label required'>Medicine Type</label>
                <select
                  className={`form-select ${formik.touched.medicineType && formik.errors.medicineType
                    ? 'is-invalid'
                    : ''
                    }`}
                  name="medicineType"
                  {...formik.getFieldProps('medicineType')}
                >
                  <option value=''>Select Type</option>
                  <option value='liquid'>Liquid</option>
                  <option value='tablets'>Tablets</option>
                  <option value='powder'>Powder</option>
                </select>
                {formik.touched.medicineType && formik.errors.medicineType && (
                  <div className='invalid-feedback'>{formik.errors.medicineType}</div>
                )}
              </div>

              {formik.values.medicineType === 'liquid' && (
                <div className='mb-3 col-6'>
                  <label className='form-label required'>Volume (ml)</label>
                  <input
                    type='number'
                    className={`form-control ${formik.touched.liquidMl && formik.errors.liquidMl ? 'is-invalid' : ''
                      }`}
                    {...formik.getFieldProps('liquidMl')}
                  />
                  {formik.touched.liquidMl && formik.errors.liquidMl && (
                    <div className='invalid-feedback'>{formik.errors.liquidMl}</div>
                  )}
                </div>
              )}

              {formik.values.medicineType === 'tablets' && (
                <div className='mb-3 col-6'>
                  <label className='form-label required'>Tablets per Box</label>
                  <input
                    type='number'
                    className={`form-control ${formik.touched.tabletsPerBox && formik.errors.tabletsPerBox ? 'is-invalid' : ''
                      }`}
                    {...formik.getFieldProps('tabletsPerBox')}
                  />
                  {formik.touched.tabletsPerBox && formik.errors.tabletsPerBox && (
                    <div className='invalid-feedback'>{formik.errors.tabletsPerBox}</div>
                  )}
                </div>
              )}

              {formik.values.medicineType === 'powder' && (
                <div className='mb-3 col-6'>
                  <label className='form-label required'>Weight (grams)</label>
                  <input
                    type='number'
                    className={`form-control ${formik.touched.powderWeight && formik.errors.powderWeight ? 'is-invalid' : ''
                      }`}
                    {...formik.getFieldProps('powderWeight')}
                  />
                  {formik.touched.powderWeight && formik.errors.powderWeight && (
                    <div className='invalid-feedback'>{formik.errors.powderWeight}</div>
                  )}
                </div>
              )}
            </div>


            <div className="row">
              <div className='mb-3 col-6'>
                <label className='form-label required'>Quantity in Stock</label>
                <input
                  type='number'
                  className={`form-control ${formik.touched.quantity && formik.errors.quantity ? 'is-invalid' : ''
                    }`}
                  {...formik.getFieldProps('quantity')}
                />
                {formik.touched.quantity && formik.errors.quantity && (
                  <div className='invalid-feedback'>{formik.errors.quantity}</div>
                )}
              </div>

              <div className='mb-3 col-6'>
                <label className='form-label required'>Price per Unit</label>
                <input
                  type='number'
                  className={`form-control ${formik.touched.pricePerUnit && formik.errors.pricePerUnit ? 'is-invalid' : ''
                    }`}
                  {...formik.getFieldProps('pricePerUnit')}
                />
                {formik.touched.pricePerUnit && formik.errors.pricePerUnit && (
                  <div className='invalid-feedback'>{formik.errors.pricePerUnit}</div>
                )}
              </div>

            </div>


            <div className='mb-3'>
              <label className='form-label required'>Chemicals</label>
              <input
                type='text'
                className={`form-control ${formik.touched.chemicals && formik.errors.chemicals ? 'is-invalid' : ''
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
                className={`form-control ${formik.touched.description && formik.errors.description ? 'is-invalid' : ''
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
                    <button
                      type='button'
                      className='btn btn-light-primary mb-3'
                      onClick={() => arrayHelpers.push({ key: '', value: '' })}
                    >
                      <i className='bi bi-plus fs-1'></i>
                    </button>
                    {formik.values.customFields.map((field, index) => (
                      <div key={index} className='row g-3 mb-3'>
                        <div className='col'>
                          <input
                            type='text'
                            className={`form-control ${formik.touched.customFields?.[index]?.key &&
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
                            className={`form-control ${formik.touched.customFields?.[index]?.value &&
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
                            <i className="bi bi-trash fs-1"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className='text-end'>
              <button type='submit' className='btn btn-primary' disabled={btnLoading}>
                {medicine ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </FormikProvider>
      </Offcanvas.Body>
    </Offcanvas>
  )
}