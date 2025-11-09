import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { InventoryAPI, DailyInventoryAPI } from '../utils/api.js';
import { 
  getFreshnessOptions, 
  requiresManualExpiryDate, 
  getDefaultExpiryDate, 
  calculateExpiryDate,
  getExpiryDateDescription,
  getExpiryStatusClass,
  getDaysUntilExpiry
} from '../utils/expiryUtils.js';

const InventoryManagement = () => {
  const [items, setItems] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [dayStatus, setDayStatus] = useState({ isDayEnded: false });
  const [expiredItems, setExpiredItems] = useState([]);
  const [showExpiredItems, setShowExpiredItems] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showDailyInventory, setShowDailyInventory] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0, // Set to 0 by default for General Inventory
    unit: 'pcs',
    storageCondition: 'normal_temperature',
    category: 'other',
    minThreshold: '',
    maxThreshold: '',
    notes: '',
    image: null
  });
  const [dailyFormData, setDailyFormData] = useState({
    inventoryItemId: '',
    isNewItem: false,
    name: '',
    quantity: '',
    unit: 'pcs',
    category: 'other',
    storageCondition: 'normal_temperature',
    expiryDate: '',
    cost: '',
    supplier: '',
    minThreshold: '',
    maxThreshold: '',
    notes: '',
    image: null,
    freshness: 'fresh'
  });
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingExpired, setLoadingExpired] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    const today = new Date();
    setTodayDate(today.toISOString().split('T')[0]);
    fetchItems();
    fetchTodayInventory();
    fetchDayStatus();
    fetchAvailableItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await InventoryAPI.getAllItems();
      setItems(response.data.docs || response.data || []);
    } catch (error) {
      toast.error('Failed to fetch items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayInventory = async () => {
    try {
      setLoadingDaily(true);
      const response = await DailyInventoryAPI.getTodayInventory();
      setTodayEntries(response.data.entries || []);
      setDayStatus({ isDayEnded: response.data.isDayEnded || false });
    } catch (error) {
      toast.error('Failed to fetch today\'s inventory: ' + error.message);
    } finally {
      setLoadingDaily(false);
    }
  };

  const fetchDayStatus = async () => {
    try {
      const response = await DailyInventoryAPI.getDayStatus();
      setDayStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch day status:', error);
    }
  };

  const fetchAvailableItems = async () => {
    try {
      const response = await DailyInventoryAPI.getAvailableItems();
      setAvailableItems(response.data || []);
    } catch (error) {
      console.error('Failed to fetch available items:', error);
    }
  };

  const fetchExpiredItems = async () => {
    try {
      setLoadingExpired(true);
      const response = await InventoryAPI.getExpiredItems();
      setExpiredItems(response.data || []);
      setShowExpiredItems(true);
      toast.success(`Found ${response.data?.length || 0} expired items`);
    } catch (error) {
      toast.error('Failed to fetch expired items: ' + error.message);
    } finally {
      setLoadingExpired(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDailyInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setDailyFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else if (type === 'checkbox') {
      setDailyFormData((prev) => ({ ...prev, [name]: e.target.checked }));
    } else {
      setDailyFormData((prev) => {
        const newData = { ...prev, [name]: value };
        
        // Handle category change - reset freshness and expiry date
        if (name === 'category') {
          newData.freshness = 'fresh';
          // Set default expiry date based on category (only for new items)
          if (newData.isNewItem) {
            if (!requiresManualExpiryDate(value)) {
              newData.expiryDate = calculateExpiryDate(value, 'fresh');
            } else {
              // For manual entry categories, set default
              newData.expiryDate = getDefaultExpiryDate(value);
            }
          }
        }
        
        // Handle freshness change - calculate expiry date if not manual entry
        if (name === 'freshness' && !requiresManualExpiryDate(newData.category) && newData.isNewItem) {
          newData.expiryDate = calculateExpiryDate(newData.category, value);
        }

        // When selecting an existing item, populate fields but keep expiry date and cost editable
        if (name === 'inventoryItemId' && value) {
          const selectedItem = availableItems.find(item => item._id === value);
          if (selectedItem) {
            newData.isNewItem = false;
            newData.name = selectedItem.name;
            newData.unit = selectedItem.unit;
            newData.category = selectedItem.category;
            newData.storageCondition = selectedItem.storageCondition;
            newData.supplier = selectedItem.supplier || '';
            newData.minThreshold = selectedItem.minThreshold || '';
            newData.maxThreshold = selectedItem.maxThreshold || '';
            newData.notes = selectedItem.notes || '';
            // Don't override expiry date and cost - let user set them for this daily entry
          }
        }

        // When toggling isNewItem, clear inventoryItemId if creating new
        if (name === 'isNewItem' && value === true) {
          newData.inventoryItemId = '';
          // Set default expiry date when switching to new item
          if (!requiresManualExpiryDate(newData.category)) {
            newData.expiryDate = calculateExpiryDate(newData.category, newData.freshness);
          } else {
            newData.expiryDate = getDefaultExpiryDate(newData.category);
          }
        }
        
        return newData;
      });
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Ensure quantity is set to 0 for General Inventory
      const itemData = {
        ...formData,
        quantity: formData.quantity || 0
      };
      await InventoryAPI.addItem(itemData);
      toast.success('Item added successfully');
      setShowAddForm(false);
      resetForm();
      fetchItems();
      fetchAvailableItems();
    } catch (error) {
      toast.error('Failed to add item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToToday = async (e) => {
    e.preventDefault();
    if (dayStatus.isDayEnded) {
      toast.error('Cannot add items. The day has been ended.');
      return;
    }

    // Validation
    if (dailyFormData.isNewItem) {
      if (!dailyFormData.name || !dailyFormData.quantity || !dailyFormData.category || !dailyFormData.storageCondition) {
        toast.error('Please fill in all required fields (Item Name, Quantity, Category, Storage Condition)');
        return;
      }
      if (requiresManualExpiryDate(dailyFormData.category) && !dailyFormData.expiryDate) {
        toast.error('Please enter expiry date for this category');
        return;
      }
    } else {
      if (!dailyFormData.inventoryItemId || !dailyFormData.quantity) {
        toast.error('Please select an item and enter quantity');
        return;
      }
    }

    try {
      setLoadingDaily(true);
      let inventoryItemId = dailyFormData.inventoryItemId;

      // If creating a new item, create it in inventory first
      if (dailyFormData.isNewItem) {
        const itemData = {
          name: dailyFormData.name,
          quantity: dailyFormData.quantity,
          unit: dailyFormData.unit,
          category: dailyFormData.category,
          storageCondition: dailyFormData.storageCondition,
          expiryDate: dailyFormData.expiryDate || undefined,
          supplier: dailyFormData.supplier || undefined,
          cost: dailyFormData.cost || undefined,
          minThreshold: dailyFormData.minThreshold || undefined,
          maxThreshold: dailyFormData.maxThreshold || undefined,
          notes: dailyFormData.notes || undefined,
          image: dailyFormData.image || undefined
        };

        const newItemResponse = await InventoryAPI.addItem(itemData);
        inventoryItemId = newItemResponse.data._id;
      }

      // Add to today's inventory
      await DailyInventoryAPI.addItemToToday({
        inventoryItemId: inventoryItemId,
        quantity: dailyFormData.quantity,
        cost: dailyFormData.cost || undefined,
        expiryDate: dailyFormData.expiryDate || undefined
      });

      toast.success('Item added to today\'s inventory successfully');
      setDailyFormData({
        inventoryItemId: '',
        isNewItem: false,
        name: '',
        quantity: '',
        unit: 'pcs',
        category: 'other',
        storageCondition: 'normal_temperature',
        expiryDate: '',
        cost: '',
        supplier: '',
        minThreshold: '',
        maxThreshold: '',
        notes: '',
        image: null,
        freshness: 'fresh'
      });
      fetchTodayInventory();
      fetchItems();
      fetchAvailableItems();
    } catch (error) {
      toast.error('Failed to add item: ' + error.message);
    } finally {
      setLoadingDaily(false);
    }
  };

  const handleEndDay = async () => {
    if (!window.confirm('Are you sure you want to end the day? You will not be able to add new items after ending the day.')) {
      return;
    }

    try {
      setLoadingDaily(true);
      await DailyInventoryAPI.endDay();
      toast.success('Day ended successfully');
      fetchDayStatus();
      fetchTodayInventory();
    } catch (error) {
      toast.error('Failed to end day: ' + error.message);
    } finally {
      setLoadingDaily(false);
    }
  };

  const handleStartNewDay = async () => {
    if (!window.confirm('Start a new day? Non-expired items from yesterday will be carried forward.')) {
      return;
    }

    try {
      setLoadingDaily(true);
      const response = await DailyInventoryAPI.startNewDay();
      toast.success(`New day started! ${response.data.carriedForwardCount} items carried forward from yesterday.`);
      fetchDayStatus();
      fetchTodayInventory();
    } catch (error) {
      toast.error('Failed to start new day: ' + error.message);
    } finally {
      setLoadingDaily(false);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      setLoading(true);
      // Ensure quantity is preserved for General Inventory updates
      const itemData = {
        ...formData,
        quantity: editingItem.quantity || formData.quantity || 0
      };
      await InventoryAPI.updateItem(editingItem._id, itemData);
      toast.success('Item updated successfully');
      setShowUpdateForm(false);
      resetForm();
      setEditingItem(null);
      fetchItems();
      fetchAvailableItems();
    } catch (error) {
      toast.error('Failed to update item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        setLoading(true);
        await InventoryAPI.deleteItem(itemId);
        toast.success('Item removed successfully');
        fetchItems();
        fetchAvailableItems();
      } catch (error) {
        toast.error('Failed to remove item: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const blob = await InventoryAPI.exportToCSV();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `inventory_export_${timestamp}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      toast.success('Inventory data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startUpdate = (item) => {
    setFormData({
      name: item.name,
      quantity: item.quantity || 0,
      unit: item.unit,
      storageCondition: item.storageCondition,
      category: item.category,
      minThreshold: item.minThreshold || '',
      maxThreshold: item.maxThreshold || '',
      notes: item.notes || '',
      image: null
    });
    setEditingItem(item);
    setShowUpdateForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: 0,
      unit: 'pcs',
      storageCondition: 'normal_temperature',
      category: 'other',
      minThreshold: '',
      maxThreshold: '',
      notes: '',
      image: null
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Inventory Management</h1>

      {/* Day Status and Controls */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Today: {todayDate}</h2>
            <p className={`text-sm ${dayStatus.isDayEnded ? 'text-red-600' : 'text-green-600'}`}>
              Status: {dayStatus.isDayEnded ? 'Day Ended' : 'Day Active'}
            </p>
          </div>
          <div className="flex gap-2">
            {!dayStatus.isDayEnded ? (
              <button
                onClick={handleEndDay}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                disabled={loadingDaily}
              >
                End Day
              </button>
            ) : (
              <button
                onClick={handleStartNewDay}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                disabled={loadingDaily}
              >
                Start New Day
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toggle between Daily Inventory and General Inventory */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setShowDailyInventory(true)}
          className={`px-4 py-2 rounded ${showDailyInventory ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Daily Inventory
        </button>
        <button
          onClick={() => setShowDailyInventory(false)}
          className={`px-4 py-2 rounded ${!showDailyInventory ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          General Inventory
        </button>
      </div>

      {/* Daily Inventory Section */}
      {showDailyInventory && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Today's Inventory</h2>
          
          {/* Add Item to Today Form */}
          {!dayStatus.isDayEnded && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold mb-4">Add New Item</h3>
              <form onSubmit={handleAddToToday}>
                {/* Toggle between existing item and new item */}
                <div className="mb-4 flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="itemType"
                      checked={!dailyFormData.isNewItem}
                      onChange={() => {
                        setDailyFormData(prev => ({
                          ...prev,
                          isNewItem: false,
                          inventoryItemId: '',
                          name: '',
                          expiryDate: '',
                          cost: ''
                        }));
                      }}
                      className="form-radio"
                    />
                    <span className="text-sm font-medium text-gray-700">Select Existing Item</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="itemType"
                      checked={dailyFormData.isNewItem}
                      onChange={() => {
                        const defaultExpiry = !requiresManualExpiryDate(dailyFormData.category)
                          ? calculateExpiryDate(dailyFormData.category, 'fresh')
                          : getDefaultExpiryDate(dailyFormData.category);
                        setDailyFormData(prev => ({
                          ...prev,
                          isNewItem: true,
                          inventoryItemId: '',
                          expiryDate: defaultExpiry
                        }));
                      }}
                      className="form-radio"
                    />
                    <span className="text-sm font-medium text-gray-700">Create New Item</span>
                  </label>
                </div>

                {/* Select existing item (shown when not creating new) */}
                {!dailyFormData.isNewItem && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Item *</label>
                    <select
                      name="inventoryItemId"
                      value={dailyFormData.inventoryItemId}
                      onChange={handleDailyInputChange}
                      className="p-2 border border-gray-300 rounded w-full"
                      required={!dailyFormData.isNewItem}
                    >
                      <option value="">Select an item</option>
                      {availableItems.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name} ({item.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Item Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name {dailyFormData.isNewItem ? '*' : ''}
                      </label>
                      {dailyFormData.isNewItem ? (
                        <input
                          type="text"
                          name="name"
                          value={dailyFormData.name}
                          onChange={handleDailyInputChange}
                          placeholder="Item Name"
                          className="p-2 border border-gray-300 rounded w-full"
                          required={dailyFormData.isNewItem}
                        />
                      ) : (
                        <input
                          type="text"
                          value={dailyFormData.name || 'Select an item above'}
                          className="p-2 border border-gray-300 rounded w-full bg-gray-100"
                          disabled
                        />
                      )}
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      {dailyFormData.isNewItem ? (
                        <select
                          name="unit"
                          value={dailyFormData.unit}
                          onChange={handleDailyInputChange}
                          className="p-2 border border-gray-300 rounded w-full"
                        >
                          <option value="pcs">pcs</option>
                          <option value="kg">kg</option>
                          <option value="ltr">ltr</option>
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="lb">lb</option>
                          <option value="oz">oz</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={dailyFormData.unit || 'pcs'}
                          className="p-2 border border-gray-300 rounded w-full bg-gray-100"
                          disabled
                        />
                      )}
                    </div>

                    {/* Storage Condition */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Storage Condition {dailyFormData.isNewItem ? '*' : ''}
                      </label>
                      {dailyFormData.isNewItem ? (
                        <select
                          name="storageCondition"
                          value={dailyFormData.storageCondition}
                          onChange={handleDailyInputChange}
                          className="p-2 border border-gray-300 rounded w-full"
                          required={dailyFormData.isNewItem}
                        >
                          <option value="normal_temperature">Normal Temperature</option>
                          <option value="fridge">Fridge</option>
                          <option value="freezer">Freezer</option>
                          <option value="room_temperature">Room Temperature</option>
                          <option value="pantry">Pantry</option>
                          <option value="dry_storage">Dry Storage</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={dailyFormData.storageCondition ? dailyFormData.storageCondition.replace('_', ' ') : 'Normal Temperature'}
                          className="p-2 border border-gray-300 rounded w-full bg-gray-100 capitalize"
                          disabled
                        />
                      )}
                    </div>

                    {/* Supplier */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                      {dailyFormData.isNewItem ? (
                        <input
                          type="text"
                          name="supplier"
                          value={dailyFormData.supplier}
                          onChange={handleDailyInputChange}
                          placeholder="Supplier Name"
                          className="p-2 border border-gray-300 rounded w-full"
                        />
                      ) : (
                        <input
                          type="text"
                          value={dailyFormData.supplier || 'N/A'}
                          className="p-2 border border-gray-300 rounded w-full bg-gray-100"
                          disabled
                        />
                      )}
                    </div>

                    {/* Min Threshold */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Threshold</label>
                      {dailyFormData.isNewItem ? (
                        <input
                          type="number"
                          name="minThreshold"
                          value={dailyFormData.minThreshold}
                          onChange={handleDailyInputChange}
                          placeholder="Minimum stock level"
                          className="p-2 border border-gray-300 rounded w-full"
                          min="0"
                        />
                      ) : (
                        <input
                          type="text"
                          value={dailyFormData.minThreshold || 'N/A'}
                          className="p-2 border border-gray-300 rounded w-full bg-gray-100"
                          disabled
                        />
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      {dailyFormData.isNewItem ? (
                        <textarea
                          name="notes"
                          value={dailyFormData.notes}
                          onChange={handleDailyInputChange}
                          placeholder="Additional notes"
                          className="p-2 border border-gray-300 rounded w-full"
                          rows="3"
                        />
                      ) : (
                        <textarea
                          value={dailyFormData.notes || 'No notes'}
                          className="p-2 border border-gray-300 rounded w-full bg-gray-100"
                          rows="3"
                          disabled
                        />
                      )}
                    </div>

                    {/* Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                      {dailyFormData.isNewItem ? (
                        <input
                          type="file"
                          name="image"
                          onChange={handleDailyInputChange}
                          accept="image/*"
                          className="p-2 border border-gray-300 rounded w-full"
                        />
                      ) : (
                        <input
                          type="text"
                          value={dailyFormData.image ? 'Image uploaded' : 'No image'}
                          className="p-2 border border-gray-300 rounded w-full bg-gray-100"
                          disabled
                        />
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                      <input
                        type="number"
                        name="quantity"
                        value={dailyFormData.quantity}
                        onChange={handleDailyInputChange}
                        placeholder="Quantity"
                        className="p-2 border border-gray-300 rounded w-full"
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category {dailyFormData.isNewItem ? '*' : ''}
                      </label>
                      {dailyFormData.isNewItem ? (
                        <select
                          name="category"
                          value={dailyFormData.category}
                          onChange={handleDailyInputChange}
                          className="p-2 border border-gray-300 rounded w-full"
                          required={dailyFormData.isNewItem}
                        >
                          <option value="vegetables">Vegetables</option>
                          <option value="fruits">Fruits</option>
                          <option value="dairy">Dairy</option>
                          <option value="meat">Meat</option>
                          <option value="seafood">Seafood</option>
                          <option value="grains">Grains</option>
                          <option value="spices">Spices</option>
                          <option value="beverages">Beverages</option>
                          <option value="frozen">Frozen</option>
                          <option value="canned">Canned</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={dailyFormData.category ? dailyFormData.category.charAt(0).toUpperCase() + dailyFormData.category.slice(1) : 'Other'}
                          className="p-2 border border-gray-300 rounded w-full bg-gray-100 capitalize"
                          disabled
                        />
                      )}
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date {dailyFormData.isNewItem && requiresManualExpiryDate(dailyFormData.category) ? '*' : ''}
                      </label>
                      <input
                        type="date"
                        name="expiryDate"
                        value={dailyFormData.expiryDate}
                        onChange={handleDailyInputChange}
                        placeholder="dd-mm-yyyy"
                        className="p-2 border border-gray-300 rounded w-full"
                        required={dailyFormData.isNewItem && requiresManualExpiryDate(dailyFormData.category)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {dailyFormData.isNewItem 
                          ? getExpiryDateDescription(dailyFormData.category)
                          : "Please enter the expiry date manually or leave blank for default (30 days)"}
                      </p>
                    </div>

                    {/* Freshness Level (only for categories that support it) */}
                    {dailyFormData.isNewItem && !requiresManualExpiryDate(dailyFormData.category) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Freshness Level</label>
                        <select
                          name="freshness"
                          value={dailyFormData.freshness}
                          onChange={handleDailyInputChange}
                          className="p-2 border border-gray-300 rounded w-full"
                        >
                          {getFreshnessOptions(dailyFormData.category).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {getExpiryDateDescription(dailyFormData.category)}
                        </p>
                      </div>
                    )}

                    {/* Cost */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                      <input
                        type="number"
                        name="cost"
                        value={dailyFormData.cost}
                        onChange={handleDailyInputChange}
                        placeholder="Cost per unit"
                        className="p-2 border border-gray-300 rounded w-full"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* Max Threshold */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Threshold</label>
                      {dailyFormData.isNewItem ? (
                        <input
                          type="number"
                          name="maxThreshold"
                          value={dailyFormData.maxThreshold}
                          onChange={handleDailyInputChange}
                          placeholder="Maximum stock level"
                          className="p-2 border border-gray-300 rounded w-full"
                          min="0"
                        />
                      ) : (
                        <input
                          type="text"
                          value={dailyFormData.maxThreshold || 'N/A'}
                          className="p-2 border border-gray-300 rounded w-full bg-gray-100"
                          disabled
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    disabled={loadingDaily}
                  >
                    {loadingDaily ? 'Adding...' : 'Add Item'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDailyFormData({
                      inventoryItemId: '',
                      isNewItem: false,
                      name: '',
                      quantity: '',
                      unit: 'pcs',
                      category: 'other',
                      storageCondition: 'normal_temperature',
                      expiryDate: '',
                      cost: '',
                      supplier: '',
                      minThreshold: '',
                      maxThreshold: '',
                      notes: '',
                      image: null,
                      freshness: 'fresh'
                    })}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                    disabled={loadingDaily}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Today's Inventory Entries */}
          {loadingDaily ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : todayEntries.length === 0 ? (
            <p className="text-gray-500">No items added to today's inventory yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Item Name</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Quantity Added</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Remaining</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Unit</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Cost</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Expiry Date</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayEntries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b text-sm text-gray-800">{entry.inventoryItem?.name || 'N/A'}</td>
                      <td className="py-2 px-4 border-b text-sm text-gray-800">{entry.quantity}</td>
                      <td className="py-2 px-4 border-b text-sm text-gray-800">
                        <span className={entry.remainingQuantity === 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                          {entry.remainingQuantity}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b text-sm text-gray-800">{entry.inventoryItem?.unit || 'N/A'}</td>
                      <td className="py-2 px-4 border-b text-sm text-gray-800">{entry.cost ? `$${entry.cost.toFixed(2)}` : 'N/A'}</td>
                      <td className="py-2 px-4 border-b text-sm">
                        {entry.expiryDate ? (
                          <div>
                            <div className={getExpiryStatusClass(entry.expiryDate)}>
                              {new Date(entry.expiryDate).toLocaleDateString()}
                            </div>
                            {(() => {
                              const days = getDaysUntilExpiry(entry.expiryDate);
                              if (days !== null && days < 7) {
                                return <div className="text-xs text-orange-500">Expires in {days} days</div>;
                              }
                              return null;
                            })()}
                          </div>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                      </td>
                      <td className="py-2 px-4 border-b text-sm">
                        {entry.remainingQuantity === 0 ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Used</span>
                        ) : entry.expiryDate && new Date(entry.expiryDate) < new Date() ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Expired</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* General Inventory Section */}
      {!showDailyInventory && (
        <>
          {/* Display Expired Items */}
          {showExpiredItems && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-red-700">Expired Items ({expiredItems.length})</h2>
                <button
                  onClick={() => setShowExpiredItems(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
                >
                  Hide Expired Items
                </button>
              </div>
              {loadingExpired ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : expiredItems.length === 0 ? (
                <p className="text-gray-500 bg-green-50 p-4 rounded-lg border border-green-200">
                  No expired items found. All items are fresh!
                </p>
              ) : (
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full bg-white border border-red-200 rounded-lg shadow">
                    <thead className="bg-red-100">
                      <tr>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Name</th>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Current Stock</th>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Unit</th>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Category</th>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Expiry Date</th>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Days Expired</th>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiredItems.map((item) => {
                        const daysExpired = item.expiryDate ? Math.floor((new Date() - new Date(item.expiryDate)) / (1000 * 60 * 60 * 24)) : null;
                        return (
                          <tr key={item._id} className="hover:bg-red-50">
                            <td className="py-2 px-4 border-b text-sm text-gray-800 font-medium">{item.name}</td>
                            <td className="py-2 px-4 border-b text-sm text-gray-800">{item.currentStock}</td>
                            <td className="py-2 px-4 border-b text-sm text-gray-800">{item.unit}</td>
                            <td className="py-2 px-4 border-b text-sm text-gray-800 capitalize">{item.category}</td>
                            <td className="py-2 px-4 border-b text-sm">
                              {item.expiryDate ? (
                                <div className="text-red-600 font-medium">
                                  {new Date(item.expiryDate).toLocaleDateString()}
                                </div>
                              ) : (
                                <span className="text-gray-500">N/A</span>
                              )}
                            </td>
                            <td className="py-2 px-4 border-b text-sm">
                              {daysExpired !== null ? (
                                <span className="text-red-600 font-medium">{daysExpired} days ago</span>
                              ) : (
                                <span className="text-gray-500">N/A</span>
                              )}
                            </td>
                            <td className="py-2 px-4 border-b text-sm">
                              <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 font-medium">
                                Expired
                              </span>
                            </td>
                            <td className="py-2 px-4 border-b text-sm">
                              <button
                                onClick={() => startUpdate(item)}
                                className="text-blue-600 hover:underline mr-2"
                                disabled={loading}
                              >
                                Update
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item._id)}
                                className="text-red-600 hover:underline"
                                disabled={loading}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Display Available Items */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Available Items</h2>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : items.length === 0 ? (
              <p className="text-gray-500">No items available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    {/* Item Image */}
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-4xl">
                          <svg
                            className="w-24 h-24"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">{item.name}</h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span className="text-gray-800 font-medium capitalize">{item.category}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Unit:</span>
                          <span className="text-gray-800 font-medium">{item.unit}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Storage:</span>
                          <span className="text-gray-800 font-medium capitalize">
                            {item.storageCondition?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        
                        {item.minThreshold !== undefined && item.minThreshold !== null && item.minThreshold !== '' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Min Threshold:</span>
                            <span className="text-gray-800 font-medium">{item.minThreshold} {item.unit}</span>
                          </div>
                        )}
                        
                        {item.maxThreshold !== undefined && item.maxThreshold !== null && item.maxThreshold !== '' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Max Threshold:</span>
                            <span className="text-gray-800 font-medium">{item.maxThreshold} {item.unit}</span>
                          </div>
                        )}
                        
                        {item.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="text-gray-600 block mb-1">Notes:</span>
                            <p className="text-gray-800 text-xs line-clamp-3">{item.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => startUpdate(item)}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                          disabled={loading}
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                          disabled={loading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons for CRUD */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
                setShowUpdateForm(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={loading}
            >
              Add Item
            </button>
            <button
              onClick={() => toast.info('Select an item from the table to update')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={loading}
            >
              Update Item
            </button>
            <button
              onClick={() => toast.info('Click the Remove button next to any item in the table')}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              disabled={loading}
            >
              Remove Item
            </button>
            <button
              onClick={fetchExpiredItems}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 flex items-center space-x-2"
              disabled={loadingExpired}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{loadingExpired ? 'Loading...' : 'Fetch Expired Items'}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 flex items-center space-x-2"
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{loading ? 'Exporting...' : 'Export to CSV'}</span>
            </button>
          </div>

          {/* Add Item Form */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-semibold mb-4">Add New Item to General Inventory</h2>
              <form onSubmit={handleAddItem}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Item Name"
                      className="p-2 border border-gray-300 rounded w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded w-full"
                      required
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="ltr">ltr</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="lb">lb</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage *</label>
                    <select
                      name="storageCondition"
                      value={formData.storageCondition}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded w-full"
                      required
                    >
                      <option value="fridge">Fridge</option>
                      <option value="freezer">Freezer</option>
                      <option value="normal_temperature">Normal Temperature</option>
                      <option value="room_temperature">Room Temperature</option>
                      <option value="pantry">Pantry</option>
                      <option value="dry_storage">Dry Storage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded w-full"
                      required
                    >
                      <option value="vegetables">Vegetables</option>
                      <option value="fruits">Fruits</option>
                      <option value="dairy">Dairy</option>
                      <option value="meat">Meat</option>
                      <option value="seafood">Seafood</option>
                      <option value="grains">Grains</option>
                      <option value="spices">Spices</option>
                      <option value="beverages">Beverages</option>
                      <option value="frozen">Frozen</option>
                      <option value="canned">Canned</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Threshold</label>
                    <input
                      type="number"
                      name="minThreshold"
                      value={formData.minThreshold}
                      onChange={handleInputChange}
                      placeholder="Minimum stock level"
                      className="p-2 border border-gray-300 rounded w-full"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Threshold</label>
                    <input
                      type="number"
                      name="maxThreshold"
                      value={formData.maxThreshold}
                      onChange={handleInputChange}
                      placeholder="Maximum stock level"
                      className="p-2 border border-gray-300 rounded w-full"
                      min="0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Additional notes"
                      className="p-2 border border-gray-300 rounded w-full"
                      rows="3"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                    <input
                      type="file"
                      name="image"
                      onChange={handleInputChange}
                      accept="image/*"
                      className="p-2 border border-gray-300 rounded w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload an image for this item (optional)</p>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Item'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Update Item Form */}
          {showUpdateForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-semibold mb-4">Update Item: {editingItem?.name}</h2>
              <form onSubmit={handleUpdateItem}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Item Name"
                      className="p-2 border border-gray-300 rounded w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded w-full"
                      required
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="ltr">ltr</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="lb">lb</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage *</label>
                    <select
                      name="storageCondition"
                      value={formData.storageCondition}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded w-full"
                      required
                    >
                      <option value="fridge">Fridge</option>
                      <option value="freezer">Freezer</option>
                      <option value="normal_temperature">Normal Temperature</option>
                      <option value="room_temperature">Room Temperature</option>
                      <option value="pantry">Pantry</option>
                      <option value="dry_storage">Dry Storage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded w-full"
                      required
                    >
                      <option value="vegetables">Vegetables</option>
                      <option value="fruits">Fruits</option>
                      <option value="dairy">Dairy</option>
                      <option value="meat">Meat</option>
                      <option value="seafood">Seafood</option>
                      <option value="grains">Grains</option>
                      <option value="spices">Spices</option>
                      <option value="beverages">Beverages</option>
                      <option value="frozen">Frozen</option>
                      <option value="canned">Canned</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Threshold</label>
                    <input
                      type="number"
                      name="minThreshold"
                      value={formData.minThreshold}
                      onChange={handleInputChange}
                      placeholder="Minimum stock level"
                      className="p-2 border border-gray-300 rounded w-full"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Threshold</label>
                    <input
                      type="number"
                      name="maxThreshold"
                      value={formData.maxThreshold}
                      onChange={handleInputChange}
                      placeholder="Maximum stock level"
                      className="p-2 border border-gray-300 rounded w-full"
                      min="0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Additional notes"
                      className="p-2 border border-gray-300 rounded w-full"
                      rows="3"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                    {editingItem?.image && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600 mb-2">Current photo:</p>
                        <img 
                          src={editingItem.image} 
                          alt={editingItem.name}
                          className="w-32 h-32 object-cover rounded border border-gray-300"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      name="image"
                      onChange={handleInputChange}
                      accept="image/*"
                      className="p-2 border border-gray-300 rounded w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload a new image to replace the current one (optional)</p>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Item'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpdateForm(false);
                      setEditingItem(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InventoryManagement;
