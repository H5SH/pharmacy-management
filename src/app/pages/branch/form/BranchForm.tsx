import { Form, Button, Offcanvas } from "react-bootstrap";
import { Formik } from "formik";
import * as Yup from "yup";
import { addDoc, collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { firestore as db, firestore } from "../../../../firebase/config";
import { toast } from "react-toastify";
import { useAppContext } from "../../../../utils/appContext";
import { useAuth } from "../../../modules/auth";
import Branch from "../Branch";

interface BranchFormProps {
  showDrawer: boolean;
  setShowDrawer: (show: boolean) => void;
  initialValues?: BranchFormValues;
}

export interface BranchFormValues {
  name: string;
  city: string;
  state: string;
}

const defaultInitialValues: BranchFormValues = {
  name: "",
  city: "",
  state: "",
};

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Branch name is required")
    .min(3, "Branch name must be at least 3 characters"),
  city: Yup.string()
    .required("City is required")
    .min(2, "City must be at least 2 characters"),
  state: Yup.string()
    .required("State is required")
    .min(2, "State must be at least 2 characters"),
});

const BranchForm = ({ 
  showDrawer, 
  setShowDrawer, 
  initialValues = defaultInitialValues 
}: BranchFormProps) => {
  const handleClose = () => setShowDrawer(false);
  const {currentUser} = useAuth()
  const {setRefresh, refresh} = useAppContext()

  return (
    <Offcanvas 
      show={showDrawer} 
      onHide={handleClose} 
      placement="end"
      backdrop="static"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Add New Branch</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Formik
          initialValues={initialValues ?? defaultInitialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              await setDoc(doc(firestore, 'pharmacy', currentUser.uid!, "branches", values.name), values)
              resetForm();
              handleClose();
              setRefresh(!refresh)
              toast.success("Branch saved successfully");
              setShowDrawer(false)
            } catch (error) {
              console.error("Error submitting form:", error);
              toast.error("Failed to save branch");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            isSubmitting,
          }) => (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Branch Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={values.name}
                  disabled={!!initialValues}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.name && !!errors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  value={values.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.city && !!errors.city}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.city}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>State</Form.Label>
                <Form.Control
                  type="text"
                  name="state"
                  value={values.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.state && !!errors.state}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.state}
                </Form.Control.Feedback>
              </Form.Group>

              <div className="d-grid">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {initialValues ? isSubmitting ? "Updating...":"Update Branch":isSubmitting ? "Saving..." : "Save Branch"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default BranchForm;
