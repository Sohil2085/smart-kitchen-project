import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { WasteAPI } from '../utils/api.js';

function WastePrediction() {
  const [wastePredictions, setWastePredictions] = useState([]);
  const [expiredItems, setExpiredItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('predictions'); // 'predictions' or 'expired'
  const [filterPeriod, setFilterPeriod] = useState('30d');

  useEffect(() => {
    fetchData();
  }, [filterPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch waste predictions
      const predictionsResponse = await WasteAPI.getAllWastePredictions({ 
        limit: 100,
        page: 1 
      });
      setWastePredictions(predictionsResponse.data?.docs || []);

      // Fetch expired items
      const expiredResponse = await WasteAPI.getExpiredItems({ 
        period: filterPeriod 
      });
      setExpiredItems(expiredResponse.data?.expiredItems || []);

      // Fetch statistics
      const statsResponse = await WasteAPI.getWastePredictionStats({ 
        period: filterPeriod 
      });
      setStats(statsResponse.data);

    } catch (error) {
      toast.error('Failed to fetch data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessExpiredItems = async () => {
    if (!window.confirm('Are you sure you want to process all expired items? This will clear them from inventory and add them to waste predictions.')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await WasteAPI.processExpiredItems();
      toast.success(`Successfully processed ${response.data?.processedCount || 0} expired items. Total waste cost: $${(response.data?.totalWasteCost || 0).toFixed(2)}`);
      fetchData(); // Refresh data
    } catch (error) {
      toast.error('Failed to process expired items: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Waste Prediction & Management</h1>
        <p className="text-gray-600">Monitor expired items and waste predictions</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Predictions</h3>
            <p className="text-2xl font-bold text-gray-800">{stats.totalPredictions || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Predicted Waste Quantity</h3>
            <p className="text-2xl font-bold text-gray-800">{stats.totalPredictedQuantity?.toFixed(2) || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Confidence</h3>
            <p className="text-2xl font-bold text-gray-800">{((stats.avgConfidence || 0) * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Expired Items</h3>
            <p className="text-2xl font-bold text-gray-800">{expiredItems.length || 0}</p>
          </div>
        </div>
      )}

      {/* Filter and Actions */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        
        <button
          onClick={handleProcessExpiredItems}
          disabled={processing || loading}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Process Expired Items
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('predictions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'predictions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Waste Predictions ({wastePredictions.length})
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expired'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Expired Items ({expiredItems.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Waste Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {wastePredictions.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No waste predictions</h3>
                  <p className="mt-1 text-sm text-gray-500">No waste predictions have been recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Predicted Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prediction Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Confidence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prediction Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {wastePredictions.map((prediction) => (
                        <tr key={prediction._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {prediction.ingredient?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                              {prediction.ingredient?.category || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {prediction.predictedWasteQuantity} {prediction.ingredient?.unit || ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              prediction.predictionModel === 'Expired' 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {prediction.predictionModel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {((prediction.confidenceScore || 0) * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(prediction.predictionDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {prediction.ingredient?.expiryDate ? (
                              <span className={new Date(prediction.ingredient.expiryDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                                {formatDate(prediction.ingredient.expiryDate)}
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="max-w-xs truncate" title={prediction.additionalNotes}>
                              {prediction.additionalNotes || 'N/A'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Expired Items Tab */}
          {activeTab === 'expired' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {expiredItems.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No expired items</h3>
                  <p className="mt-1 text-sm text-gray-500">All items are fresh! No expired items found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Logged Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expiredItems.map((item) => {
                        const cost = item.ingredient?.cost ? item.quantity * item.ingredient.cost : 0;
                        return (
                          <tr key={item._id} className="hover:bg-red-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {item.ingredient?.name || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 capitalize">
                                {item.ingredient?.category || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.unit || item.ingredient?.unit || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {item.ingredient?.expiryDate ? formatDate(item.ingredient.expiryDate) : formatDate(item.loggedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(item.loggedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(cost)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="max-w-xs truncate" title={item.notes}>
                                {item.notes || 'N/A'}
                              </div>
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
        </>
      )}

      {/* Predictions by Model Chart */}
      {stats && stats.predictionsByModel && stats.predictionsByModel.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Predictions by Model</h2>
          <div className="space-y-3">
            {stats.predictionsByModel.map((model, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">{model._id}</span>
                  <span className="text-xs text-gray-500">({model.count} predictions)</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{model.totalQuantity.toFixed(2)} units</span>
                  <span className="text-xs text-gray-500">
                    Avg Confidence: {((model.avgConfidence || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WastePrediction;
