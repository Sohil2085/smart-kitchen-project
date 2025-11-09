import { useState, useEffect } from "react";
import { useAuth } from "../utils/useAuth";
import { toast } from "sonner";
import { DashboardAPI } from "../utils/api";

function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalItems: 0,
    lowStockItems: 0,
    expiredItems: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(false);

  // Use role-based access control
  const isAdmin = user?.role === "admin";
  const isChef = user?.role === "chef";
  const canAccessDashboard = isAdmin || isChef;

  // Debug logging
  console.log("Dashboard Debug:", {
    user: user,
    role: user?.role,
    isAdmin,
    isChef,
    canAccessDashboard
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!user || !canAccessDashboard) return;
    
    setLoading(true);
    try {
      const response = await DashboardAPI.getStats();
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Don't show error toast, just log it and continue with default data
      console.log("Using default dashboard data");
      setDashboardData({
        totalItems: 0,
        lowStockItems: 0,
        expiredItems: 0,
        totalValue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard data when component mounts
  useEffect(() => {
    if (user && canAccessDashboard) {
      fetchDashboardData();
    }
  }, [user, canAccessDashboard]);

  // If user doesn't have access, show access denied
  if (!canAccessDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view the dashboard.</p>
          <p className="text-sm text-gray-500 mt-2">Only admins and chefs can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Welcome Section */}
      <div className="mb-8 text-center">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
          Welcome to AI Powered Smart Kitchen
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Monitor and manage your kitchen operations with real-time insights and AI-driven recommendations
        </p>
      </div>

      {/* Dashboard Controls */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>
      
      {loading && !dashboardData ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : !dashboardData ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-4">No dashboard data available</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Load Dashboard Data
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600">
                {dashboardData?.totalOrders || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {dashboardData?.recentActivity?.sales || 0} this week
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Inventory Items</h3>
              <p className="text-3xl font-bold text-green-600">
                {dashboardData?.inventoryItems || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {dashboardData?.inventory?.lowStock || 0} low stock
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Waste Reduction</h3>
              <p className="text-3xl font-bold text-orange-600">
                {dashboardData?.wasteReduction || 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {dashboardData?.waste?.totalLogs || 0} waste logs
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Menu Items</h3>
              <p className="text-3xl font-bold text-purple-600">
                {dashboardData?.totalMenuItems || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Available recipes
              </p>
            </div>
          </div>

          {/* Inventory Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Low Stock</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {dashboardData?.inventory?.lowStock || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Expired</h3>
              <p className="text-2xl font-bold text-red-600">
                {dashboardData?.inventory?.expired || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Out of Stock</h3>
              <p className="text-2xl font-bold text-red-600">
                {dashboardData?.inventory?.outOfStock || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Total Users</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {dashboardData?.totalUsers || 0}
              </p>
            </div>
          </div>

          {/* Category Distribution */}
          {dashboardData?.inventory?.categoryStats && dashboardData.inventory.categoryStats.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Inventory by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {dashboardData.inventory.categoryStats.map((category, index) => (
                  <div key={index} className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{category.count}</p>
                    <p className="text-sm text-gray-600 capitalize">{category._id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Recent Activity (Last 7 Days)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData?.recentActivity?.inventoryUpdates || 0}
                </p>
                <p className="text-sm text-gray-600">Inventory Updates</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData?.recentActivity?.sales || 0}
                </p>
                <p className="text-sm text-gray-600">New Sales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardData?.recentActivity?.wasteLogs || 0}
                </p>
                <p className="text-sm text-gray-600">Waste Logs</p>
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 text-blue-800">AI Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Smart Recommendations</h4>
                <p className="text-sm text-gray-600">
                  Based on your inventory patterns, consider restocking vegetables and dairy products this week.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Waste Optimization</h4>
                <p className="text-sm text-gray-600">
                  Your waste reduction efforts are showing {dashboardData?.wasteReduction || 0}% improvement. Keep it up!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
