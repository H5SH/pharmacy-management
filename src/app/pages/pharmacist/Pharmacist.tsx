import React, { useState } from 'react'
import { Card } from 'react-bootstrap'

export default function Pharmacist() {
  const [messages, setMessages] = useState<Array<{text: string; sender: 'user' | 'bot'}>>([])
  const [inputMessage, setInputMessage] = useState('')

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      setMessages([...messages, { text: inputMessage, sender: 'user' }])
      setInputMessage('')
      // Here you'll integrate your chatbot logic
    }
  }

  return (
    <div className='container-fluid'>
      <Card className='shadow-sm'>
        <Card.Header className='border-0 pt-5'>
          <h3 className='card-title align-items-start flex-column'>
            <span className='card-label fw-bold fs-3 mb-1'>Medical Assistant</span>
            <span className='text-muted mt-1 fw-semibold fs-7'>
              Ask questions about medicines and get recommendations
            </span>
          </h3>
        </Card.Header>
        <Card.Body>
          <div className='chat-container' style={{ height: '60vh', overflowY: 'auto' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`d-flex ${message.sender === 'user' ? 'justify-content-end' : 'justify-content-start'} mb-4`}
              >
                <div
                  className={`rounded px-3 py-2 ${
                    message.sender === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-light'
                  }`}
                  style={{ maxWidth: '70%' }}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className='mt-4'>
            <div className='input-group'>
              <input
                type='text'
                className='form-control'
                placeholder='Type your message here...'
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button
                className='btn btn-primary'
                type='submit'
                disabled={!inputMessage.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  )
}