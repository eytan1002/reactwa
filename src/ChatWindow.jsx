import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  Paper,
  TextField,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';

function isOwnMessage(message) {
  return message.isOwn === true || message.fromMe === true || message.sender === 'אני';
}

function getSenderLabel(message) {
  const label = message.senderName || message.sender || '';

  if (!label || label.includes('@')) {
    return '';
  }

  return label;
}

function renderMessageMedia(media) {
  if (!media || !media.data) {
    return null;
  }

  const src = `data:${media.mimetype};base64,${media.data}`;
  const type = media.mimetype?.split('/')[0] || '';

  if (type === 'image' || media.mimetype === 'image/webp') {
    return (
      <Box
        component="img"
        src={src}
        alt={media.filename || 'media'}
        sx={{ width: '100%', borderRadius: 2, mt: 1 }}
      />
    );
  }

  if (type === 'video') {
    return (
      <Box sx={{ mt: 1 }}>
        <video controls src={src} style={{ width: '100%', borderRadius: 12 }} />
      </Box>
    );
  }

  if (type === 'audio') {
    return (
      <Box sx={{ mt: 1 }}>
        <audio controls src={src} style={{ width: '100%' }} />
      </Box>
    );
  }

  if (type === 'application' || media.mimetype === 'document' || media.mimetype === 'text/plain') {
    return (
      <Box sx={{ mt: 1 }}>
        <a href={src} download={media.filename || 'download'}>
          הורד קובץ {media.filename || 'media'}
        </a>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      <a href={src} download={media.filename || 'media'}>
        הורד קובץ {media.filename || 'media'}
      </a>
    </Box>
  );
}

export function ChatWindow({ chat, messages, onSendMessage, onBack }) {
  const [newMessage, setNewMessage] = React.useState('');
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  };

  React.useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  if (!chat) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          backgroundColor: '#fff',
        }}
      >
        <Typography variant="h6" sx={{ color: '#666' }}>
          בחר שיחה כדי להתחיל
        </Typography>
      </Box>
    )
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage('')
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
      }}
      
    >
      {/* Chat Header */}
      <Box
        sx={{
          p: { xs: 1.25, sm: 2 },
          borderBottom: '1px solid #e5e5ea',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {onBack && (
            <IconButton size="small" onClick={onBack} aria-label="Back to chats">
              <ArrowBackIcon />
            </IconButton>
          )}
          <Avatar
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              fontSize: { xs: '18px', sm: '20px' },
              backgroundColor: '#ddd',
            }}
          >
            {chat.avatar}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap variant="subtitle1" sx={{ fontWeight: 600 }}>
              {chat.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#65676b' }}>
              Active now
            </Typography>
          </Box>
        </Box>
        <IconButton size="small">
          <MoreVertIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          p: { xs: 1.25, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          backgroundColor: '#fff',
        }}
      >
        {messages.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#999', mt: 2 }}>
            אין הודעות עדיין.
          </Typography>
        ) : (
          messages.map((msg) => {
            const isOwn = isOwnMessage(msg);
            const senderLabel = getSenderLabel(msg);
            const showSenderLabel = !isOwn && chat.isGroup && senderLabel;

            return (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
                <Paper
                  sx={{
                  maxWidth: { xs: '84%', sm: '60%' },
                  p: '8px 12px',
                  borderRadius: '18px',
                  backgroundColor: isOwn ? '#e7f3ff' : '#f0f0f0',
                }}
              >
                {showSenderLabel && (
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: '#128c7e', display: 'block' }}
                  >
                    {senderLabel}
                  </Typography>
                )}
                {msg.text && (
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {msg.text}
                  </Typography>
                )}
                {msg.media && renderMessageMedia(msg.media)}
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'right',
                    mt: 0.5,
                    color: '#999',
                    fontSize: '11px',
                  }}
                >
                  {msg.timestamp}
                </Typography>
              </Paper>
            </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: { xs: 1, sm: 2 },
          borderTop: '1px solid #e5e5ea',
          display: 'flex',
          gap: { xs: 0.5, sm: 1 },
          alignItems: 'flex-end',
          minWidth: 0,
        }}
      >
        <IconButton size="small" sx={{ flexShrink: 0 }}>
          <AttachFileIcon />
        </IconButton>
        <TextField
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          multiline
          maxRows={3}
          fullWidth
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              backgroundColor: '#f0f0f0',
              '& fieldset': { border: 'none' },
            },
          }}
        />
        <IconButton
          onClick={handleSendMessage}
          sx={{ color: '#128c7e', flexShrink: 0 }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
