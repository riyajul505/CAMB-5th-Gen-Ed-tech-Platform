import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { qnaAPI } from '../../services/qnaAPI';

const QnAPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const messagesEndRef = useRef(null);

  // Get student's level (mock - in real app this would come from user profile)
  const studentLevel = user.profile.grade || 1;
  console.log(user, "auth.......");

  // Process messages to ensure proper sender identification for replies
  const processMessages = (messages) => {
    console.log('🔄 Processing messages for reply sender identification...');
    return messages.map(message => {
      // Process replies to ensure they have proper sender information
      const processedReplies = message.replies.map(reply => {
        // If reply has no studentId but has a replyToId, it's likely from the current user
        if (!reply.studentId && !reply.teacherId && reply.replyToId) {
          console.log('🔧 Fixing reply sender info:', {
            replyId: reply.id,
            originalReply: reply,
            inferredStudentId: user.id,
            inferredStudentName: user.name || 'Student'
          });
          return {
            ...reply,
            studentId: user.id,
            studentName: user.name || 'Student',
            studentAvatar: '👨‍🎓'
          };
        }
        return reply;
      });

      return {
        ...message,
        replies: processedReplies
      };
    });
  };

  // Load messages from API
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setFetching(true);
        console.log('📥 Fetching messages for level:', studentLevel);
        
        // TODO: Replace with real API call
        const response = await qnaAPI.getLevelMessages(studentLevel);
        console.log(response.data.data.messages, "response.data.data.messages");
        
        // Process messages to fix reply sender information
        const processedMessages = processMessages(response.data.data.messages);
        setMessages(processedMessages);
        
      } catch (error) {
        console.error('❌ Error loading messages:', error);
        alert('Failed to load messages. Please try again.');
      } finally {
        setFetching(false);
      }
    };

    loadMessages();
  }, [studentLevel]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Helper function to determine message styling based on sender
  const getMessageStyle = (message) => {
    // Check if it's a general message from teacher (special styling)
    if (message.teacherId && message.isGeneralMessage) {
      return {
        container: 'bg-purple-50 border-purple-300 shadow-lg',
        text: 'text-purple-900',
        name: 'text-purple-800 font-bold',
        timestamp: 'text-purple-600',
        avatar: 'bg-purple-200'
      };
    } else if (message.teacherId) {
      // Regular teacher message
      return {
        container: 'bg-green-50 border-green-200',
        text: 'text-green-900',
        name: 'text-green-800',
        timestamp: 'text-green-600',
        avatar: 'bg-green-100'
      };
    } else if (message.studentId === user.id || 
               (!message.studentId && !message.teacherId && message.replyToId)) {
      // Current user's (student) message or reply without sender info (infer as current user)
      return {
        container: 'bg-blue-100 border-blue-300 shadow-md',
        text: 'text-blue-900',
        name: 'text-blue-800 font-semibold',
        timestamp: 'text-blue-600',
        avatar: 'bg-blue-200'
      };
    } else {
      // Other students' messages
      return {
        container: 'bg-gray-50 border-gray-200',
        text: 'text-gray-800',
        name: 'text-gray-700',
        timestamp: 'text-gray-500',
        avatar: 'bg-gray-100'
      };
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);

    try {
      const messageData = {
        studentId: user.id,
        content: newMessage.trim(),
        level: studentLevel,
        replyToId: replyTo?.id || null
      };

      // TODO: Replace with real API call
      const response = await qnaAPI.sendStudentMessage(messageData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Add message to state (matching API response format)
      const newMessageObj = {
        id: Date.now().toString(),
        studentId: user.id,
        studentName: user.name || 'Student',
        studentAvatar: '👨‍🎓',
        teacherId: null,
        teacherName: null,
        teacherAvatar: null,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        isTeacher: false,
        level: studentLevel,
        replyToId: replyTo?.id || null,
        threadId: replyTo?.id || Date.now().toString(),
        replies: []
      };

      if (replyTo) {
        // Add as reply
        setMessages(prev => prev.map(msg => 
          msg.id === replyTo.id 
            ? { ...msg, replies: [...msg.replies, newMessageObj] }
            : msg
        ));
        setReplyTo(null);
      } else {
        // Add as new message
        setMessages(prev => [...prev, newMessageObj]);
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const deleteData = {
        userId: user.id
      };

      // TODO: Replace with real API call
      await qnaAPI.deleteMessage(messageId, deleteData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      // Remove message from state - handle both top-level messages and replies
      setMessages(prev => {
        // First, try to find and remove from top-level messages
        const filteredMessages = prev.filter(msg => msg.id !== messageId);
        
        // If message wasn't found in top-level, it might be a reply
        if (filteredMessages.length === prev.length) {
          // Search through replies in each message
          return prev.map(message => ({
            ...message,
            replies: message.replies.filter(reply => reply.id !== messageId)
          }));
        }
        
        return filteredMessages;
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    // Focus on the input field
    document.getElementById('message-input')?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Q&A Forum - Level {studentLevel}</h1>
              <p className="text-sm text-gray-600">Ask questions and interact with your classmates and teachers</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading messages...</p>
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
            <h1 className="text-xl font-bold text-gray-900">Q&A Forum - Level {studentLevel}</h1>
            <p className="text-sm text-gray-600">Ask questions and interact with your classmates and teachers</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-600">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => {
          const messageStyle = getMessageStyle(message);
          return (
            <div key={message.id} className="space-y-3">
              {/* Main Message */}
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${messageStyle.avatar}`}>
                    {message.teacherId ? message.teacherAvatar : message.studentAvatar}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`rounded-lg p-4 shadow-sm border ${messageStyle.container}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${messageStyle.name}`}>
                          {message.teacherId ? message.teacherName : message.studentName}
                          {message.studentId === user.id && !message.teacherId && (
                            <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                              You
                            </span>
                          )}
                        </span>
                        <span className={`text-xs ${messageStyle.timestamp}`}>
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {message.teacherId && message.isGeneralMessage && (
                          <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded font-semibold">
                            📢 General
                          </span>
                        )}
                        {message.teacherId && !message.isGeneralMessage && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                            Teacher
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleReply(message)}
                          className="text-gray-400 hover:text-gray-600 text-sm"
                        >
                          Reply
                        </button>
                        {!message.teacherId && message.studentId === user.id && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-red-400 hover:text-red-600 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={messageStyle.text}>
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {message.replies.map((reply) => {
                const replyStyle = getMessageStyle(reply);
                return (
                  <div key={reply.id} className="flex space-x-3 ml-12">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${replyStyle.avatar}`}>
                        {reply.teacherId ? reply.teacherAvatar : reply.studentAvatar}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`rounded-lg p-3 border ${replyStyle.container}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold text-sm ${replyStyle.name}`}>
                              {reply.teacherId ? reply.teacherName : reply.studentName}
                              {(reply.studentId === user.id && !reply.teacherId) || 
                               (!reply.studentId && !reply.teacherId && reply.replyToId) ? (
                                <span className="ml-1 text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">
                                  You
                                </span>
                              ) : null}
                            </span>
                            <span className={`text-xs ${replyStyle.timestamp}`}>
                              {formatTimestamp(reply.timestamp)}
                            </span>
                            {reply.teacherId && reply.isGeneralMessage && (
                              <span className="text-xs bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-semibold">
                                📢 General
                              </span>
                            )}
                            {reply.teacherId && !reply.isGeneralMessage && (
                              <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded">
                                Teacher
                              </span>
                            )}
                          </div>
                          {(!reply.teacherId && reply.studentId === user.id) || 
                           (!reply.studentId && !reply.teacherId && reply.replyToId) ? (
                            <button
                              onClick={() => handleDeleteMessage(reply.id)}
                              className="text-red-400 hover:text-red-600 text-xs"
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                        <p className={replyStyle.text}>
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">Replying to:</span>
              <span className="text-sm font-medium text-blue-800">
                {replyTo.teacherId ? replyTo.teacherName : replyTo.studentName}
              </span>
            </div>
            <button
              onClick={cancelReply}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Cancel
            </button>
          </div>
          <p className="text-sm text-blue-700 mt-1 truncate">{replyTo.content}</p>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              id="message-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                replyTo 
                  ? `Reply to ${replyTo.teacherId ? replyTo.teacherName : replyTo.studentName}...` 
                  : "Type your question or message here..."
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="2"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QnAPage;