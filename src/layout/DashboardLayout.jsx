import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import TeacherChatPage from '../pages/teacher/TeacherChatPage';

/**
 * Dashboard Layout Component
 * Provides consistent layout for all dashboard pages with sidebar and header
 */
function DashboardLayout({ children, userRole }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Security check: Ensure userRole prop matches authenticated user's actual role
  useEffect(() => {
    if (user && userRole && user.role !== userRole) {
      console.error(`Security violation: userRole prop (${userRole}) does not match authenticated user role (${user.role})`);
      // Redirect to appropriate dashboard based on actual user role
      const correctPath = user.role === 'student' ? '/dashboard' :
                         user.role === 'parent' ? '/parent-dashboard' :
                         user.role === 'teacher' ? '/teacher-dashboard' : '/';
      navigate(correctPath, { replace: true });
    }
  }, [user, userRole, navigate]);

  // Load notifications and unread count
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      console.log('🔔 DashboardLayout: Loading notifications for user:', user.id);
      const response = await notificationAPI.getNotifications(user.id);
      console.log('🔔 DashboardLayout: Notifications response:', response);
      
      // Handle different response structures
      let notificationsData = [];
      if (response?.data?.notifications) {
        notificationsData = response.data.notifications;
      } else if (Array.isArray(response?.data)) {
        notificationsData = response.data;
      } else if (Array.isArray(response)) {
        notificationsData = response;
      }
      
      // Ensure each notification has required fields
      const processedNotifications = notificationsData.map(notif => ({
        id: notif.id || notif._id || `temp-${Date.now()}`,
        type: notif.type || 'info',
        message: notif.message || 'Notification',
        data: notif.data || {},
        link: notif.link || null,
        read: notif.read || false,
        createdAt: notif.createdAt || new Date().toISOString()
      }));
      
      console.log('🔔 DashboardLayout: Processed notifications:', processedNotifications);
      setNotifications(processedNotifications);
    } catch (error) {
      console.error('❌ DashboardLayout: Error loading notifications:', error);
      setNotifications([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      console.log('📊 DashboardLayout: Loading unread count for user:', user.id);
      const response = await notificationAPI.getUnreadCount(user.id);
      console.log('📊 DashboardLayout: Unread count response:', response);
      // Handle different response structures
      const unreadCount = response?.data?.unreadCount ?? response?.unreadCount ?? 0;
      console.log('📊 DashboardLayout: Setting unread count to:', unreadCount);
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('❌ DashboardLayout: Error loading unread count:', error);
      setUnreadCount(0); // Set to 0 on error
    }
  };

  // Test function to refresh notifications
  const refreshNotifications = () => {
    console.log('🔄 DashboardLayout: Manually refreshing notifications...');
    loadNotifications();
    loadUnreadCount();
  };

  // Test function to create a sample notification (for debugging)
  const createTestNotification = async () => {
    try {
      console.log('🧪 DashboardLayout: Creating test notification...');
      // This would typically be called from the backend when certain events occur
      // For now, we'll just add a local test notification
      const testNotification = {
        id: `test-${Date.now()}`,
        type: 'test',
        message: 'This is a test notification - ' + new Date().toLocaleTimeString(),
        data: {},
        link: null,
        read: false,
        createdAt: new Date().toISOString()
      };
      
      setNotifications(prev => [testNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      console.log('🧪 DashboardLayout: Test notification created');
    } catch (error) {
      console.error('❌ DashboardLayout: Error creating test notification:', error);
    }
  };

  // Test function to verify API endpoints
  const testNotificationAPI = async () => {
    try {
      console.log('🧪 DashboardLayout: Testing notification API endpoints...');
      
      // Test 1: Get notifications
      console.log('🧪 Test 1: Getting notifications...');
      const notificationsResponse = await notificationAPI.getNotifications(user.id);
      console.log('🧪 Notifications test result:', notificationsResponse);
      
      // Test 2: Get unread count
      console.log('🧪 Test 2: Getting unread count...');
      const unreadResponse = await notificationAPI.getUnreadCount(user.id);
      console.log('🧪 Unread count test result:', unreadResponse);
      
      alert('API tests completed! Check console for details.');
    } catch (error) {
      console.error('❌ DashboardLayout: API test failed:', error);
      alert('API test failed! Check console for details.');
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
      loadUnreadCount(); // Refresh unread count
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const toggleNotifications = () => {
    setNotificationOpen(!notificationOpen);
    setUserMenuOpen(false); // Close user menu if open
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Only navigate if there's a valid dashboard link (not home page or invalid links)
    if (notification.link && 
        notification.link !== '#' && 
        notification.link !== '/' && 
        notification.link !== location.pathname &&
        (notification.link.includes('/dashboard') || notification.link.includes('/resources') || notification.link.includes('/my-classes'))) {
      navigate(notification.link);
    }
    
    setNotificationOpen(false);
  };

  const getNavigationItems = () => {
    switch (userRole) {
      case 'student':
        return [
          { name: 'Dashboard', icon: '📊', path: '/dashboard' },
          { name: 'Take Quiz', icon: '📝', path: '/take-quiz' },
          { name: 'Join Lab', icon: '🧪', path: '/join-lab' },
          { name: 'Interactive Simulation', icon: '🔬', path: '/simulation' },
          { name: 'Ask Q&A', icon: '❓', path: '/qna' },
          { name: 'Submit Project', icon: '📋', path: '/submit-project' },
          { name: 'Resources', icon: '📚', path: '/resources' },
        ];
      case 'parent':
        return [
          { name: 'Dashboard', icon: '📊', path: '/parent-dashboard' },
          { name: 'Children Progress', icon: '👥', path: '/children-progress' },
          { name: 'Performance Reports', icon: '📈', path: '/performance-reports' },
          { name: 'Teacher Communication', icon: '💬', path: '/teacher-chat' },
          { name: 'Resources', icon: '📚', path: '/parent-resources' },
        ];
      case 'teacher':
        return [
          { name: 'Dashboard', icon: '📊', path: '/teacher-dashboard' },
          { name: 'My Classes', icon: '🏫', path: '/my-classes' },
          { name: 'Student Progress', icon: '📈', path: '/student-progress' },
          { name: 'Create Assignment', icon: '📝', path: '/create-assignment' },
          // add teacher chat
          { name: 'Teacher Chat', icon: '💬', path: '/teacher-chat' },
          { name: 'Grade Projects', icon: '✅', path: '/grade-projects' },
          { name: 'Schedule Lab', icon: '🗓️', path: '/schedule-lab' },
          { name: 'Resources', icon: '📚', path: '/teacher-resources' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
      if (notificationOpen && !event.target.closest('.notification-container')) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, notificationOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery);
  };

  // Early return if user role mismatch (for security)
  if (user && userRole && user.role !== userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to authorized area...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-soft border-r border-gray-200">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">CAMB</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left sidebar-item ${
                isActive(item.path) ? 'sidebar-item-active' : ''
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          ))}
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full text-left sidebar-item mt-8"
          >
            <span className="mr-3 text-lg">🚪</span>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Dashboard Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Search..."
                  />
                </div>
              </form>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative notification-container">
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a50.002 50.002 0 00-1.5-1.5m0 0V9a6 6 0 10-12 0v2.5l-3.5 3.5H9m6 0a3 3 0 11-6 0m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No notifications</div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notification.read ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                  !notification.read ? 'bg-blue-500' : 'bg-transparent'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200">
                        <button
                          onClick={() => setNotificationOpen(false)}
                          className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View All Notifications
                        </button>
                      </div>
                    )}
                    
                    {/* Debug button for testing */}
                    <div className="p-3 border-t border-gray-200">
                      <button
                        onClick={refreshNotifications}
                        className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium"
                      >
                        🔄 Refresh Notifications (Debug)
                      </button>
                    </div>
                    
                    {/* Test notification button */}
                    <div className="p-3 border-t border-gray-200">
                      <button
                        onClick={createTestNotification}
                        className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium"
                      >
                        🧪 Create Test Notification (Debug)
                      </button>
                    </div>
                    
                    {/* API test button */}
                    <div className="p-3 border-t border-gray-200">
                      <button
                        onClick={testNotificationAPI}
                        className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium"
                      >
                        🔍 Test API Endpoints (Debug)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative user-menu-container">
                <button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotificationOpen(false); // Close notifications if open
                  }}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.profile?.firstName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  
                  {/* Name and Dropdown */}
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.profile?.firstName || 'User'}
                    </span>
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* User Menu Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-2">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout; 