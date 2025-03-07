import React, { useState } from 'react';
import './App.css';
import { Container, Box, Typography, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsGear from './components/SettingsGear';
import ChatInterface from './components/ChatInterface';
import { useChatLogic } from './hooks/useChatLogic'; 

function App() {
  const [wordSpacing, setWordSpacing] = useState(0);

  const {
    messages,
    input,
    setInput,
    isLoading,
    sendMessage,
    resetChat
  } = useChatLogic();

  const handleWordSpacingChange = (newSpacing) => setWordSpacing(newSpacing);

  return (
    <Container maxWidth="xl" disableGutters>
      <Box className="chat-container">
        <Box className="header">
          <Box className="logo" sx={{ display: 'flex', alignItems: 'center' }}>
            <span>ANLP Assignment 2<span className="compass-effect" style={{ color: '#a12614' }}>-CMU/PGH RAG</span></span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={resetChat}
              startIcon={<RefreshIcon />}
              sx={{ mr: 2 }}
              disabled={isLoading}
            >
              Reset Chat
            </Button>
            <SettingsGear 
              wordSpacing={wordSpacing}
              onWordSpacingChange={handleWordSpacingChange}
              resetChat={resetChat}
            />
          </Box>
        </Box>
        <ChatInterface
          messages={messages}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          sendMessage={sendMessage}
          wordSpacing={wordSpacing}
        />
        <Box className="footer" sx={{ p: 2, borderTop: 1, borderColor: 'grey.300', backgroundColor: 'white' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            This system is AI-powered and may occasionally produce incorrect, biased, or incomplete results. Please use the information with discretion.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

export default App;
