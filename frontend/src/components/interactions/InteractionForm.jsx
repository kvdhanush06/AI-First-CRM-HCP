import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createInteraction, 
  updateInteraction, 
  fetchProducts 
} from '../../store/slices/interactionSlice';
import { fetchHCPs } from '../../store/slices/hcpSlice';
import { showNotification } from '../../store/slices/uiSlice';
import { 
  Plus, 
  X, 
  Sparkles, 
  Save, 
  User, 
  Clipboard,
  Calendar,
  AlertCircle
} from 'lucide-react';
import './InteractionForm.css';

const InteractionForm = ({ initialData = null, onCancel = null, onSuccess = null }) => {
  const dispatch = useDispatch();
  const isEditMode = !!initialData;

  const { hcps } = useSelector((state) => state.hcp);
  const { products, loading } = useSelector((state) => state.interaction);
  const repName = useSelector((state) => state.ui.repName);

  // Form states
  const [hcpId, setHcpId] = useState(initialData?.hcp_id || '');
  const [interactionType, setInteractionType] = useState(initialData?.interaction_type || 'detail_call');
  const [date, setDate] = useState(
    initialData?.date 
      ? new Date(initialData.date).toISOString().slice(0, 16) 
      : new Date().toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [selectedProducts, setSelectedProducts] = useState(initialData?.products_discussed || []);
  const [followUps, setFollowUps] = useState(initialData?.follow_up_actions || []);
  const [newFollowUp, setNewFollowUp] = useState('');

  // Autocomplete search
  const [hcpSearch, setHcpSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchHCPs());
  }, [dispatch]);

  // Set search input when editing or choosing HCP
  useEffect(() => {
    if (initialData?.hcp) {
      setHcpSearch(`Dr. ${initialData.hcp.first_name} ${initialData.hcp.last_name}`);
    } else if (hcpId && hcps.length > 0) {
      const selected = hcps.find(h => h.id === parseInt(hcpId));
      if (selected) {
        setHcpSearch(`Dr. ${selected.first_name} ${selected.last_name}`);
      }
    }
  }, [hcpId, hcps, initialData]);

  const filteredHcps = hcps.filter(hcp => {
    const fullName = `Dr. ${hcp.first_name} ${hcp.last_name}`.toLowerCase();
    const specialty = (hcp.specialty || '').toLowerCase();
    const term = hcpSearch.toLowerCase();
    return fullName.includes(term) || specialty.includes(term);
  });

  const handleProductToggle = (productName) => {
    if (selectedProducts.includes(productName)) {
      setSelectedProducts(selectedProducts.filter(p => p !== productName));
    } else {
      setSelectedProducts([...selectedProducts, productName]);
    }
  };

  const handleAddFollowUp = (e) => {
    e.preventDefault();
    if (newFollowUp.trim()) {
      setFollowUps([...followUps, newFollowUp.trim()]);
      setNewFollowUp('');
    }
  };

  const handleRemoveFollowUp = (index) => {
    setFollowUps(followUps.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hcpId) {
      dispatch(showNotification({ message: 'Please select a valid HCP.', type: 'error' }));
      return;
    }

    const payload = {
      hcp_id: parseInt(hcpId),
      rep_name: repName,
      interaction_type: interactionType,
      date: new Date(date).toISOString(),
      notes: notes,
      products_discussed: selectedProducts,
      follow_up_actions: followUps,
    };

    try {
      if (isEditMode) {
        await dispatch(updateInteraction({ id: initialData.id, payload })).unwrap();
        dispatch(showNotification({ message: 'Interaction updated successfully with AI summary!', type: 'success' }));
      } else {
        await dispatch(createInteraction(payload)).unwrap();
        dispatch(showNotification({ message: 'Interaction logged successfully with AI summary!', type: 'success' }));
        // Reset form
        setHcpId('');
        setHcpSearch('');
        setNotes('');
        setSelectedProducts([]);
        setFollowUps([]);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      dispatch(showNotification({ message: err || 'Submission failed.', type: 'error' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="interaction-form-panel">
      <div className="form-header">
        <Clipboard size={18} className="form-header-icon" />
        <h3>{isEditMode ? 'Edit Interaction Details' : 'Log New Interaction'}</h3>
        {!isEditMode && (
          <span className="ai-badge">
            <Sparkles size={12} />
            <span>AI Automated Summary</span>
          </span>
        )}
      </div>

      <div className="form-fields">
        {/* HCP Selection */}
        <div className="form-group autocomplete-group">
          <label htmlFor="hcp-search">Healthcare Professional (HCP) *</label>
          <div className="input-with-icon">
            <User size={16} className="input-icon" />
            <input 
              type="text" 
              id="hcp-search"
              value={hcpSearch}
              onChange={(e) => {
                setHcpSearch(e.target.value);
                setShowDropdown(true);
                if (hcpId) setHcpId(''); // Clear selection on change
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search by Doctor name or specialty..."
              required
            />
          </div>
          
          {showDropdown && hcpSearch && (
            <ul className="autocomplete-dropdown glass-panel">
              {filteredHcps.length > 0 ? (
                filteredHcps.map((hcp) => (
                  <li 
                    key={hcp.id}
                    onClick={() => {
                      setHcpId(hcp.id.toString());
                      setHcpSearch(`Dr. ${hcp.first_name} ${hcp.last_name}`);
                      setShowDropdown(false);
                    }}
                  >
                    <div className="drop-hcp-name">Dr. {hcp.first_name} {hcp.last_name}</div>
                    <div className="drop-hcp-sub">{hcp.specialty} • {hcp.affiliation}</div>
                  </li>
                ))
              ) : (
                <li className="no-results"><AlertCircle size={14} /> No doctors found</li>
              )}
            </ul>
          )}
        </div>

        {/* Interaction Type and Date Grid */}
        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="interaction-type">Interaction Type</label>
            <select 
              id="interaction-type"
              value={interactionType}
              onChange={(e) => setInteractionType(e.target.value)}
            >
              <option value="detail_call">Detail Call (Product Pitch)</option>
              <option value="phone_call">Phone Call</option>
              <option value="email">Email</option>
              <option value="virtual_meeting">Virtual Meeting</option>
              <option value="sample_drop">Sample Drop</option>
              <option value="conference">Conference Interaction</option>
              <option value="follow_up">Follow Up</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date & Time *</label>
            <div className="input-with-icon">
              <Calendar size={16} className="input-icon" />
              <input 
                type="datetime-local" 
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Notes Textarea */}
        <div className="form-group">
          <label htmlFor="notes">Discussion Notes & Feedback</label>
          <textarea 
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe details of the discussion, Doctor feedback, questions asked, interest level, etc."
            rows={4}
          />
        </div>

        {/* Products Discussed Checkboxes */}
        <div className="form-group">
          <label>Products Discussed</label>
          <div className="products-grid">
            {products.map((prod) => (
              <label key={prod.id} className="product-checkbox-wrapper">
                <input 
                  type="checkbox"
                  checked={selectedProducts.includes(prod.name)}
                  onChange={() => handleProductToggle(prod.name)}
                />
                <span className="custom-checkbox"></span>
                <span className="product-label-text">
                  <strong>{prod.name}</strong> 
                  <small>{prod.therapeutic_area}</small>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Follow up Action Checklist */}
        <div className="form-group">
          <label>Follow-up Actions Checklist</label>
          <div className="followup-input-wrapper">
            <input 
              type="text" 
              value={newFollowUp}
              onChange={(e) => setNewFollowUp(e.target.value)}
              placeholder="e.g. Share clinical trial PDF by Friday"
              className="followup-text-input"
            />
            <button 
              type="button" 
              onClick={handleAddFollowUp} 
              className="btn btn-secondary add-followup-btn"
            >
              <Plus size={16} />
              <span>Add</span>
            </button>
          </div>

          {followUps.length > 0 && (
            <div className="followup-tags-list">
              {followUps.map((action, idx) => (
                <div key={idx} className="followup-tag">
                  <span>{action}</span>
                  <button type="button" onClick={() => handleRemoveFollowUp(idx)} className="remove-tag-btn">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary submit-form-btn">
          <Save size={16} />
          <span>{isEditMode ? 'Update Log' : 'Save CRM Log'}</span>
        </button>
      </div>
    </form>
  );
};

export default InteractionForm;
