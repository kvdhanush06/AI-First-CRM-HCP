import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Generate a random session ID on load
const generateSessionId = () => {
  return `session-${Math.random().toString(36).substring(2, 15)}`;
};

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, rep_name }, { getState, rejectWithValue }) => {
    try {
      const { chat } = getState();
      const response = await axios.post('/api/chat', {
        message,
        session_id: chat.sessionId,
        rep_name,
      });
      return response.data; // { message, session_id, tool_calls }
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to connect to AI Agent');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I am your AI CRM Assistant. You can log an interaction, lookup an HCP, retrieve history, or ask for next action suggestions by typing in natural language here.',
        tool_calls: []
      }
    ],
    sessionId: generateSessionId(),
    loading: false,
    error: null,
  },
  reducers: {
    clearChat: (state) => {
      state.messages = [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Chat history cleared. How can I help you today?',
          tool_calls: []
        }
      ];
      state.sessionId = generateSessionId();
      state.error = null;
    },
    addLocalMessage: (state, action) => {
      state.messages.push({
        id: `msg-${Date.now()}`,
        role: action.payload.role,
        content: action.payload.content,
        tool_calls: action.payload.tool_calls || []
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({
          id: `msg-agent-${Date.now()}`,
          role: 'assistant',
          content: action.payload.message,
          tool_calls: action.payload.tool_calls || []
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.messages.push({
          id: `msg-error-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${action.payload || 'Could not reach agent.'}`,
          tool_calls: []
        });
      });
  },
});

export const { clearChat, addLocalMessage } = chatSlice.actions;
export default chatSlice.reducer;
