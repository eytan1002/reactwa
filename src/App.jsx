import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Collapse, ThemeProvider, TextField, Typography, createTheme, useMediaQuery } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { ChatList } from './ChatList'
import { ChatWindow } from './ChatWindow'
import './App.css'
import { io } from 'socket.io-client'

// הוספנו את הכתובת של Render כפרמטר ראשון
const socket = io('https://serberonly.onrender.com', {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});

function getMessagePreview(message) {
  if (message?.text) {
    return message.text
  }

  const mimetype = message?.media?.mimetype || ''

  if (mimetype.startsWith('image/')) return 'Image'
  if (mimetype.startsWith('video/')) return 'Video'
  if (mimetype.startsWith('audio/')) return 'Audio'
  if (mimetype) return message.media?.filename || 'Document'

  return ''
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#128c7e',
    },
  },
})

function App() {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [status, setStatus] = useState('DISCONNECTED')
  const [qrSrc, setQrSrc] = useState('')
  const [chats, setChats] = useState([])
  const [messagesByChat, setMessagesByChat] = useState({})
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [newContactNumber, setNewContactNumber] = useState('')
  const [newContactMessage, setNewContactMessage] = useState('')
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')
  const selectedChat = chats.find((chat) => chat.id === selectedChatId)

  const [scannerActive, setScannerActive] = useState(false)
  const [scanResult, setScanResult] = useState('')
  const [scanError, setScanError] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)
  const videoRef = useRef(null)

  const showLoginPanel = status !== 'CONNECTED'
  const showSidebar = !isMobile || showLoginPanel || !selectedChatId
  const showChatPanel = !isMobile || showLoginPanel || selectedChatId
  const connectionLabel = status === 'CONNECTED' ? 'מחובר' : status === 'QR_READY' ? 'QR מוכן' : 'מנותק'
  const canScanWithCamera = useMemo(
    () => typeof window !== 'undefined' && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices && 'BarcodeDetector' in window,
    [],
  )
  const cameraSupported = canScanWithCamera

useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected to server!');
      setIsSocketConnected(true);
      setScanError('');
    });

    socket.on('disconnect', () => {
      setStatus('DISCONNECTED');
      setIsSocketConnected(false);
    });

    socket.on('connect_error', () => {
      setStatus('DISCONNECTED');
      setIsSocketConnected(false);
    });

    socket.on('whatsapp-status', (newStatus) => {
      console.log('Received whatsapp status from server:', newStatus);
      setStatus(newStatus);
      if (newStatus === 'CONNECTED') {
        setQrSrc('');
      }
    });

    socket.on('whatsapp-qr', (qrBase64) => {
      setQrSrc(qrBase64);
      setStatus('QR_READY');
    });

    socket.on('whatsapp-chats', (serverChats) => {
      setChats(serverChats);
      if (!isMobile && !selectedChatId && serverChats.length > 0) {
        setSelectedChatId(serverChats[0].id);
      }
    });

    socket.on('whatsapp-chat-messages', ({ chatId, messages }) => {
      setMessagesByChat((prev) => ({ ...prev, [chatId]: messages }));
    });

    socket.on('whatsapp-message-received', (msg) => {
      setMessagesByChat((prev) => {
        const existing = prev[msg.chatId] || [];
        return { ...prev, [msg.chatId]: [...existing, msg] };
      });
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === msg.chatId
            ? { ...chat, lastMessage: msg.text, lastMessageTime: msg.timestamp }
            : chat,
        ),
      );
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('whatsapp-status');
      socket.off('whatsapp-qr');
      socket.off('whatsapp-chats');
      socket.off('whatsapp-chat-messages');
      socket.off('whatsapp-message-received');
    };
  }, [isMobile, selectedChatId]);

  useEffect(() => {
    if (!scannerActive) {
      return undefined
    }

    let stream = null
    let intervalId = null

    async function startCameraScanner() {
      try {
        const video = videoRef.current
        if (!video) {
          setScanError('לא ניתן להציג את המצלמה.')
          setScannerActive(false)
          return
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        video.srcObject = stream
        await video.play()

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        intervalId = window.setInterval(async () => {
          if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
            return
          }

          try {
            const barcodes = await detector.detect(video)
            if (barcodes.length > 0) {
              const text = barcodes[0].rawValue
              setScanResult(text)
              setScanError('')
              setScannerActive(false)
            }
          } catch (error) {
            console.error(error)
            setScanError('שגיאה בסריקה. נסה שוב.')
          }
        }, 700)
      } catch (error) {
        console.error(error)
        setScanError('אין גישה למצלמה או שהדפדפן אינו תומך בסריקה.')
        setScannerActive(false)
      }
    }

    startCameraScanner()

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [scannerActive])

  async function handleScanFile(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setScanError('')
    setScanResult('')

    if (!('BarcodeDetector' in window)) {
      setScanError('הדפדפן אינו תומך בזיהוי QR דרך הקובץ.')
      return
    }

    try {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('לא ניתן לקבל canvas context')
      }
      ctx.drawImage(bitmap, 0, 0)

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      const barcodes = await detector.detect(canvas)

      if (barcodes.length === 0) {
        setScanError('לא נמצא קוד QR בתמונה.')
      } else {
        setScanResult(barcodes[0].rawValue)
      }
    } catch (error) {
      console.error(error)
      setScanError('שגיאה בקריאת קובץ התמונה.')
    } finally {
      setFileInputKey((prevKey) => prevKey + 1)
    }
  }

  const handleFetchChats = useCallback(() => {
    socket.emit('fetch-whatsapp-chats')
    if (selectedChatId) {
      socket.emit('fetch-whatsapp-messages', { chatId: selectedChatId })
    }
  }, [selectedChatId])

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId)
  }

  const handleToggleNewChat = () => {
    setIsNewChatOpen((isOpen) => !isOpen)
    setSendError('')
    setSendSuccess('')
  }

  function handleRetryConnection() {
    if (!socket.connected) {
      socket.connect()
    }
  }

  useEffect(() => {
    if (isSocketConnected && status === 'CONNECTED') {
      handleFetchChats()
    }
  }, [handleFetchChats, isSocketConnected, status])

  const formatChatId = (phone) => {
    const digits = phone.replace(/\D/g, '')
    return digits.endsWith('@c.us') ? digits : `${digits}@c.us`
  }

  const handleSendToNewChat = async () => {
    setSendError('')
    setSendSuccess('')

    if (!newContactNumber.trim() || !newContactMessage.trim()) {
      setSendError('אנא הזן מספר והודעה.')
      return
    }

    try {
      const formattedNumber = formatChatId(newContactNumber.trim())
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: formattedNumber, message: newContactMessage.trim() }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'שליחה נכשלה')
      }

      const newMessage = {
        id: `${Date.now()}`,
        chatId: formattedNumber,
        sender: 'אני',
        text: newContactMessage.trim(),
        timestamp: new Date().toLocaleTimeString('he-IL', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isOwn: true,
      }

      setMessagesByChat((prev) => {
        const existing = prev[formattedNumber] || []
        return { ...prev, [formattedNumber]: [...existing, newMessage] }
      })

      setChats((prev) => {
        const exists = prev.some((chat) => chat.id === formattedNumber)
        if (exists) {
          return prev.map((chat) =>
            chat.id === formattedNumber
              ? { ...chat, lastMessage: newMessage.text, lastMessageTime: newMessage.timestamp }
              : chat,
          )
        }
        return [
          {
            id: formattedNumber,
            name: newContactNumber.trim(),
            avatar: '👤',
            lastMessage: newMessage.text,
            lastMessageTime: newMessage.timestamp,
          },
          ...prev,
        ]
      })

      setSelectedChatId(formattedNumber)
      setNewContactMessage('')
      setSendSuccess('ההודעה נשלחה בהצלחה')
    } catch (error) {
      console.error(error)
      setSendError(error.message || 'שגיאה בשליחת ההודעה')
    }
  }

  const handleSendMessage = (text) => {
    if (!selectedChatId) {
      return
    }

    const payload = {
      chatId: selectedChatId,
      text,
      timestamp: new Date().toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    socket.emit('send-whatsapp-message', payload)
  }

  const currentMessages = messagesByChat[selectedChatId] || []

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          height: '100dvh',
          width: '100vw',
          backgroundColor: '#fff',
          overflow: 'hidden',
        }}
      >
        {showSidebar && (
          <Box
            sx={{
              width: { xs: '100%', sm: '360px' },
              height: {
                xs: showLoginPanel ? 'min(52dvh, 520px)' : '100%',
                sm: '100%',
              },
              minHeight: { xs: showLoginPanel ? 320 : 0, sm: 0 },
              borderRight: { xs: 0, sm: '1px solid #e5e5ea' },
              borderBottom: { xs: showLoginPanel ? '1px solid #e5e5ea' : 0, sm: 0 },
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
          <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: '1px solid #e5e5ea' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              מצב חיבור
            </Typography>
            <Typography variant="body2">{connectionLabel}</Typography>
            {!socket.connected && (
              <Button sx={{ mt: 1 }} variant="contained" onClick={handleRetryConnection}>
                נסה להתחבר מחדש
              </Button>
            )}
            {socket.connected && status === 'CONNECTED' && (
              <Button sx={{ mt: 1, ml: 1 }} variant="outlined" onClick={handleFetchChats}>
                רענן רשימת צ'אטים
              </Button>
            )}
          </Box>

          <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: '1px solid #e5e5ea' }}>
            <Button
              variant={isNewChatOpen ? 'outlined' : 'contained'}
              fullWidth
              startIcon={isNewChatOpen ? <CloseIcon /> : <AddIcon />}
              onClick={handleToggleNewChat}
            >
              {isNewChatOpen ? 'סגור שיחה חדשה' : 'שיחה חדשה'}
            </Button>
            <Collapse in={isNewChatOpen} unmountOnExit>
              <Box sx={{ pt: 1.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              שלח לשיחה חדשה
            </Typography>
            <TextField
              label="מספר טלפון"
              size="small"
              fullWidth
              value={newContactNumber}
              onChange={(e) => setNewContactNumber(e.target.value)}
              sx={{ mb: 1 }}
            />
            <TextField
              label="הודעה"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={newContactMessage}
              onChange={(e) => setNewContactMessage(e.target.value)}
            />
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 1 }}
              onClick={handleSendToNewChat}
              disabled={status !== 'CONNECTED'}
            >
              שלח לשיחה חדשה
            </Button>
            {sendError && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {sendError}
              </Typography>
            )}
            {sendSuccess && (
              <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                {sendSuccess}
              </Typography>
            )}
              </Box>
            </Collapse>
          </Box>

            <ChatList chats={chats} selectedChatId={selectedChatId} onSelectChat={handleSelectChat} />
          </Box>
        )}

        {showChatPanel && (
          <Box sx={{ flex: 1, height: { xs: showLoginPanel ? 'auto' : '100%' }, display: 'flex', minHeight: 0, minWidth: 0 }}>
          {showLoginPanel ? (
            <Box
              sx={{
                flex: 1,
                p: { xs: 2, sm: 4 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                overflowY: 'auto',
              }}
            >
              <Typography variant="h4" sx={{ mb: 2 }}>
                כניסה עם QR
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, maxWidth: 520 }}>
                אם אין חיבור לשרת, אפשר לסרוק קוד QR באופן מקומי דרך המצלמה או להעלות תמונה.
              </Typography>

              {qrSrc ? (
                <Box sx={{ mb: 3 }}>
                  <img
                    src={qrSrc}
                    alt="WhatsApp QR"
                    style={{ maxWidth: '320px', width: '100%', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    קוד QR מוכן לסריקה
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mb: 3, minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {status === 'QR_READY' ? 'ממתין לקוד QR...' : 'אין קוד QR כרגע.'}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 2 }}>
                <Button
                  variant="contained"
                  disabled={!cameraSupported || scannerActive}
                  onClick={() => {
                    setScanError('')
                    setScanResult('')
                    setScannerActive(true)
                  }}
                >
                  סרוק עם מצלמה
                </Button>
                <Button variant="outlined" component="label">
                  העלה תמונה
                  <input
                    key={fileInputKey}
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleScanFile}
                  />
                </Button>
              </Box>

              {scannerActive && (
                <Box sx={{ width: '100%', maxWidth: 560, mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    מציג מצלמה, סרוק את ה-QR מול המצלמה.
                  </Typography>
                  <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
                    <video ref={videoRef} style={{ width: '100%', height: 'auto' }} />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'rgba(0,0,0,0.48)',
                        color: '#fff',
                        p: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption">סריקה פעילה</Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {scanResult && (
                <Typography variant="body1" sx={{ mt: 1, wordBreak: 'break-word' }}>
                  סריקה הצליחה: {scanResult}
                </Typography>
              )}

              {scanError && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {scanError}
                </Typography>
              )}

              {!cameraSupported && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                  הדפדפן אינו תומך בסריקת QR דרך המצלמה. השתמש בהעלאת תמונה.
                </Typography>
              )}
            </Box>
          ) : (
            <ChatWindow
              chat={selectedChat}
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              onBack={isMobile ? () => setSelectedChatId(null) : undefined}
            />
          )}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  )
}

export default App
