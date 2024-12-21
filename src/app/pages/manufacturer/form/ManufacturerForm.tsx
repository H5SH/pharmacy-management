// @ts-nocheck
import { addDoc, collection, doc, updateDoc } from "firebase/firestore"
import { useFormik } from "formik"
import * as Yup from 'yup'
import { firestore as db } from "../../../../firebase/config"
import { useAppContext } from "../../../../utils/appContext"
import { Offcanvas } from "react-bootstrap"
import { Toast } from "../../../../utils/utilities"


interface ManufacturerModal {
    setShowDrawer: any
    setSelectedManufacturer: any
    selectedManufacturer: any
    showDrawer: boolean
}

export default function ManufacturerForm({setShowDrawer, setSelectedManufacturer, selectedManufacturer, showDrawer}: ManufacturerModal){

    const {refresh, setRefresh} = useAppContext()

      const formik = useFormik({
        initialValues: setSelectedManufacturer || {
          name: '',
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
          name: Yup.string().required('Manufacturer name is required'),
        }),
        onSubmit: async (values, { resetForm }) => {
          try {
            if (selectedManufacturer) {
              await updateDoc(doc(db, 'manufacturers', selectedManufacturer.id), {
                name: values.name,
              })
              Toast('success', "Updated Successfully")
            } else {
              await addDoc(collection(db, 'manufacturers'), {
                name: values.name,
              })
              Toast('success', 'Added Successfully')
            }
            resetForm()
            setShowDrawer(false)
            setSelectedManufacturer(null)
            setRefresh(!refresh)
          } catch (error) {
            Toast('error', 'Something Went Wrong')
            console.error('Error saving manufacturer:', error)
          }
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
              <button type='submit' className='btn btn-primary'>
                {selectedManufacturer ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </Offcanvas.Body>
      </Offcanvas>
      )

}