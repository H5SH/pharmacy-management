// @ts-nocheck
import { FieldArray, FormikProvider, useFormik } from "formik";
import { Offcanvas } from "react-bootstrap";
import * as Yup from 'yup';
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { firestore } from "../../../../firebase/config";
import { useAppContext } from "../../../../utils/appContext";
import { Toast } from "../../../../utils/utilities";

interface MedicinesModal {
  setShowDrawer: any
  showDrawer: any
  manufacturers: Array<any>
  medicine: any
  setMedicine: any
}

export default function MedicinesForm({ setShowDrawer, showDrawer, manufacturers, medicine, setMedicine }: MedicinesModal) {

  const { refresh, setRefresh } = useAppContext()

  const formik = useFormik({
    initialValues: medicine || {
      name: '',
      manufacturerId: '',
      chemicals: '',
      description: '',
      customFields: [{ key: '', value: '' }],
    },
    enableReinitialize: true,
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

        if (medicine) {
          await updateDoc(doc(firestore, 'medicines', medicine.id), medicineData)
          Toast('success', 'Updated Successfuly')
        } else {
          await addDoc(collection(firestore, 'medicines'), medicineData)
          Toast('success', 'Added Successfuly')
        }
        resetForm()
        setShowDrawer(false)
        setRefresh(!refresh)
        setMedicine(null)
      } catch (error) {
        Toast('error', 'Something Went Wrong Please Try Again')
        console.error('Error saving medicine:', error)
      }
    },
  })

  return (
    <Offcanvas show={showDrawer} onHide={() => setShowDrawer(false)} placement='end'>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          {medicine ? 'Edit Medicine' : 'Add New Medicine'}
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit}>
            <div className='mb-3'>
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

            <div className='mb-3'>
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
                      className='btn btn-light-primary m-2'
                      onClick={() => arrayHelpers.push({ key: '', value: '' })}
                    >
                      <i class="bi bi-plus-circle fs-1"></i>
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
                            <i class="bi bi-trash fs-1"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className='text-end'>
              <button type='submit' className='btn btn-primary'>
                {medicine ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </FormikProvider>
      </Offcanvas.Body>
    </Offcanvas>
  )
}