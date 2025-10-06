import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Send,
    Paperclip,
    Smile,
    Users,
    AlertTriangle,
    Info,
    Clock,
    Check,
    CheckCheck,
    X,
    Minimize2,
    Maximize2
} from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { gsap } from 'gsap';

const ChatSystem = ({ isOpen, onClose, isMinimized, onMinimize, onMaximize }) => {
    const { currentUser, userProfile } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [messageType, setMessageType] = useState('general');
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Message types with Indian healthcare context
    const messageTypes = [
        {
            value: 'general',
            label: 'General',
            icon: Users,
            color: 'bg-blue-100 text-blue-800',
            description: 'General team communication'
        },
        {
            value: 'urgent',
            label: 'Urgent',
            icon: AlertTriangle,
            color: 'bg-red-100 text-red-800',
            description: 'Critical updates requiring immediate attention'
        },
        {
            value: 'info',
            label: 'Information',
            icon: Info,
            color: 'bg-green-100 text-green-800',
            description: 'Important announcements and updates'
        },
        {
            value: 'shift',
            label: 'Shift Updates',
            icon: Clock,
            color: 'bg-purple-100 text-purple-800',
            description: 'Shift changes, assignments, and schedules'
        }
    ];

    // Emoji options for Indian healthcare context
    const emojis = [
        '😊', '👍', '👏', '❤️', '🎉', '✅', '❌', '⚠️', '🩺', '💊', '🏥', '👨‍⚕️', '👩‍⚕️', '🕐', '📋', '📞'
    ];

    // Fetch messages from Firestore
    const fetchMessages = useCallback(() => {
        try {
            const messagesRef = collection(db, 'chatMessages');
            const q = query(
                messagesRef,
                orderBy('timestamp', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const messagesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate() || new Date()
                }));
                setMessages(messagesData.reverse());
                setLoading(false);
            });

            return unsubscribe;
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load chat messages');
            setLoading(false);
        }
    }, []);

    // Send message to Firestore
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        try {
            const messageData = {
                text: newMessage.trim(),
                type: messageType,
                senderId: currentUser.uid,
                senderName: userProfile?.name || currentUser.displayName || 'Unknown User',
                senderRole: userProfile?.role || 'staff',
                timestamp: serverTimestamp(),
                isRead: false,
                attachments: selectedFile ? [{
                    name: selectedFile.name,
                    type: selectedFile.type,
                    size: selectedFile.size,
                    url: null // Will be uploaded to Firebase Storage
                }] : []
            };

            await addDoc(collection(db, 'chatMessages'), messageData);
            setNewMessage('');
            setSelectedFile(null);

            // Scroll to bottom
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    // Handle typing indicator
    const handleTyping = (e) => {
        setNewMessage(e.target.value);

        if (!isTyping) {
            setIsTyping(true);
            // Send typing indicator to other users
        }

        // Clear typing indicator after 3 seconds
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 3000);
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    // Format timestamp for Indian timezone
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get message type styling
    const getMessageTypeStyle = (type) => {
        const messageType = messageTypes.find(t => t.value === type);
        return messageType?.color || 'bg-gray-100 text-gray-800';
    };

    // Check if user is admin (for future use)
    // const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'manager';

    // Initialize chat
    useEffect(() => {
        if (isOpen) {
            const unsubscribe = fetchMessages();
            return () => {
                if (unsubscribe) unsubscribe();
            };
        }
    }, [isOpen, fetchMessages]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Animation on mount
    useEffect(() => {
        if (isOpen && chatContainerRef.current) {
            gsap.fromTo(chatContainerRef.current,
                { scale: 0.9, opacity: 0, y: 20 },
                { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.7)' }
            );
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" ref={chatContainerRef}>
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className={`inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl ${isMinimized ? 'h-96' : 'h-[600px]'}`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-medical-primary rounded-lg">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-medical-dark">Team Chat</h3>
                                <p className="text-sm text-medical-gray">
                                    {messages.length} messages
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={onMinimize}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Message Type Selector */}
                    <div className="mb-4">
                        <div className="flex space-x-2 overflow-x-auto">
                            {messageTypes.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setMessageType(type.value)}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${messageType === type.value
                                        ? type.color
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <type.icon className="w-4 h-4" />
                                    <span>{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg h-80">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="spinner mx-auto mb-4"></div>
                                    <p className="text-medical-gray">Loading messages...</p>
                                </div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-medical-gray">No messages yet. Start the conversation!</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.senderId === currentUser?.uid
                                            ? 'bg-medical-primary text-white'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {/* Message Header */}
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium opacity-75">
                                                    {message.senderName}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${message.senderId === currentUser?.uid
                                                    ? 'bg-white bg-opacity-20'
                                                    : getMessageTypeStyle(message.type)
                                                    }`}>
                                                    {messageTypes.find(t => t.value === message.type)?.label}
                                                </span>
                                            </div>

                                            {/* Message Text */}
                                            <p className="text-sm">{message.text}</p>

                                            {/* Message Footer */}
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs opacity-75">
                                                    {formatTimestamp(message.timestamp)}
                                                </span>
                                                {message.senderId === currentUser?.uid && (
                                                    <div className="flex items-center space-x-1">
                                                        <Check className="w-3 h-3" />
                                                        <CheckCheck className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="flex items-center space-x-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={handleTyping}
                                placeholder="Type your message..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                                disabled={!currentUser}
                            />
                            {isTyping && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <div className="flex space-x-1">
                                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* File Upload */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>

                        {/* Emoji Picker */}
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <Smile className="w-5 h-5" />
                        </button>

                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || !currentUser}
                            className="px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <div className="absolute bottom-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                            <div className="grid grid-cols-8 gap-1">
                                {emojis.map((emoji, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setNewMessage(prev => prev + emoji);
                                            setShowEmojiPicker(false);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* File Preview */}
                    {selectedFile && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Paperclip className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-700">{selectedFile.name}</span>
                                    <span className="text-xs text-gray-500">
                                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatSystem;
