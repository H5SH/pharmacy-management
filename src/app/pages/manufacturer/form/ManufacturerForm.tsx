// @ts-nocheck
import { addDoc, collection, doc, updateDoc, getDocs, query, where } from "firebase/firestore"
import { useFormik } from "formik"
import * as Yup from 'yup'
import { firestore as db } from "../../../../firebase/config"
import { useAppContext } from "../../../../utils/appContext"
import { Offcanvas } from "react-bootstrap"
import { Toast } from "../../../../utils/utilities"
import { useState } from "react"

interface ManufacturerModal {
    setShowDrawer: any
    setSelectedManufacturer: any
    selectedManufacturer: any
    showDrawer: boolean
}

export default function ManufacturerForm({setShowDrawer, setSelectedManufacturer, selectedManufacturer, showDrawer}: ManufacturerModal){
    const {refresh, setRefresh} = useAppContext()
    const [btnLoading, setBtnLoading] = useState(false)

    const checkManufacturerExists = async (name: string) => {
      const q = query(
        collection(db, 'manufacturers'),
        where('name', '==', name)
      )
      const querySnapshot = await getDocs(q)
      return !querySnapshot.empty
    }

    const formik = useFormik({
        initialValues: selectedManufacturer || {
          name: '',
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
          name: Yup.string().required('Manufacturer name is required'),
        }),
        onSubmit: async (values, { resetForm, setFieldError }) => {
          setBtnLoading(true)
          try {
            const nameExists = await checkManufacturerExists(values.name)
            
            if (nameExists && (!selectedManufacturer || selectedManufacturer.name !== values.name)) {
              setFieldError('name', 'A manufacturer with this name already exists')
              setBtnLoading(false)
              return
            }

            if (selectedManufacturer) {
              await updateDoc(doc(db, 'manufacturers', selectedManufacturer.id), {
                name: values.name,
              })
              Toast('success','Updated Successfully')
            } else {
              await addDoc(collection(db, 'manufacturers'), {
                name: values.name,
              })
              Toast('success','Added Successfully')
            }
            resetForm()
            setShowDrawer(false)
            setSelectedManufacturer(null)
            setRefresh(!refresh)
          } catch (error) {
            Toast('error','Something went wrong')
            console.error('Error:', error)
          }
          setBtnLoading(false)
        },
    })

    return (
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
                        <button type='submit' className='btn btn-primary' disabled={btnLoading}>
                            {selectedManufacturer ? 'Update' : 'Save'}
                        </button>
                    </div>
                </form>
            </Offcanvas.Body>
        </Offcanvas>
    )
}