import { Modal } from "react-bootstrap";
import { Manufacturer, Medicine } from "../model";
import Branch from "../../app/pages/branch/Branch";


interface DeleteProps {
    showDeleteModal: any
    setShowDeleteModal: any
    item: Medicine | Manufacturer | Branch
    handleDelete: any
}

export const DeleteModal = ({ showDeleteModal, setShowDeleteModal, item, handleDelete }: DeleteProps) => (
    <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            Are you sure you want to delete {item?.name}? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
            <button className='btn btn-light' onClick={() => setShowDeleteModal(false)}>
                Cancel
            </button>
            <button className='btn btn-danger' onClick={()=>{
                setShowDeleteModal(false)
                handleDelete()
                }}>
                Delete
            </button>
        </Modal.Footer>
    </Modal>
)