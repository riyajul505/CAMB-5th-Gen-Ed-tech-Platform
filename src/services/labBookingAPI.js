import api from './api';

// Lab Booking API Service
export const labBookingAPI = {
  // ===== STUDENT ENDPOINTS =====
  
  // Get available lab slots for a specific level
  getAvailableSlots: async (level) => {
    try {
      const response = await api.get(`/lab/slots/available/${level}`);
      console.log('📥 Available slots response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching available slots:', error);
      throw error;
    }
  },

  // Get student's booked lab sessions
  getStudentBookings: async (studentId) => {
    try {
      const response = await api.get(`/lab/bookings/student/${studentId}`);
      console.log('📥 Student bookings response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching student bookings:', error);
      throw error;
    }
  },

  // Create a new lab booking
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/lab/bookings', bookingData);
      console.log('📤 Create booking response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      throw error;
    }
  },

  // Cancel a lab booking
  cancelBooking: async (bookingId, studentId) => {
    try {
      const response = await api.delete(`/lab/bookings/${bookingId}`, 
        {data:{
          studentId: studentId
        }}
      );
      console.log('🗑️ Cancel booking response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error canceling booking:', error);
      throw error;
    }
  },

  // ===== TEACHER ENDPOINTS =====

  // Get teacher's created lab slots
  getTeacherSlots: async (teacherId) => {
    try {
      const response = await api.get(`/lab/teacher/${teacherId}/slots`);
      console.log('📥 Teacher slots response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching teacher slots:', error);
      throw error;
    }
  },

  // Create a new lab slot
  createSlot: async (slotData) => {
    try {
      const response = await api.post('/lab/slots', slotData);
      console.log('📤 Create slot response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error creating slot:', error);
      throw error;
    }
  },

  // Update an existing lab slot
  updateSlot: async (updateData) => {
    try {
      const response = await api.put(`/lab/slots/${updateData.slotId}`, updateData);
      console.log('📝 Update slot response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error updating slot:', error);
      throw error;
    }
  },

  // Delete a lab slot
  deleteSlot: async (slotId) => {
    try {
      const response = await api.delete(`/lab/slots/${slotId}`);
      console.log('🗑️ Delete slot response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting slot:', error);
      throw error;
    }
  },

  // Toggle slot status (active/inactive)
  toggleSlotStatus: async (slotId, isActive) => {
    try {
      const response = await api.patch(`/lab-slots/${slotId}/status`, { isActive });
      console.log('🔄 Toggle slot status response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error toggling slot status:', error);
      throw error;
    }
  },

  // Get bookings for a specific slot
  getSlotBookings: async (slotId) => {
    try {
      const response = await api.get(`/lab/slots/${slotId}/bookings`);
      console.log('📥 Slot bookings response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching slot bookings:', error);
      throw error;
    }
  },

  // ===== ADMIN ENDPOINTS =====

  // Get all lab slots (admin only)
  getAllSlots: async () => {
    try {
      const response = await api.get('/lab-slots');
      console.log('📥 All slots response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching all slots:', error);
      throw error;
    }
  },

  // Get all bookings (admin only)
  getAllBookings: async () => {
    try {
      const response = await api.get('/lab-bookings');
      console.log('📥 All bookings response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching all bookings:', error);
      throw error;
    }
  }
};

// Mock API responses for testing (when backend is not ready)
export const mockLabBookingAPI = {
  // Mock data structures that match the expected API responses
  
  // Available slots response structure
  mockAvailableSlotsResponse: {
    success: true,
    data: {
      slots: [
        {
          id: 'slot_1',
          teacherId: 'teacher_001',
          teacherName: 'Dr. Sarah Johnson',
          teacherAvatar: '👩‍🔬',
          level: 2,
          date: '2024-12-20',
          startTime: '10:00',
          endTime: '11:00',
          duration: 60,
          maxStudents: 8,
          currentBookings: 3,
          topic: 'Chemistry Lab - Acid Base Reactions',
          description: 'Learn about pH levels and acid-base indicators through hands-on experiments.',
          location: 'Lab Room 101',
          isAvailable: true
        }
      ]
    }
  },

  // Student bookings response structure
  mockStudentBookingsResponse: {
    success: true,
    data: {
      bookings: [
        {
          id: 'booking_1',
          slotId: 'slot_1',
          studentId: 'student_001',
          studentName: 'Alice Johnson',
          teacherId: 'teacher_001',
          teacherName: 'Dr. Sarah Johnson',
          date: '2024-12-20',
          startTime: '10:00',
          endTime: '11:00',
          topic: 'Chemistry Lab - Acid Base Reactions',
          location: 'Lab Room 101',
          status: 'confirmed',
          bookingNotes: 'Excited to learn about pH levels!',
          createdAt: '2024-12-15T10:30:00Z'
        }
      ]
    }
  },

  // Teacher slots response structure
  mockTeacherSlotsResponse: {
    success: true,
    data: {
      slots: [
        {
          id: 'slot_1',
          teacherId: 'teacher_001',
          teacherName: 'Dr. Sarah Johnson',
          level: 2,
          date: '2024-12-20',
          startTime: '10:00',
          endTime: '11:00',
          duration: 60,
          maxStudents: 8,
          currentBookings: 3,
          topic: 'Chemistry Lab - Acid Base Reactions',
          description: 'Learn about pH levels and acid-base indicators through hands-on experiments.',
          location: 'Lab Room 101',
          isActive: true,
          createdAt: '2024-12-10T10:30:00Z',
          bookings: [
            {
              id: 'booking_1',
              studentId: 'student_001',
              studentName: 'Alice Johnson',
              bookingNotes: 'Excited to learn about pH levels!',
              status: 'confirmed',
              createdAt: '2024-12-15T10:30:00Z'
            }
          ]
        }
      ]
    }
  },

  // Create booking request structure
  mockCreateBookingRequest: {
    slotId: 'slot_1',
    studentId: 'student_001',
    bookingNotes: 'Excited to learn about pH levels!'
  },

  // Create slot request structure
  mockCreateSlotRequest: {
    teacherId: 'teacher_001',
    level: 2,
    date: '2024-12-20',
    startTime: '10:00',
    endTime: '11:00',
    topic: 'Chemistry Lab - Acid Base Reactions',
    description: 'Learn about pH levels and acid-base indicators through hands-on experiments.',
    location: 'Lab Room 101',
    maxStudents: 8
  },

  // Update slot request structure
  mockUpdateSlotRequest: {
    slotId: 'slot_1',
    level: 2,
    date: '2024-12-20',
    startTime: '10:00',
    endTime: '11:00',
    topic: 'Chemistry Lab - Acid Base Reactions',
    description: 'Learn about pH levels and acid-base indicators through hands-on experiments.',
    location: 'Lab Room 101',
    maxStudents: 8
  }
};

export default labBookingAPI;
