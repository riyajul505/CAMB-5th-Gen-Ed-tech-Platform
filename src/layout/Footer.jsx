import { useLocation } from 'react-router-dom';

/**
 * Footer component
 * Provides footer information and links for the e-learning platform
 */
function Footer() {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  // Don't show footer on dashboard pages (they have their own layout)
  const isDashboardPage = location.pathname.includes('dashboard');
  if (isDashboardPage) {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="ml-2 text-xl font-bold">LearnHub</span>
            </div>
            <p className="text-gray-400 mb-4">
              Interactive e-learning platform delivering Cambridge curriculum content 
              through hands-on simulations and adaptive learning.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Platform
            </h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">Courses</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Simulations</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Assessments</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Resources</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Privacy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <p className="text-gray-400 text-sm">
            © {currentYear} LearnHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 