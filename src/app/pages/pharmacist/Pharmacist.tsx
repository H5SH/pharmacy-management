import { useState, useEffect, useRef } from 'react';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { firestore as db } from '../../../firebase/config';
import { useAuth } from '../../modules/auth';
import { vertexAi, model } from '../../../config/vertexAi';
import { toast } from 'react-toastify';

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
  const [chatInstance, setChatInstance] = useState<any>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    initializeChat();
    loadChatHistory();
  }, [currentUser?.uid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // const chat = model.generateContent({
      //   model: model,
      //   temperature: 0.7,
      //   maxOutputTokens: 1024,
      //   context: PHARMACY_SYSTEM_PROMPT,
      // });
      // setChatInstance(chat);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to initialize chat system');
    }
  };

  const loadChatHistory = async () => {
    if (!currentUser?.uid) return;

    try {
      const messagesRef = collection(db, 'pharmacy_chat_messages');
      let chatQuery;

      if (currentUser.role === 'branch_manager') {
        chatQuery = query(
          messagesRef,
          where('branchId', '==', currentUser.branchId),
          orderBy('timestamp', 'asc')
        );
      } else {
        chatQuery = query(
          messagesRef,
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'asc')
        );
      }

      const querySnapshot = await getDocs(chatQuery);
      const loadedMessages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        loadedMessages.push({
          id: doc.id,
          ...doc.data() as ChatMessage,
          timestamp: (doc.data() as ChatMessage).timestamp,
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
    if (!newMessage.trim() || !currentUser?.uid || !chatInstance) return;

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

      await addDoc(collection(db, 'pharmacy_chat_messages'), userMessage);
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const result = await chatInstance.sendMessage(newMessage);
      const response = result.response;

      if (response) {
        const aiMessage: ChatMessage = {
          content: response.text(),
          timestamp: new Date(),
          sender: 'ai',
          userId: currentUser.uid,
          branchId: currentUser.branchId,
        };

        await addDoc(collection(db, 'pharmacy_chat_messages'), aiMessage);
        setMessages(prev => [...prev, aiMessage]);
      }

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
          <h4 className="mb-0">Pharmacy Assistant (Powered by Gemini)</h4>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => {
              setMessages([]);
              initializeChat();
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
            >
              <div className="message-content">
                {message.content}
              </div>
              <small className="text-muted">
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