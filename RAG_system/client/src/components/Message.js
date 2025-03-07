import React from 'react';
import { Box, Typography } from '@mui/material';
import { useMessageLogic } from '../hooks/useMessageLogic';
import ReactMarkdown from 'react-markdown';

function Message({ text, sender, wordSpacing }) {
  const {
    sentences,
  } = useMessageLogic(text, null);

  const fontStyle = {
    wordSpacing: `${wordSpacing}px`,
  };

  // Different styles based on sender type
  const getMessageStyles = () => {
    const baseStyles = {
      whiteSpace: 'pre-wrap',
      marginBottom: 1,
      padding: 1,
      borderRadius: 2,
      maxWidth: '80%',
      ...fontStyle,
      '& p': {
        margin: 0,
        lineHeight: 1.2,
      },
      '& ul, & ol': {
        margin: '0.05em 0',
        padding: '0 1em',
        lineHeight: 1.2,
      },
      '& li': {
        margin: '0.05em 0',
        lineHeight: 1.2,
      },
      '& blockquote': {
        margin: '0.1em 0',
        lineHeight: 1.2,
      },
      '& h1, & h2, & h3, & h4': {
        margin: '0.05em 0',
        lineHeight: 1.2,
      },
    };
    
    switch (sender) {
      case 'user':
        return {
          ...baseStyles,
          alignSelf: 'flex-end',
          backgroundColor: 'primary.main',
          color: 'white',
          marginLeft: 'auto',
        };
      case 'llm':
        return {
          ...baseStyles,
          alignSelf: 'flex-start',
          backgroundColor: 'grey.300',
          color: 'black',
        };
      case 'system':
        return {
          ...baseStyles,
          alignSelf: 'center',
          backgroundColor: 'info.light',
          color: 'info.contrastText',
          maxWidth: '90%',
          padding: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'info.main',
        };
      default:
        return baseStyles;
    }
  };

  return (
    <Box
      className={`message ${sender}`}
      sx={getMessageStyles()}
    >
      {sender === 'user' ? (
        <Typography
          variant="body1"
          component="div"
          sx={{
            ...fontStyle,
            lineHeight: 1.2,
          }}
        >
          {sentences.map((sentence, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'inline', 
                position: 'relative',
                transition: 'background-color 0.3s',
              }}
            >
              {sentence}
              {' '}
            </Box>
          ))}
        </Typography>
      ) : (
        <ReactMarkdown>
          {text}
        </ReactMarkdown>
      )}
    </Box>
  );
}

export default Message;
