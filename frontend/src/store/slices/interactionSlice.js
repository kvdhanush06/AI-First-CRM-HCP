import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchInteractions = createAsyncThunk(
  'interaction/fetchInteractions',
  async ({ hcp_id = '', interaction_type = '', page = 1, size = 10 } = {}, { rejectWithValue }) => {
    try {
      const params = { page, size };
      if (hcp_id) params.hcp_id = hcp_id;
      if (interaction_type) params.interaction_type = interaction_type;
      
      const response = await axios.get('/api/interactions', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch interactions');
    }
  }
);

export const createInteraction = createAsyncThunk(
  'interaction/createInteraction',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/interactions', payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to log interaction');
    }
  }
);

export const updateInteraction = createAsyncThunk(
  'interaction/updateInteraction',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/interactions/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update interaction');
    }
  }
);

export const deleteInteraction = createAsyncThunk(
  'interaction/deleteInteraction',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/interactions/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete interaction');
    }
  }
);

export const fetchProducts = createAsyncThunk(
  'interaction/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/products');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch products');
    }
  }
);

const interactionSlice = createSlice({
  name: 'interaction',
  initialState: {
    items: [],
    total: 0,
    page: 1,
    size: 10,
    products: [],
    loading: false,
    productsLoading: false,
    error: null,
  },
  reducers: {
    resetInteractionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Interactions
      .addCase(fetchInteractions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.size = action.payload.size;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Interaction
      .addCase(createInteraction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInteraction.fulfilled, (state, action) => {
        state.loading = false;
        state.items = [action.payload, ...state.items].slice(0, state.size);
        state.total += 1;
      })
      .addCase(createInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Interaction
      .addCase(updateInteraction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInteraction.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map(item => 
          item.id === action.payload.id ? action.payload : item
        );
      })
      .addCase(updateInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Interaction
      .addCase(deleteInteraction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInteraction.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.productsLoading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.productsLoading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state) => {
        state.productsLoading = false;
      });
  },
});

export const { resetInteractionError } = interactionSlice.actions;
export default interactionSlice.reducer;
