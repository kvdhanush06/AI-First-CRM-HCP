import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    repName: localStorage.getItem('repName') || 'John Doe',
    notification: null, // { message: '', type: 'success' | 'error' | 'info' }
  },
  reducers: {
    setRepName: (state, action) => {
      state.repName = action.payload;
      localStorage.setItem('repName', action.payload);
    },
    showNotification: (state, action) => {
      state.notification = {
        message: action.payload.message,
        type: action.payload.type || 'info',
        id: Date.now()
      };
    },
    clearNotification: (state) => {
      state.notification = null;
    }
  }
});

export const { setRepName, showNotification, clearNotification } = uiSlice.actions;
export default uiSlice.reducer;
