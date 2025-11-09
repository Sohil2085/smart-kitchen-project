import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { InventoryAPI } from '../utils/api.js';
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'pcs',
    expiryDate: '',
    storageCondition: 'normal_temperature',
    category: 'other',
    supplier: '',
    cost: '',
    minThreshold: '',
    maxThreshold: '',
    notes: '',
    image: null,
    freshness: 'fresh'
  });
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
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

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => {
        const newData = { ...prev, [name]: value };
        
        // Handle category change - reset freshness and expiry date
        if (name === 'category') {
          newData.freshness = 'fresh';
          newData.expiryDate = '';
        }
        
        // Handle freshness change - calculate expiry date if not manual entry
        if (name === 'freshness' && !requiresManualExpiryDate(newData.category)) {
          newData.expiryDate = calculateExpiryDate(newData.category, value);
        }
        
        return newData;
      });
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await InventoryAPI.addItem(formData);
      toast.success('Item added successfully');
      setShowAddForm(false);
      resetForm();
      fetchItems();
    } catch (error) {
      toast.error('Failed to add item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      setLoading(true);
      await InventoryAPI.updateItem(editingItem._id, formData);
      toast.success('Item updated successfully');
      setShowUpdateForm(false);
      resetForm();
      setEditingItem(null);
      fetchItems();
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
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      storageCondition: item.storageCondition,
      category: item.category,
      supplier: item.supplier || '',
      cost: item.cost || '',
      minThreshold: item.minThreshold || '',
      maxThreshold: item.maxThreshold || '',
      notes: item.notes || '',
      image: null,
      freshness: 'fresh' // Default freshness for updates
    });
    setEditingItem(item);
    setShowUpdateForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: '',
      unit: 'pcs',
      expiryDate: '',
      storageCondition: 'normal_temperature',
      category: 'other',
      supplier: '',
      cost: '',
      minThreshold: '',
      maxThreshold: '',
      notes: '',
      image: null,
      freshness: 'fresh'
    });
  };


  const getDefaultStorageCondition = (category) => {
    const storageMap = {
      'fruits': 'fridge',
      'vegetables': 'fridge',
      'dairy': 'fridge',
      'meat': 'freezer',
      'seafood': 'freezer',
      'grains': 'pantry',
      'spices': 'pantry',
      'beverages': 'room_temperature',
      'frozen': 'freezer',
      'canned': 'pantry',
      'other': 'normal_temperature'
    };
    return storageMap[category] || 'normal_temperature';
  };


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Inventory Management</h1>

      {/* Display Available Items */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-gray-700">Available Items</h2>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : items.length === 0 ? (
          <p className="text-gray-500">No items available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
              <thead className="bg-blue-100">
                <tr>
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Current Stock</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Unit</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Category</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Storage</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Expiry Date</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Added By</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-sm text-gray-800">{item.name}</td>
                    <td className="py-2 px-4 border-b text-sm text-gray-800">{item.currentStock}</td>
                    <td className="py-2 px-4 border-b text-sm text-gray-800">{item.unit}</td>
                    <td className="py-2 px-4 border-b text-sm text-gray-800 capitalize">{item.category}</td>
                    <td className="py-2 px-4 border-b text-sm text-gray-800 capitalize">{item.storageCondition?.replace('_', ' ')}</td>
                    <td className="py-2 px-4 border-b text-sm">
                      {item.expiryDate ? (
                        <div>
                          <div className={getExpiryStatusClass(item.expiryDate)}>
                            {new Date(item.expiryDate).toLocaleDateString()}
                          </div>
                          {(() => {
                            const days = getDaysUntilExpiry(item.expiryDate);
                            if (days !== null) {
                              if (days < 0) {
                                return <div className="text-xs text-red-500">Expired {Math.abs(days)} days ago</div>;
                              } else if (days === 0) {
                                return <div className="text-xs text-red-500">Expires today</div>;
                              } else if (days <= 3) {
                                return <div className="text-xs text-orange-500">Expires in {days} days</div>;
                              } else if (days <= 7) {
                                return <div className="text-xs text-yellow-600">Expires in {days} days</div>;
                              } else {
                                return <div className="text-xs text-green-600">{days} days left</div>;
                              }
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'active' ? 'bg-green-100 text-green-800' :
                        item.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                        item.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-800">{item.addedBy?.fullname || 'Unknown'}</td>
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
                ))}
              </tbody>
            </table>
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
          <h2 className="text-lg font-semibold mb-4">Add New Item</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="Quantity"
                  className="p-2 border border-gray-300 rounded w-full"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Storage Condition *</label>
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
              
              {/* Freshness Selection - only show for categories that support it */}
              {!requiresManualExpiryDate(formData.category) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Freshness Level</label>
                  <select
                    name="freshness"
                    value={formData.freshness}
                    onChange={handleInputChange}
                    className="p-2 border border-gray-300 rounded w-full"
                  >
                    {getFreshnessOptions(formData.category).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {getExpiryDateDescription(formData.category)}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date {requiresManualExpiryDate(formData.category) ? '*' : ''}
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-300 rounded w-full"
                  required={requiresManualExpiryDate(formData.category)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {getExpiryDateDescription(formData.category)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  placeholder="Supplier Name"
                  className="p-2 border border-gray-300 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  placeholder="Cost per unit"
                  className="p-2 border border-gray-300 rounded w-full"
                  min="0"
                  step="0.01"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  type="file"
                  name="image"
                  onChange={handleInputChange}
                  accept="image/*"
                  className="p-2 border border-gray-300 rounded w-full"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="Quantity"
                  className="p-2 border border-gray-300 rounded w-full"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Storage Condition *</label>
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
              
              {/* Freshness Selection - only show for categories that support it */}
              {!requiresManualExpiryDate(formData.category) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Freshness Level</label>
                  <select
                    name="freshness"
                    value={formData.freshness}
                    onChange={handleInputChange}
                    className="p-2 border border-gray-300 rounded w-full"
                  >
                    {getFreshnessOptions(formData.category).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {getExpiryDateDescription(formData.category)}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date {requiresManualExpiryDate(formData.category) ? '*' : ''}
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-300 rounded w-full"
                  required={requiresManualExpiryDate(formData.category)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {getExpiryDateDescription(formData.category)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  placeholder="Supplier Name"
                  className="p-2 border border-gray-300 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  placeholder="Cost per unit"
                  className="p-2 border border-gray-300 rounded w-full"
                  min="0"
                  step="0.01"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  type="file"
                  name="image"
                  onChange={handleInputChange}
                  accept="image/*"
                  className="p-2 border border-gray-300 rounded w-full"
                />
                {editingItem?.image && (
                  <p className="text-sm text-gray-500 mt-1">Current image: {editingItem.image}</p>
                )}
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


    </div>
  );
};

export default InventoryManagement;