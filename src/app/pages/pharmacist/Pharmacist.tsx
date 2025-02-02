import { useState, useEffect, useRef } from 'react';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { collection, addDoc, query, where, orderBy, getDocs} from 'firebase/firestore';
import { firestore as db } from '../../../firebase/config';
import { useAuth } from '../../modules/auth';
import { toast } from 'react-toastify';
import { getPharmacyId } from '../../../utils/functions';
import { model } from '../../../firebase/config';

interface ChatMessage {
  id?: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'ai';
  userId: string;
  branchId?: string;
}

const Pharmacist = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const [medications, setMedications] = useState<any[]>([]);

  useEffect(() => {
    console.log(model.safetySettings);
    loadChatHistory();
  }, [currentUser?.uid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMedications = async () => {
      if (!currentUser?.uid) return;

      try {
        const medsRef = collection(db, 'pharmacy', getPharmacyId(currentUser), 'medicines');
        const querySnapshot = await getDocs(medsRef);
        const medsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMedications(medsData);
      } catch (error) {
        console.error('Error fetching medications:', error);
      }
    };

    fetchMedications();
  }, [currentUser]);

  const loadChatHistory = async () => {
    if (!currentUser?.uid) return;

    try {
      const messagesRef = collection(db, 'pharmacy', getPharmacyId(currentUser), 'branches', currentUser.branchId, 'chat_messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const querySnapshot = await getDocs(q);
      const loadedMessages: ChatMessage[] = [];

      querySnapshot.forEach((doc) => {
        loadedMessages.push({
          id: doc.id,
          ...doc.data() as ChatMessage,
        } as ChatMessage);
      });

      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast.error('Failed to load chat history');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.uid) return;

    setIsLoading(true);
    try {
      // Save user message
      const userMessage: ChatMessage = {
        content: newMessage,
        timestamp: new Date().toISOString(),
        sender: 'user',
        userId: currentUser.uid,
        branchId: currentUser.branchId,
      };

      await addDoc(collection(db, 'pharmacy', getPharmacyId(currentUser), 'branches', currentUser.branchId, 'chat_messages'), userMessage);
      setMessages(prev => [...prev, userMessage]);

      // Show thinking message
      const thinkingMessage: ChatMessage = {
        content: "Thinking...",
        timestamp: new Date().toISOString(),
        sender: 'ai',
        userId: currentUser.uid,
        branchId: currentUser.branchId,
      };
      setMessages(prev => [...prev, thinkingMessage]);

      // Prepare context for Gemini with medication database
      const context = `You are a pharmacy assistant with access to the following medications in our inventory:
      ${medications.map(med => `- ${med.name}: ${med.description}
      Price_per_unit: ${med.pricePerUnit}
      medicineType: ${med.medicineType}
      Stock: ${med.quantity}
      Category: ${med.category}
      Usage: ${med.usage || 'As prescribed'}
      Side Effects: ${med.sideEffects || 'Consult physician for side effects'}
      `).join('\n')}

      Please provide recommendations based ONLY on the medications available in our inventory. When recommending medications:
      1. Consider the symptoms described
      2. Suggest suitable medications from our inventory
      3. Provide alternative options if available
      4. Include dosage information and warnings
      5. Always remind the patient to consult a healthcare professional
      6. Mention the price and availability of recommended medications

      User Query: ${newMessage}`;

      // Get AI response
      const result = await model.generateContentStream(context);
      let aiMessage = '';
      const timestamp = new Date().toISOString();

      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.content !== "Thinking..."));

      while (true) {
        const { value, done } = await result.stream.next();
        if (done) break;

        aiMessage += value.text();
        setMessages(prev => {
          const filteredMessages = prev.filter(msg => msg.timestamp !== timestamp);
          return [...filteredMessages, {
            content: aiMessage,
            sender: 'ai',
            timestamp: timestamp,
            userId: currentUser.uid,
            branchId: currentUser.branchId
          }];
        });
      }

      // Save final message to Firestore
      await addDoc(collection(db, 'pharmacy', getPharmacyId(currentUser), 'branches', currentUser.branchId, 'chat_messages'), {
        content: aiMessage,
        sender: 'ai',
        timestamp: timestamp,
        userId: currentUser.uid,
        branchId: currentUser.branchId
      });
      setNewMessage('');

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card className="chat-container">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Pharmacy Assistant</h4>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              setMessages([]);
            }}
          >
            New Conversation
          </Button>
        </Card.Header>
        <Card.Body className="chat-messages" style={{ height: '60vh', overflowY: 'auto' }}>
          <div className="system-message mb-3">
            <p className="text-muted">
              Welcome to the Pharmacy Assistant. I can help you with medication information,
              dosage guidelines, and general health advice. Please remember that this is for
              informational purposes only and does not replace professional medical advice.
            </p>
          </div>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '1rem'
              }}
            >
              <div
                className="message-content"
                style={{
                  backgroundColor: message.sender === 'user' ? '#007bff' : '#28a745',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '1rem',
                  maxWidth: '70%',
                  wordBreak: 'break-word'
                }}
              >
                {message.content}
              </div>
              <small className="text-muted mt-1">
                {new Date(message.timestamp).toLocaleString()}
              </small>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </Card.Body>
        <Card.Footer>
          <Form onSubmit={handleSendMessage}>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask about medications, dosages, or health advice..."
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !newMessage.trim()}
                variant="primary"
              >
                {isLoading ? 'Processing...' : 'Send'}
              </Button>
            </div>
          </Form>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default Pharmacist;