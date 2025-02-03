import { useEffect, useState } from "react";
import { Button, Container, Table } from "react-bootstrap";
import { collection, getDocs, addDoc, query, deleteDoc, doc } from "firebase/firestore";
import { firestore as db, firestore } from "../../../firebase/config";
// import "react-modern-drawer/dist/index.css";
import { toast } from "react-toastify";
import BranchForm from "./form/BranchForm";
import { useAuth } from "../../modules/auth";
import { useAppContext } from "../../../utils/appContext";
import { DeleteModal } from "../../../utils/component/DeleteModal";
import { Toast } from "../../../utils/utilities";
import { UserRole } from "../../../utils/model";
import { useNavigate } from "react-router-dom";

interface Branch {
  uid: string;
  name: string;
  city: string;
  state: string;
}

const Branch = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [branch, setBranch] = useState<Branch | null>()
  const [deleteBranch, setDeleteBranch] = useState<Branch | null>(null)
  const navigate = useNavigate()

  const { currentUser, setCurrentUser } = useAuth()
  const { refresh, setRefresh } = useAppContext()

  const fetchBranches = async () => {
    try {
      const branchesRef = collection(db, 'pharmacy', currentUser.uid!, "branches");
      const querySnapshot = await getDocs(branchesRef);
      const branchList: Branch[] = [];
      querySnapshot.forEach((doc) => {
        branchList.push({ uid: doc.id, ...doc.data() } as Branch);
      });
      setBranches(branchList);
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to fetch branches");
    }
  };

  async function handleDelete(){
    try{
      await deleteDoc(doc(firestore, 'pharmacy', currentUser.uid!, "branches", deleteBranch.uid))
      Toast('success', "Branch Deleted")
      setRefresh(!refresh)
    }catch(er){
      console.log(er)
      Toast("error", "Something Went Wrong Please try Again")
    }
  }

  useEffect(() => {
    fetchBranches();
  }, [refresh]);

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Branches</h2>
        <Button variant="primary" onClick={() => {
          setShowDrawer(true)
          setBranch(null)
          }}>
          Add New Branch
        </Button>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>City</th>
            <th>State</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch, index) => (
            <tr key={branch.uid}>
              <td>{index + 1}</td>
              <td>{branch.name}</td>
              <td>{branch.city}</td>
              <td>{branch.state}</td>
              <td className='text-end'>
              <button
                  className='btn btn-sm btn-light-primary me-2'
                  onClick={() => {
                    setCurrentUser({...currentUser, admin: currentUser, branchId: branch.uid, role: UserRole.BRANCH_MANAGER})
                    navigate('/dashboard')
                  }}
                >
                  <i className="bi bi-person-fill-down fs-1"></i>
                </button>
                <button
                  className='btn btn-sm btn-light-primary me-2'
                  onClick={() => {
                    setBranch(branch)
                    setShowDrawer(true)
                  }}
                >
                  <i className="bi bi-pencil fs-1"></i>
                </button>
                <button
                  className='btn btn-sm btn-light-danger'
                  onClick={() => {
                    setDeleteBranch(branch)
                  }}
                >
                  <i className="bi bi-trash fs-1"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <BranchForm
        showDrawer={showDrawer}
        setShowDrawer={setShowDrawer}
        initialValues={branch}
      />

      <DeleteModal showDeleteModal={deleteBranch} setShowDeleteModal={()=> setDeleteBranch(null)} item={deleteBranch} handleDelete={handleDelete}/>
    </Container>
  );
};

export default Branch;