import React, { useState, useEffect, useRef } from 'react'
import { Card, Modal, Dropdown, Button, Container, Spinner } from 'react-bootstrap'
import { collection, getDocs, query, where, or } from 'firebase/firestore'
import { firestore } from '../../../firebase/config'
import { Toast } from '../../../utils/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../modules/auth'
import { getPharmacyId } from '../../../utils/functions'
import axios from 'axios'
import { format } from 'date-fns'
import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf } from '@react-pdf/renderer'
import { addDoc, doc, updateDoc, increment } from 'firebase/firestore'
import { firestore as db } from '../../../firebase/config'
import { toast } from 'react-hot-toast'

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

interface WeatherData {
  current: any
  main: {
    temp: number;
    humidity: number;
  };
  weather: [{
    main: string; // weather condition
  }];
}

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  // @ts-ignore
  table: { display: 'table', width: '100%', borderStyle: 'solid', borderWidth: 1 },
  tableRow: { flexDirection: 'row' },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, padding: 5 },
  tableCell: { margin: 'auto', fontSize: 10 }
});

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
  const { currentUser } = useAuth()
  const [isCheckoutEnabled, setIsCheckoutEnabled] = useState(false)
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number} | null>(null);

  const searchMedicines = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const q = query.toLowerCase()
      const medicinesRef = collection(firestore, 'pharmacy', getPharmacyId(currentUser), 'medicines')
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

  useEffect(() => {
    setIsCheckoutEnabled(cartItems.length > 0)
  }, [cartItems])

  useEffect(() => {
    const getLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoordinates({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
          },
          (error) => {
            console.error("Error getting location:", error);
            toast.error("Could not get location. Using default coordinates.");
            // Set default coordinates if location access is denied
            setCoordinates({
              lat: 0, // Set your default latitude
              lon: 0  // Set your default longitude
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        toast.error("Geolocation is not supported by this browser.");
      }
    };

    getLocation();
  }, []);

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

  const handleCheckout = async () => {
    if (!currentUser?.uid || cartItems.length === 0 || !coordinates) return

    try {
      // Updated weather fetch using coordinates
      const weatherApi = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      const weatherResponse = await axios.get<WeatherData>(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${'69a2c29452503d68db79c3cdfc113af5'}`
      );

      const currentDate = new Date();
      // @ts-ignore
      const weatherData = weatherResponse.data.current;
      console.log(weatherResponse,weatherData, 'weather')

      // Store sales data for each item
      for (const item of cartItems) {
        const salesData = {
          name: item.name,
          date: format(currentDate, 'yyyy-MM-dd'),
          quantity_sold: item.cartQuantity,
          weather_condition: weatherData.weather?.[0]?.main,
          temperature: Math.round(weatherData.temp),
          humidity: weatherData.humidity,
          is_promotion: false,
          day_of_week: format(currentDate, 'EEEE'),
          branchId: currentUser.branchId,
          userId: currentUser.uid,
          timestamp: currentDate,
          location: {
            latitude: coordinates.lat,
            longitude: coordinates.lon
          }
        }

        // Add to sales_data collection
        await addDoc(
          collection(db, 'pharmacy', getPharmacyId(currentUser), 'sales_data'),
          salesData
        )
        console.log(item, 'item')

        // Update medication quantity in inventory
        const medRef = doc(db, 'pharmacy', getPharmacyId(currentUser), 'medicines', item.id)
        updateDoc(medRef, {
          quantity: increment(-item.cartQuantity)
        })
      }

      // Generate PDF
      const MyDocument = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Sales Receipt</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>Item</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>Quantity</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>Price</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>Total</Text>
                </View>
              </View>
              {cartItems.map((item, index) => (
                <View style={styles.tableRow} key={index}>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{item.name}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{item.cartQuantity}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>${item.pricePerUnit}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>${item.pricePerUnit * item.cartQuantity}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Text style={{ marginTop: 20 }}>
              Total Amount: ${cartItems.reduce((sum, item) => sum + (item.pricePerUnit * item.cartQuantity), 0)}
            </Text>
          </Page>
        </Document>
      )

      // Open PDF in new window
      const win = window.open('', '_blank')
      if (win) {
        win.document.write('<iframe width="100%" height="100%" src="' + URL.createObjectURL(await pdf(<MyDocument />).toBlob()) + '"></iframe>')
      }

      // Clear cart
      setCartItems([])
      toast.success('Checkout completed successfully!')

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Checkout failed. Please try again.')
    }
  }

  if (!coordinates) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Getting location...</span>
          </Spinner>
          <p className="mt-2">Getting your location...</p>
        </div>
      </Container>
    );
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
                <Button
                  variant="success"
                  className="w-100 mt-2"
                  disabled={!isCheckoutEnabled}
                  onClick={handleCheckout}
                >
                  Checkout
                </Button>
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