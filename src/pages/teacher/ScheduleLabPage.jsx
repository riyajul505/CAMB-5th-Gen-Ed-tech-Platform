import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { labBookingAPI } from '../../services/labBookingAPI';


const ScheduleLabPage = () => {
  const { user } = useAuth();
  const [mySlots, setMySlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [selectedSlotBookings, setSelectedSlotBookings] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    level: 1,
    date: '',
    startTime: '',
    endTime: '',
    topic: '',
    description: '',
    location: 'Lab Room 101',
    maxStudents: 8
  });

  // Load teacher's lab slots
  useEffect(() => {
    const loadTeacherSlots = async () => {
      try {
        setFetching(true);
        console.log('📥 Loading teacher lab slots for:', user.id);
        
        // TODO: Replace with real API call
        const response = await labBookingAPI.getTeacherSlots(user.id);
        
        // Mock data for testing
        // const mockResponse = {
        //   success: true,
        //   data: {
        //     slots: [
        //       {
        //         id: 'slot_1',
        //         teacherId: user.id,
        //         teacherName: user.name,
        //         level: 2,
        //         date: '2024-12-20',
        //         startTime: '10:00',
        //         endTime: '11:00',
        //         duration: 60,
        //         maxStudents: 8,
        //         currentBookings: 3,
        //         topic: 'Chemistry Lab - Acid Base Reactions',
        //         description: 'Learn about pH levels and acid-base indicators through hands-on experiments.',
        //         location: 'Lab Room 101',
        //         isActive: true,
        //         createdAt: '2024-12-10T10:30:00Z',
        //         bookings: [
        //           {
        //             id: 'booking_1',
        //             studentId: 'student_001',
        //             studentName: 'Alice Johnson',
        //             bookingNotes: 'Excited to learn about pH levels!',
        //             status: 'confirmed',
        //             createdAt: '2024-12-15T10:30:00Z'
        //           },
        //           {
        //             id: 'booking_2',
        //             studentId: 'student_002',
        //             studentName: 'Bob Wilson',
        //             bookingNotes: 'I have some questions about indicators.',
        //             status: 'confirmed',
        //             createdAt: '2024-12-15T11:00:00Z'
        //           },
        //           {
        //             id: 'booking_3',
        //             studentId: 'student_003',
        //             studentName: 'Carol Davis',
        //             bookingNotes: '',
        //             status: 'confirmed',
        //             createdAt: '2024-12-15T14:20:00Z'
        //           }
        //         ]
        //       },
        //       {
        //         id: 'slot_2',
        //         teacherId: user.id,
        //         teacherName: user.name,
        //         level: 3,
        //         date: '2024-12-21',
        //         startTime: '14:00',
        //         endTime: '15:30',
        //         duration: 90,
        //         maxStudents: 6,
        //         currentBookings: 2,
        //         topic: 'Physics Lab - Simple Machines',
        //         description: 'Explore levers, pulleys, and inclined planes with interactive experiments.',
        //         location: 'Lab Room 102',
        //         isActive: true,
        //         createdAt: '2024-12-11T09:15:00Z',
        //         bookings: [
        //           {
        //             id: 'booking_4',
        //             studentId: 'student_004',
        //             studentName: 'David Brown',
        //             bookingNotes: 'Looking forward to the experiments!',
        //             status: 'confirmed',
        //             createdAt: '2024-12-16T08:45:00Z'
        //           },
        //           {
        //             id: 'booking_5',
        //             studentId: 'student_005',
        //             studentName: 'Eva Garcia',
        //             bookingNotes: '',
        //             status: 'confirmed',
        //             createdAt: '2024-12-16T10:15:00Z'
        //           }
        //         ]
        //       },
        //       {
        //         id: 'slot_3',
        //         teacherId: user.id,
        //         teacherName: user.name,
        //         level: 2,
        //         date: '2024-12-22',
        //         startTime: '09:00',
        //         endTime: '10:00',
        //         duration: 60,
        //         maxStudents: 8,
        //         currentBookings: 0,
        //         topic: 'Biology Lab - Cell Structure',
        //         description: 'Observe plant and animal cells under microscopes.',
        //         location: 'Lab Room 101',
        //         isActive: false,
        //         createdAt: '2024-12-12T16:20:00Z',
        //         bookings: []
        //       }
        //     ]
        //   }
        // };

        setMySlots(response.data.data.slots);
        
        // console.log('✅ Teacher slots loaded:', mockResponse.data.slots);
      } catch (error) {
        console.error('❌ Error loading teacher slots:', error);
        alert('Failed to load lab slots. Please try again.');
      } finally {
        setFetching(false);
      }
    };

    loadTeacherSlots();
  }, [user.id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleCreateSlot = async () => {
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.topic.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const slotData = {
        teacherId: user.id,
        level: formData.level,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        topic: formData.topic.trim(),
        description: formData.description.trim(),
        location: formData.location,
        maxStudents: formData.maxStudents
      };

      console.log('📤 Creating lab slot:', slotData);

      // TODO: Replace with real API call
      const response = await labBookingAPI.createSlot(slotData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add slot to state
      const newSlot = {
        id: Date.now().toString(),
        teacherId: user.id,
        teacherName: user.name,
        level: formData.level,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: calculateDuration(formData.startTime, formData.endTime),
        maxStudents: formData.maxStudents,
        currentBookings: 0,
        topic: formData.topic.trim(),
        description: formData.description.trim(),
        location: formData.location,
        isActive: true,
        createdAt: new Date().toISOString(),
        bookings: []
      };

      setMySlots(prev => [...prev, newSlot]);
      
      // Reset form
      setFormData({
        level: 1,
        date: '',
        startTime: '',
        endTime: '',
        topic: '',
        description: '',
        location: 'Lab Room 101',
        maxStudents: 8
      });
      
      setShowCreateForm(false);
      alert('Lab session created successfully!');
    } catch (error) {
      console.error('Error creating lab slot:', error);
      alert('Failed to create lab session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSlot = async () => {
    if (!selectedSlot || !formData.topic.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        slotId: selectedSlot.id,
        level: formData.level,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        topic: formData.topic.trim(),
        description: formData.description.trim(),
        location: formData.location,
        maxStudents: formData.maxStudents
      };

      console.log('📝 Updating lab slot:', updateData);

      // TODO: Replace with real API call
      await labBookingAPI.updateSlot(updateData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Update slot in state
      setMySlots(prev => prev.map(slot => 
        slot.id === selectedSlot.id 
          ? {
              ...slot,
              level: formData.level,
              date: formData.date,
              startTime: formData.startTime,
              endTime: formData.endTime,
              duration: calculateDuration(formData.startTime, formData.endTime),
              topic: formData.topic.trim(),
              description: formData.description.trim(),
              location: formData.location,
              maxStudents: formData.maxStudents
            }
          : slot
      ));

      setShowEditForm(false);
      setSelectedSlot(null);
      alert('Lab session updated successfully!');
    } catch (error) {
      console.error('Error updating lab slot:', error);
      alert('Failed to update lab session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm('Are you sure you want to delete this lab session? This action cannot be undone.')) return;

    try {
      console.log('🗑️ Deleting lab slot:', slotId);

      // TODO: Replace with real API call
      await labBookingAPI.deleteSlot(slotId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Remove slot from state
      setMySlots(prev => prev.filter(slot => slot.id !== slotId));
      
      alert('Lab session deleted successfully!');
    } catch (error) {
      console.error('Error deleting lab slot:', error);
      alert('Failed to delete lab session. Please try again.');
    }
  };

  const handleToggleSlotStatus = async (slotId, currentStatus) => {
    try {
      console.log('🔄 Toggling slot status:', slotId, currentStatus);

      // TODO: Replace with real API call
      // await labBookingAPI.toggleSlotStatus(slotId, !currentStatus);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update slot status in state
      setMySlots(prev => prev.map(slot => 
        slot.id === slotId 
          ? { ...slot, isActive: !currentStatus }
          : slot
      ));
      
      alert(`Lab session ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling slot status:', error);
      alert('Failed to update lab session status. Please try again.');
    }
  };

  const handleViewBookings = async (slot) => {
    

    const response = await labBookingAPI.getSlotBookings(slot.id);
    console.log(response.data.data.bookings);
    setSelectedSlot(slot);
    setSelectedSlotBookings(response.data.data.bookings);
    setShowBookings(true);

  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return Math.round((end - start) / (1000 * 60));
  };

  const handleEditClick = (slot) => {
    setSelectedSlot(slot);
    setFormData({
      level: slot.level,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      topic: slot.topic,
      description: slot.description,
      location: slot.location,
      maxStudents: slot.maxStudents
    });
    setShowEditForm(true);
  };

  if (fetching) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Schedule Lab Sessions</h1>
              <p className="text-sm text-gray-600">Create and manage interactive lab sessions</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lab sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Schedule Lab Sessions</h1>
            <p className="text-sm text-gray-600">Create and manage interactive lab sessions</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + Create New Session
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {mySlots.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🧪</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lab Sessions Yet</h3>
            <p className="text-gray-600 mb-6">Create your first lab session to start teaching students.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Session
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mySlots.map((slot) => (
              <div key={slot.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${slot.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className="text-sm font-medium text-gray-700">
                      {slot.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleSlotStatus(slot.id, slot.isActive)}
                      className={`px-2 py-1 rounded text-xs ${
                        slot.isActive 
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {slot.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">{slot.topic}</h3>
                <p className="text-sm text-gray-600 mb-4">{slot.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="w-4 h-4 mr-2">📅</span>
                    {formatDate(slot.date)}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="w-4 h-4 mr-2">🕐</span>
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)} ({slot.duration} min)
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="w-4 h-4 mr-2">📍</span>
                    {slot.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="w-4 h-4 mr-2">👥</span>
                    {slot.currentBookings}/{slot.maxStudents} students booked
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="w-4 h-4 mr-2">📚</span>
                    Level {slot.level}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewBookings(slot)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                  >
                    View Bookings ({slot.currentBookings})
                  </button>
                  <button
                    onClick={() => handleEditClick(slot)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Slot Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Lab Session</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  placeholder="e.g., Chemistry Lab - Acid Base Reactions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the lab session..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Lab Room 101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                <input
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({...formData, maxStudents: parseInt(e.target.value)})}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSlot}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {showEditForm && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Lab Session</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                <input
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({...formData, maxStudents: parseInt(e.target.value)})}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedSlot(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSlot}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Modal */}
      {showBookings && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Session Bookings</h3>
              <button
                onClick={() => {
                  setShowBookings(false);
                  setSelectedSlot(null);
                  setSelectedSlotBookings([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900">{selectedSlot.topic}</h4>
              <p className="text-sm text-gray-600">
                {formatDate(selectedSlot.date)} • {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
              </p>
            </div>

            {selectedSlotBookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">👥</span>
                </div>
                <p className="text-gray-600">No students have booked this session yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedSlotBookings.map((booking) => (
                  <div key={booking.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{booking.studentName}</h5>
                        <p className="text-sm text-gray-600">
                          Booked on {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                        {booking.bookingNotes && (
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Notes:</span> {booking.bookingNotes}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleLabPage;
