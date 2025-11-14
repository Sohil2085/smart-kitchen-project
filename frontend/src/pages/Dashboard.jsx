import { useState, useEffect } from "react";
import { useAuth } from "../utils/useAuth";
import { toast } from "sonner";
import { DashboardAPI } from "../utils/api";
import { TrendingUp, Package, ShoppingCart, UtensilsCrossed, AlertTriangle, Users } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 mb-6 -mx-6 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor your kitchen operations in real-time</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-hover p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Orders</h3>
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {dashboardData?.totalOrders || 0}
              </p>
              <p className="text-sm text-gray-500">
                {dashboardData?.recentActivity?.sales || 0} this week
              </p>
            </div>
            <div className="card-hover p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Inventory Items</h3>
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {dashboardData?.inventoryItems || 0}
              </p>
              <p className="text-sm text-gray-500">
                {dashboardData?.inventory?.lowStock || 0} low stock
              </p>
            </div>
            <div className="card-hover p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Waste Reduction</h3>
                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {dashboardData?.wasteReduction || 0}%
              </p>
              <p className="text-sm text-gray-500">
                {dashboardData?.waste?.totalLogs || 0} waste logs
              </p>
            </div>
            <div className="card-hover p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Menu Items</h3>
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {dashboardData?.totalMenuItems || 0}
              </p>
              <p className="text-sm text-gray-500">
                Available recipes
              </p>
            </div>
          </div>

          {/* Inventory Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-6 border-l-4 border-yellow-500">
              <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">Low Stock</h3>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.inventory?.lowStock || 0}
              </p>
            </div>
            <div className="card p-6 border-l-4 border-red-500">
              <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">Expired</h3>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.inventory?.expired || 0}
              </p>
            </div>
            <div className="card p-6 border-l-4 border-red-500">
              <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">Out of Stock</h3>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.inventory?.outOfStock || 0}
              </p>
            </div>
            <div className="card p-6 border-l-4 border-indigo-500">
              <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">Total Users</h3>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.totalUsers || 0}
              </p>
            </div>
          </div>

          {/* Category Distribution */}
          {dashboardData?.inventory?.categoryStats && dashboardData.inventory.categoryStats.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Inventory by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {dashboardData.inventory.categoryStats.map((category, index) => (
                  <div key={index} className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-2xl font-bold text-blue-600 mb-1">{category.count}</p>
                    <p className="text-sm font-medium text-gray-700 capitalize">{category._id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Activity (Last 7 Days)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {dashboardData?.recentActivity?.inventoryUpdates || 0}
                </p>
                <p className="text-sm font-medium text-gray-700">Inventory Updates</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-3xl font-bold text-blue-600 mb-1">
                  {dashboardData?.recentActivity?.sales || 0}
                </p>
                <p className="text-sm font-medium text-gray-700">New Sales</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
                <p className="text-3xl font-bold text-orange-600 mb-1">
                  {dashboardData?.recentActivity?.wasteLogs || 0}
                </p>
                <p className="text-sm font-medium text-gray-700">Waste Logs</p>
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-4 text-blue-900">AI Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">💡 Smart Recommendations</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Based on your inventory patterns, consider restocking vegetables and dairy products this week.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">♻️ Waste Optimization</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your waste reduction efforts are showing <span className="font-bold text-green-600">{dashboardData?.wasteReduction || 0}%</span> improvement. Keep it up!
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
