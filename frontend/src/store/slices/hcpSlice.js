import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchHCPs = createAsyncThunk(
  'hcp/fetchHCPs',
  async (search = '', { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/hcps', {
        params: search ? { search } : {},
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch HCPs');
    }
  }
);

export const fetchHCPDetails = createAsyncThunk(
  'hcp/fetchHCPDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/hcps/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch HCP details');
    }
  }
);

const hcpSlice = createSlice({
  name: 'hcp',
  initialState: {
    hcps: [],
    selectedHCP: null,
    loading: false,
    detailsLoading: false,
    error: null,
  },
  reducers: {
    clearSelectedHCP: (state) => {
      state.selectedHCP = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch HCPs
      .addCase(fetchHCPs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHCPs.fulfilled, (state, action) => {
        state.loading = false;
        state.hcps = action.payload;
      })
      .addCase(fetchHCPs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch HCP Details
      .addCase(fetchHCPDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchHCPDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedHCP = action.payload;
      })
      .addCase(fetchHCPDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedHCP } = hcpSlice.actions;
export default hcpSlice.reducer;
