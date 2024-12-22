import React, { useState, useEffect, useRef } from 'react'
import { Card, Modal, Dropdown, Button } from 'react-bootstrap'
import { collection, getDocs, query, where, or } from 'firebase/firestore'
import { firestore } from '../../../firebase/config'
import { Toast } from '../../../utils/utilities'
import { motion, AnimatePresence } from 'framer-motion'

interface Medicine {
  id: string
  name: string
  manufacturerId: string
  manufacturerName: string
  chemicals: string
  description: string
  customFields: Array<{ key: string; value: string }>
  medicineType: string
  quantity: number
  pricePerUnit: number
  liquidMl?: number
  tabletsPerBox?: number
  powderWeight?: number
}

interface CartItem extends Medicine {
  cartQuantity: number
  selectedUnit: 'piece' | 'box' // for tablets
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Medicine[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartQuantity, setCartQuantity] = useState(1)
  const [selectedUnit, setSelectedUnit] = useState<'piece' | 'box'>('piece')
  const [cartAnimation, setCartAnimation] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout>()

  const searchMedicines = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const q = query.toLowerCase()
      const medicinesRef = collection(firestore, 'medicines')
      const querySnapshot = await getDocs(medicinesRef)
      
      const results = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Medicine))
        .filter(medicine => 
          medicine.name.toLowerCase().includes(q) ||
          medicine.chemicals.toLowerCase().includes(q) ||
          medicine.description.toLowerCase().includes(q) ||
          medicine.customFields.some(field => 
            field.key.toLowerCase().includes(q) || 
            field.value.toLowerCase().includes(q)
          )
        )
      
      setSearchResults(results)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Error searching medicines:', error)
      Toast('error', 'Error searching medicines')
    }
  }

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(() => {
      searchMedicines(searchQuery)
    }, 300)

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [searchQuery])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % searchResults.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length)
        break
      case 'Enter':
        e.preventDefault()
        const selectedMed = searchResults[selectedIndex]
        if (selectedMed) {
          setSelectedMedicine(selectedMed)
          setShowQuantityModal(true)
          setCartQuantity(1)
          setSelectedUnit('piece')
        }
        break
    }
  }

  const addToCart = () => {
    if (!selectedMedicine) return

    const newCartItem: CartItem = {
      ...selectedMedicine,
      cartQuantity: cartQuantity,
      selectedUnit: selectedUnit
    }

    setCartItems(prev => [...prev, newCartItem])
    setShowQuantityModal(false)
    setCartAnimation(true)
    setTimeout(() => setCartAnimation(false), 1000)

    Toast('success', 'Added to cart')
  }

  return (
    <div className='container-fluid'>
      <Card className='shadow-sm'>
        <Card.Header className='border-0 pt-5'>
          <div className='d-flex justify-content-between align-items-center w-100'>
            <div className='position-relative w-75'>
              <input
                type='text'
                className='form-control'
                placeholder='Search medicines by name, chemicals, or description...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {searchResults.length > 0 && (
                <div className='position-absolute w-100 mt-2 shadow-sm bg-white rounded border'>
                  {searchResults.map((medicine, index) => (
                    <div
                      key={medicine.id}
                      className={`p-3 cursor-pointer ${
                        index === selectedIndex ? 'bg-light' : ''
                      }`}
                      onClick={() => {
                        setSelectedMedicine(medicine)
                        setShowQuantityModal(true)
                        setCartQuantity(1)
                        setSelectedUnit('piece')
                      }}
                    >
                      <div className='fw-bold'>{medicine.name}</div>
                      <div className='text-muted small'>{medicine.chemicals}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className='position-relative'>
              <Dropdown>
                <Dropdown.Toggle
                  variant='light'
                  id='cart-dropdown'
                  className='btn btn-icon btn-light-primary'
                >
                  <i className='bi bi-cart fs-2'></i>
                  {cartItems.length > 0 && (
                    <motion.span
                      key={cartItems.length}
                      initial={{ scale: 0 }}
                      animate={{ scale: cartAnimation ? 1.2 : 1 }}
                      className='position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger'
                    >
                      {cartItems.length}
                    </motion.span>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu className='p-3' style={{ minWidth: '300px' }}>
                  {cartItems.length === 0 ? (
                    <div className='text-center text-muted'>Cart is empty</div>
                  ) : (
                    <>
                      {cartItems.map((item, index) => (
                        <div key={index} className='d-flex justify-content-between align-items-center mb-2'>
                          <div>
                            <div className='fw-bold'>{item.name}</div>
                            <div className='text-muted small'>
                              {item.cartQuantity} {item.selectedUnit}
                              {item.cartQuantity > 1 ? 's' : ''} × ${item.pricePerUnit}
                            </div>
                          </div>
                          <Button
                            variant='light-danger'
                            size='sm'
                            onClick={() => {
                              setCartItems(prev => prev.filter((_, i) => i !== index))
                            }}
                          >
                            <i className='bi bi-trash'></i>
                          </Button>
                        </div>
                      ))}
                      <div className='border-top mt-3 pt-3'>
                        <div className='d-flex justify-content-between fw-bold'>
                          <span>Total:</span>
                          <span>
                            $
                            {cartItems
                              .reduce(
                                (total, item) => total + item.pricePerUnit * item.cartQuantity,
                                0
                              )
                              .toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </Card.Header>
      </Card>

      <Modal show={showQuantityModal} onHide={() => setShowQuantityModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Quantity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMedicine?.medicineType === 'tablets' && (
            <div className='mb-3'>
              <label className='form-label'>Unit</label>
              <select
                className='form-select'
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value as 'piece' | 'box')}
              >
                <option value='piece'>Individual Tablets</option>
                <option value='box'>Box ({selectedMedicine.tabletsPerBox} tablets)</option>
              </select>
            </div>
          )}
          <div className='mb-3'>
            <label className='form-label'>Quantity</label>
            <input
              type='number'
              className='form-control'
              value={cartQuantity}
              onChange={(e) => setCartQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min='1'
            />
          </div>
          <div className='d-flex justify-content-between align-items-center'>
            <div>
              Price per {selectedMedicine?.medicineType === 'tablets' && selectedUnit === 'box' ? 'box' : 'unit'}:
              <span className='fw-bold ms-2'>
                ${selectedMedicine?.pricePerUnit || 0}
              </span>
            </div>
            <div>
              Total:
              <span className='fw-bold ms-2'>
                ${((selectedMedicine?.pricePerUnit || 0) * cartQuantity).toFixed(2)}
              </span>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='light' onClick={() => setShowQuantityModal(false)}>
            Cancel
          </Button>
          <Button variant='primary' onClick={addToCart}>
            Add to Cart
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}