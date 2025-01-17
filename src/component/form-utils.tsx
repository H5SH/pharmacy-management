export function FormField({formik, name, label}){
    return(
        <div className='mb-3'>
        <label className='form-label required'>{label}</label>
        <input
            type='text'
            className={`form-control ${
                formik.touched[name] && formik.errors.name ? 'is-invalid' : ''
            }`}
            {...formik.getFieldProps('name')}
        />
        {formik.touched.name && formik.errors.name && (
            <div className='invalid-feedback'>{formik.errors.name}</div>
        )}
    </div>
    )
}
