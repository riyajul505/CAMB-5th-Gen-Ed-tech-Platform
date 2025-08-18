import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { labBookingAPI } from '../../services/labBookingAPI';

const JoinLabPage = () => {
  const { user } = useAuth();
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [myBookings, setMyBookings] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');

  // Get student's level
  const studentLevel = user.profile.grade || 1;

  // Load available slots and student's bookings
  useEffect(() => {
    const loadLabData = async () => {
      try {
        setFetching(true);
        console.log('📥 Loading lab data for student level:', studentLevel);
        
        // Fetch available slots for student's level
        const slotsResponse = await labBookingAPI.getAvailableSlots(studentLevel);
        console.log('📥 Available slots response:', slotsResponse.data);
        
        // Fetch student's existing bookings
        const bookingsResponse = await labBookingAPI.getStudentBookings(user.id);
        console.log('📥 Student bookings response:', bookingsResponse.data);
        
        // Set state with actual API data
        if (slotsResponse.data && slotsResponse.data.data && slotsResponse.data.data.slots) {
          setAvailableSlots(slotsResponse.data.data.slots);
        } else {
          console.warn('⚠️ No slots data in response:', slotsResponse);
          setAvailableSlots([]);
        }
        
        if (bookingsResponse.data && bookingsResponse.data.data && bookingsResponse.data.data.bookings) {
          setMyBookings(bookingsResponse.data.data.bookings);
        } else {
          console.warn('⚠️ No bookings data in response:', bookingsResponse);
          setMyBookings([]);
        }
        
        console.log('✅ Lab data loaded successfully:', {
          availableSlots: slotsResponse.data?.data?.slots?.length || 0,
          myBookings: bookingsResponse.data?.data?.bookings?.length || 0
        });
        
      } catch (error) {
        console.error('❌ Error loading lab data:', error);
        alert('Failed to load lab data. Please try again.');
        // Set empty arrays on error to prevent UI issues
        setAvailableSlots([]);
        setMyBookings([]);
      } finally {
        setFetching(false);
      }
    };

    loadLabData();
  }, [studentLevel, user.id]);

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleBookSlot = (slot) => {
    setSelectedSlot(slot);
    setShowBookingForm(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !bookingNotes.trim()) return;

    setLoading(true);

    try {
      const bookingData = {
        slotId: selectedSlot.id,
        studentId: user.id,
        bookingNotes: bookingNotes.trim()
      };

      console.log('📤 Creating lab booking:', bookingData);

      // Make actual API call to create booking
      const response = await labBookingAPI.createBooking(bookingData);
      console.log('📥 Booking creation response:', response.data);

      if (response.data && response.data.success) {
        // Add the new booking to state
        const newBooking = response.data.data.booking;
        setMyBookings(prev => [...prev, newBooking]);
        
        // Update slot availability in the available slots list
        setAvailableSlots(prev => prev.map(slot => 
          slot.id === selectedSlot.id 
            ? { ...slot, currentBookings: (slot.currentBookings || 0) + 1 }
            : slot
        ));

        setShowBookingForm(false);
        setSelectedSlot(null);
        setBookingNotes('');
        
        alert('Lab session booked successfully!');
      } else {
        throw new Error('Failed to create booking');
      }
      
    } catch (error) {
      console.error('❌ Error booking lab session:', error);
      alert('Failed to book lab session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this lab session?')) return;

    try {
      console.log('🗑️ Canceling booking:', bookingId, user.id);

      // Make actual API call to cancel booking
      const response = await labBookingAPI.cancelBooking(bookingId, user.id);
      console.log('📥 Cancel booking response:', response.data);

      if (response.data && response.data.success) {
        // Remove booking from state
        setMyBookings(prev => prev.filter(booking => booking.id !== bookingId));
        
        // Update slot availability if we have the slot info
        const canceledBooking = myBookings.find(b => b.id === bookingId);
        const canceledSlotId = canceledBooking?.slotId || canceledBooking?.slot?.id;
        if (canceledSlotId) {
          setAvailableSlots(prev => prev.map(slot => 
            slot.id === canceledSlotId
              ? { ...slot, currentBookings: Math.max(0, (slot.currentBookings || 0) - 1) }
              : slot
          ));
        }
        
        alert('Lab session cancelled successfully!');
      } else {
        throw new Error('Failed to cancel booking');
      }
      
    } catch (error) {
      console.error('❌ Error canceling booking:', error);
      alert('Failed to cancel lab session. Please try again.');
    }
  };

  // Helpers to determine active bookings and whether this student already booked a slot
  const isActiveBooking = (booking) => {
    const status = (booking?.status || '').toLowerCase();
    return status !== 'cancelled' && status !== 'canceled';
  };

  const hasActiveBookingForSlot = (slotId) => {
    return myBookings.some(b => isActiveBooking(b) && ((b.slotId || b.slot?.id) === slotId));
  };

  const getAvailableSlotsForLevel = () => {
    const activeBookedSlotIds = new Set(
      myBookings
        .filter(isActiveBooking)
        .map(b => b.slotId || b.slot?.id)
        .filter(Boolean)
    );

    return availableSlots.filter(slot => 
      slot.level === studentLevel && 
      slot.status === 'active' && 
      (slot.currentBookings || 0) < slot.maxStudents &&
      !activeBookedSlotIds.has(slot.id)
    );
  };

  if (fetching) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Join Lab Sessions</h1>
              <p className="text-sm text-gray-600">Book interactive lab sessions for Level {studentLevel}</p>
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
            <h1 className="text-xl font-bold text-gray-900">Join Lab Sessions</h1>
            <p className="text-sm text-gray-600">Book interactive lab sessions for Level {studentLevel}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-600">Live Sessions Available</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* My Bookings Section */}
        {myBookings.filter(isActiveBooking).length > 0 && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Booked Sessions</h2>
            <div className="space-y-3">
              {myBookings.filter(isActiveBooking).map((booking) => (
                <div key={booking.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                          👩‍🔬
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900">{booking.slot?.topic}</h3>
                          <p className="text-sm text-blue-700">with {booking.slot?.teacherName}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(booking.slot?.date)}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {formatTime(booking.slot?.startTime)} - {formatTime(booking.slot?.endTime)}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {booking.slot?.location}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> 
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-200 text-green-800' 
                              : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                      {booking.bookingNotes && (
                        <div className="mt-2 text-sm text-blue-700">
                          <span className="font-medium">Notes:</span> {booking.bookingNotes}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Slots Section */}
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Lab Sessions</h2>
          {getAvailableSlotsForLevel().length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧪</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Available Sessions</h3>
              <p className="text-gray-600">Check back later for new lab sessions in Level {studentLevel}.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getAvailableSlotsForLevel().map((slot) => (
                <div key={slot.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg">
                      {slot.teacherAvatar || '👨‍🔬'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{slot.teacherName}</h3>
                      <p className="text-sm text-gray-600">Level {slot.level}</p>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2">{slot.topic}</h4>
                  <p className="text-sm text-gray-600 mb-4">{slot.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="w-4 h-4 mr-2">📅</span>
                      {formatDate(slot.date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="w-4 h-4 mr-2">🕐</span>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)} ({slot.duration || 'N/A'} min)
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="w-4 h-4 mr-2">📍</span>
                      {slot.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="w-4 h-4 mr-2">👥</span>
                      {slot.currentBookings || 0}/{slot.maxStudents} students booked
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleBookSlot(slot)}
                    disabled={(slot.currentBookings || 0) >= slot.maxStudents}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {(slot.currentBookings || 0) >= slot.maxStudents ? 'Full' : 'Book Session'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingForm && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Lab Session</h3>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">{selectedSlot.topic || 'Lab Session'}</h4>
              <p className="text-sm text-gray-600 mb-2">with {selectedSlot.teacherName || 'Teacher'}</p>
              <p className="text-sm text-gray-600">
                {formatDate(selectedSlot.date)} • {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Any specific questions or topics you'd like to focus on..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBookingForm(false);
                  setSelectedSlot(null);
                  setBookingNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinLabPage;
