import { useState, useEffect, useRef } from 'react';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { firestore as db } from '../../../firebase/config';
import { useAuth } from '../../modules/auth';
import { toast } from 'react-toastify';
import { getPharmacyId } from '../../../utils/functions';
import { model } from '../../../firebase/config';

interface ChatMessage {
  id?: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'ai';
  userId: string;
  branchId?: string;
}

const PHARMACY_SYSTEM_PROMPT = `
You are an intelligent pharmacy assistant powered by Gemini. Your role is to:
1. Provide accurate information about medications, their uses, and potential side effects
2. Help identify potential drug interactions
3. Suggest appropriate over-the-counter medications for common ailments
4. Provide dosage information and administration guidelines
5. Offer general health and wellness advice

Important rules:
- Always mention that the user should consult a healthcare professional for medical advice
- Be clear about prescription requirements
- Highlight potential drug interactions and contraindications
- Use simple, clear language
- If unsure, always err on the side of caution and recommend professional consultation

Current context: You're assisting in a pharmacy setting. Maintain professional, accurate, and helpful communication.
`;

const Pharmacist = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    console.log(model.safetySettings);
    loadChatHistory();
  }, [currentUser?.uid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    if (!currentUser?.uid) return;

    try {
      const messagesRef = collection(db, 'pharmacy', getPharmacyId(currentUser), 'branches', currentUser.branchId, 'chat_messages');
      // let chatQuery;

      // chatQuery = query(
      //   messagesRef,
      //   where('branchId', '==', currentUser.branchId),
      //   orderBy('timestamp', 'asc')
      // );
      

      const querySnapshot = await getDocs(messagesRef);
      const loadedMessages: ChatMessage[] = [];

      querySnapshot.forEach((doc) => {
        loadedMessages.push({
          id: doc.id,
          ...doc.data() as ChatMessage,
          timestamp: new Date(doc.data().timestamp)
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
    if (!newMessage.trim() || !currentUser?.uid ) return;

    setIsLoading(true);
    try {
      // Save user message
      const userMessage: ChatMessage = {
        content: newMessage,
        timestamp: new Date(),
        sender: 'user',
        userId: currentUser.uid,
        branchId: currentUser.branchId,
      };

      await addDoc(collection(db, 'pharmacy', getPharmacyId(currentUser), 'branches', currentUser.branchId, 'chat_messages'), userMessage);
      setMessages(prev => [...prev, userMessage]);

      // Show thinking message
      const thinkingMessage: ChatMessage = {
        content: "Thinking...",
        timestamp: new Date(),
        sender: 'ai',
        userId: currentUser.uid,
        branchId: currentUser.branchId,
      };
      setMessages(prev => [...prev, thinkingMessage]);

      // Get AI response
      const reader = await model.generateContentStream(newMessage);
      let aiMessage = '';
      const timestamp = new Date();

      // Remove any previous thinking message
      setMessages(prev => prev.filter(msg => msg.content !== "Thinking..."));

      while (true) {
        const {value, done} = await reader.stream.next();
        if (done) break;
        
        aiMessage += value.text();
        // Update messages with the current accumulated response
        setMessages(prev => {
          // Remove the previous streaming message if it exists
          const filteredMessages = prev.filter(msg => msg.timestamp !== timestamp);
          // Add the updated streaming message
          return [...filteredMessages, {
            content: aiMessage,
            sender: 'ai',
            timestamp: timestamp,
            userId: currentUser.uid,
            branchId: currentUser.branchId
          }];
        });
      }

      // Save the final message to Firestore
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
                {message.timestamp.toLocaleTimeString()}
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