import React, { useState } from 'react';
import { toast } from 'sonner';
import { InventoryAPI } from '../utils/api.js';
import CameraCapture from '../components/CameraCapture.jsx';

const SpoilageDetection = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [spoilageResult, setSpoilageResult] = useState(null);
  const [loadingSpoilage, setLoadingSpoilage] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState(null);

  const handleCameraCapture = async (imageFile) => {
    setShowCamera(false);
    setLoadingSpoilage(true);
    setSpoilageResult(null);

    try {
      const result = await InventoryAPI.detectSpoilage(imageFile, selectedItemType);
      
      if (result.data) {
        setSpoilageResult(result.data);
        toast.success('Spoilage detection completed!');
      } else {
        toast.error('Failed to detect spoilage');
      }
    } catch (error) {
      console.error('Spoilage detection error:', error);
      toast.error(error.message || 'Failed to detect spoilage');
    } finally {
      setLoadingSpoilage(false);
    }
  };

  const getSpoilageLevelColor = (level) => {
    switch (level) {
      case 'fresh':
        return 'text-green-600 bg-green-100';
      case 'slightly_spoiled':
        return 'text-yellow-600 bg-yellow-100';
      case 'moderately_spoiled':
        return 'text-orange-600 bg-orange-100';
      case 'spoiled':
        return 'text-red-600 bg-red-100';
      case 'highly_spoiled':
        return 'text-red-800 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSpoilageLevelLabel = (level) => {
    switch (level) {
      case 'fresh':
        return 'Fresh';
      case 'slightly_spoiled':
        return 'Slightly Spoiled';
      case 'moderately_spoiled':
        return 'Moderately Spoiled';
      case 'spoiled':
        return 'Spoiled';
      case 'highly_spoiled':
        return 'Highly Spoiled';
      default:
        return 'Unknown';
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Spoilage Detection</h1>

      {/* Spoilage Detection Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Detect Spoilage in Fruits and Vegetables</h2>
            <p className="text-sm text-gray-600">Use your camera to detect spoilage in fruits and vegetables</p>
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: Position the item in the center of the frame with good lighting for best results
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedItemType || ''}
              onChange={(e) => setSelectedItemType(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Auto-detect</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
            </select>
            <button
              onClick={() => setShowCamera(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              disabled={loadingSpoilage}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {loadingSpoilage ? 'Detecting...' : 'Detect Spoilage'}
            </button>
          </div>
        </div>

        {/* Spoilage Result Display */}
        {loadingSpoilage && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Analyzing image...</span>
          </div>
        )}

        {spoilageResult && !loadingSpoilage && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Detection Results</h3>
                <p className="text-sm text-gray-600">
                  Detected Item: <span className="font-medium capitalize text-blue-600">{spoilageResult.detected_item_name || spoilageResult.item_name || 'Unknown'}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Category: <span className="capitalize">{spoilageResult.detected_item_type || spoilageResult.item_type || 'Unknown'}</span>
                  {spoilageResult.detection_confidence && (
                    <span className="ml-2">({spoilageResult.detection_confidence}% confidence)</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSpoilageResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Spoilage Level</div>
                <div className={`px-3 py-2 rounded font-semibold ${getSpoilageLevelColor(spoilageResult.spoilage_level)}`}>
                  {getSpoilageLevelLabel(spoilageResult.spoilage_level)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Score: {spoilageResult.spoilage_score}/100
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Days Remaining</div>
                <div className={`text-2xl font-bold ${spoilageResult.days_remaining > 2 ? 'text-green-600' : spoilageResult.days_remaining > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {spoilageResult.days_remaining}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {spoilageResult.days_remaining === 0 
                    ? 'Use immediately or discard' 
                    : spoilageResult.days_remaining === 1
                    ? 'Use today'
                    : `Use within ${spoilageResult.days_remaining} days`}
                </div>
              </div>
            </div>

            {spoilageResult.has_spoilage && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <div className="font-semibold text-yellow-800">Spoilage Detected</div>
                    <div className="text-sm text-yellow-700 mt-1">
                      This item shows signs of spoilage. It is recommended to use it within {spoilageResult.days_remaining} day(s) or discard if highly spoiled.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!spoilageResult.has_spoilage && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-semibold text-green-800">Item is Fresh</div>
                    <div className="text-sm text-green-700 mt-1">
                      No significant spoilage detected. Item can be used within {spoilageResult.days_remaining} days.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show alternative predictions if available */}
            {spoilageResult.all_predictions && spoilageResult.all_predictions.length > 1 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-semibold text-blue-800 mb-2">Other Possible Items:</div>
                <div className="space-y-1">
                  {spoilageResult.all_predictions.slice(1, 4).map((pred, idx) => (
                    <div key={idx} className="text-xs text-blue-700 flex justify-between">
                      <span className="capitalize">{pred.item_name}</span>
                      <span>{pred.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          itemType={selectedItemType}
        />
      )}
    </div>
  );
};

export default SpoilageDetection;



