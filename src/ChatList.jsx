import React from 'react';
import {
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  Box,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export function ChatList({ chats, selectedChatId, onSelectChat }) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        borderRight: '1px solid #e5e5ea',
      }}
    >
      {/* Header */}
      <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: '1px solid #e5e5ea' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: { xs: 1, sm: 2 }, fontSize: { xs: 20, sm: 24 } }}>
          Chats
        </Typography>
        <Box sx={{ position: 'relative' }}>
          <SearchIcon
            sx={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999',
            }}
          />
          <TextField
            placeholder="Search or start new chat"
            size="small"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                backgroundColor: '#f0f0f0',
                '& fieldset': { border: 'none' },
              },
              '& input': {
                paddingLeft: '40px',
              },
            }}
          />
        </Box>
      </Box>

      {/* Chat List */}
      <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
        {filteredChats.map(chat => (
          <ListItemButton
            key={chat.id}
            selected={selectedChatId === chat.id}
            onClick={() => onSelectChat(chat.id)}
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: { xs: 1, sm: 1.25 },
              borderBottom: '1px solid #f0f0f0',
              backgroundColor:
                selectedChatId === chat.id ? '#f0f0f0' : 'transparent',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              '&.Mui-selected': {
                backgroundColor: '#f0f0f0',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  width: { xs: 44, sm: 50 },
                  height: { xs: 44, sm: 50 },
                  fontSize: { xs: '22px', sm: '24px' },
                  backgroundColor: '#ddd',
                }}
              >
                {chat.avatar}
              </Avatar>
            </ListItemAvatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  fontWeight: selectedChatId === chat.id ? 600 : 500,
                  fontSize: '15px',
                }}
              >
                {chat.name}
              </Typography>
              <Typography noWrap sx={{ color: '#65676b', fontSize: '13px' }}>
                {chat.lastMessage}
              </Typography>
            </Box>
            <Typography noWrap variant="caption" sx={{ color: '#999', ml: 1, flexShrink: 0, maxWidth: 72 }}>
              {chat.lastMessageTime}
            </Typography>
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
