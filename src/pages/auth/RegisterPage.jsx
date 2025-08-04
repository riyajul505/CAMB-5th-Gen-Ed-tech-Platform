import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Registration Page Component
 * Handles user registration for students, teachers, parents and children
 */
function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  
  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    profile: {
      firstName: '',
      lastName: '',
      grade: ''
    }
  });
  const [children, setChildren] = useState([]);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        profile: { ...prev.profile, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addChild = () => {
    setChildren(prev => [...prev, {
      email: '',
      firstName: '',
      lastName: '',
      grade: '',
      password: ''
    }]);
  };

  const removeChild = (index) => {
    setChildren(prev => prev.filter((_, i) => i !== index));
  };

  const updateChild = (index, field, value) => {
    setChildren(prev => prev.map((child, i) => 
      i === index ? { ...child, [field]: value } : child
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Clean up the data structure to match API expectations
    const userData = {
      email: formData.email,
      password: formData.password,
      role: userType,
    };

    // Add profile only if we have the required data
    if (formData.profile.firstName && formData.profile.lastName) {
      userData.profile = {
        firstName: formData.profile.firstName,
        lastName: formData.profile.lastName,
      };
      
      // Add grade only for students and if it's provided
      if (userType === 'student' && formData.profile.grade) {
        userData.profile.grade = parseInt(formData.profile.grade);
      }
    }

    // Add children for parents
    if (userType === 'parent' && children.length > 0) {
      userData.children = children.map(child => ({
        email: child.email,
        firstName: child.firstName,
        lastName: child.lastName,
        grade: parseInt(child.grade),
        password: child.password
      }));
    }

    console.log('Sending registration data:', userData);
    const result = await register(userData);
    console.log('Registration result:', result);
    
    if (result.success) {
      navigate('/login', { 
        state: { message: 'Registration successful! Please log in.' }
      });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">Join LearnHub today</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* User Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a:
            </label>
            <div className="flex space-x-4">
              {['student', 'teacher', 'parent'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    value={type}
                    checked={userType === type}
                    onChange={(e) => setUserType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <input
              name="email"
              type="email"
              required
              className="form-input w-full"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
            
            <input
              name="password"
              type="password"
              required
              className="form-input w-full"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                name="profile.firstName"
                type="text"
                required
                className="form-input"
                placeholder="First Name"
                value={formData.profile.firstName}
                onChange={handleChange}
              />
              
              <input
                name="profile.lastName"
                type="text"
                required
                className="form-input"
                placeholder="Last Name"
                value={formData.profile.lastName}
                onChange={handleChange}
              />
            </div>

            {userType === 'student' && (
              <input
                name="profile.grade"
                type="number"
                required
                className="form-input w-full"
                placeholder="Grade (1-12)"
                min="1"
                max="12"
                value={formData.profile.grade}
                onChange={handleChange}
              />
            )}
          </div>

          {/* Children Section for Parents */}
          {userType === 'parent' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Children</h3>
                <button
                  type="button"
                  onClick={addChild}
                  className="btn-primary text-sm px-3 py-1"
                >
                  Add Child
                </button>
              </div>
              
              {children.map((child, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Child {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeChild(index)}
                      className="text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="First Name"
                      value={child.firstName}
                      onChange={(e) => updateChild(index, 'firstName', e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="Last Name"
                      value={child.lastName}
                      onChange={(e) => updateChild(index, 'lastName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <input
                    type="email"
                    className="form-input text-sm w-full"
                    placeholder="Child's Email"
                    value={child.email}
                    onChange={(e) => updateChild(index, 'email', e.target.value)}
                    required
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      className="form-input text-sm"
                      placeholder="Grade"
                      min="1"
                      max="12"
                      value={child.grade}
                      onChange={(e) => updateChild(index, 'grade', e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      className="form-input text-sm"
                      placeholder="Password"
                      value={child.password}
                      onChange={(e) => updateChild(index, 'password', e.target.value)}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign in here
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage; 