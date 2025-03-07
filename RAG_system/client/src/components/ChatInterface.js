import React from 'react';
import { Box, TextField, Button, CircularProgress } from '@mui/material';
import Message from './Message';

function ChatInterface({
  messages,
  input,
  setInput,
  isLoading,
  sendMessage,
  fontSize,
  fontFamily,
  letterSpacing,
  wordSpacing
}) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        setInput(prevInput => prevInput + '\n');
      } else {
        e.preventDefault();
        sendMessage();
      }
    }
  };

  return (
    <>
      <Box className="chat-history" sx={{ flex: 1, padding: 2, overflowY: 'auto', borderBottom: 1, borderColor: 'grey.300', display: 'flex', flexDirection: 'column' }}>
        {messages.map((msg, index) => (
          <Message 
            key={index} 
            text={msg.text} 
            sender={msg.sender} 
            fontSize={fontSize}
            fontFamily={fontFamily}
            letterSpacing={letterSpacing}
            wordSpacing={wordSpacing}
          />
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
            <Box sx={{ 
              bgcolor: 'grey.200', 
              borderRadius: '20px', 
              p: 2, 
              maxWidth: '70%',
              display: 'flex',
              alignItems: 'center'
            }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
            </Box>
          </Box>
        )}
      </Box>
      <Box className="chat-input" sx={{ display: 'flex', flexDirection: 'column', padding: 2, borderTop: 1, borderColor: 'grey.300', backgroundColor: 'white' }}>
        <Box className="chat-input-container" sx={{ display: 'flex', alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            multiline
            disabled={isLoading}
            sx={{ 
              flex: 0.85, 
              marginRight: 1,
              '& .MuiInputBase-input': {
                fontSize: `${fontSize}px`,
                fontFamily: fontFamily,
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
            disabled={isLoading}
            sx={{
              marginRight: 1,
              height: '56px',
              padding: '0 16px',
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
            }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </>
  );
}

export default ChatInterface;
