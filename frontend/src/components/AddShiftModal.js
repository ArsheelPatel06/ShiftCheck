import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, AlertTriangle, Zap } from 'lucide-react';
import { gsap } from 'gsap';
import { shiftService } from '../services/dataService';
import toast from 'react-hot-toast';

const AddShiftModal = ({ isOpen, onClose, onSuccess, editingShift }) => {
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        shiftType: 'morning',
        startTime: '',
        endTime: '',
        location: '',
        priority: 'medium',
        requiredSkills: [],
        description: '',
        maxStaff: 1,
        isRecurring: false,
        recurringPattern: {
            frequency: 'weekly',
            interval: 1,
            endDate: ''
        }
    });

    const [availableSkills] = useState([
        'RN License',
        'LPN License',
        'CNA Certified',
        'CPR Certified',
        'BLS Certified',
        'ACLS Certified',
        'PALS Certified',
        'Critical Care',
        'Emergency Medicine',
        'Surgical Tech',
        'Phlebotomy',
        'IV Therapy'
    ]);

    const [isLoading, setIsLoading] = useState(false);

    const departments = [
        'Emergency Department',
        'Intensive Care Unit',
        'Surgery',
        'Pediatrics',
        'Cardiology',
        'Radiology',
        'Laboratory',
        'Pharmacy'
    ];

    useEffect(() => {
        if (isOpen) {
            // Animate modal entrance
            gsap.fromTo('.modal-content',
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
            );
        }
    }, [isOpen]);

    useEffect(() => {
        if (editingShift) {
            // Populate form with editing shift data
            setFormData({
                title: editingShift.title || '',
                department: editingShift.department || '',
                shiftType: editingShift.shiftType || 'morning',
                startTime: editingShift.startTime ? (() => {
                    const date = new Date(editingShift.startTime);
                    return !isNaN(date.getTime()) ? date.toISOString().slice(0, 16) : '';
                })() : '',
                endTime: editingShift.endTime ? (() => {
                    const date = new Date(editingShift.endTime);
                    return !isNaN(date.getTime()) ? date.toISOString().slice(0, 16) : '';
                })() : '',
                location: editingShift.location || '',
                priority: editingShift.priority || 'medium',
                requiredSkills: editingShift.requiredSkills || [],
                description: editingShift.description || '',
                maxStaff: editingShift.maxStaff || 1,
                isRecurring: editingShift.isRecurring || false,
                recurringPattern: editingShift.recurringPattern || {
                    frequency: 'weekly',
                    interval: 1,
                    endDate: ''
                }
            });
        } else {
            // Reset form for new shift
            setFormData({
                title: '',
                department: '',
                shiftType: 'morning',
                startTime: '',
                endTime: '',
                location: '',
                priority: 'medium',
                requiredSkills: [],
                description: '',
                maxStaff: 1,
                isRecurring: false,
                recurringPattern: {
                    frequency: 'weekly',
                    interval: 1,
                    endDate: ''
                }
            });
        }
    }, [editingShift, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('recurringPattern.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                recurringPattern: {
                    ...prev.recurringPattern,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSkillToggle = (skill) => {
        setFormData(prev => ({
            ...prev,
            requiredSkills: prev.requiredSkills.includes(skill)
                ? prev.requiredSkills.filter(s => s !== skill)
                : [...prev.requiredSkills, skill]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Prepare shift data
            const shiftData = {
                ...formData,
                status: 'available', // New shifts are available for pickup
                assignedTo: null, // Not assigned yet
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (editingShift) {
                console.log('Updating shift:', shiftData);
                await shiftService.update(editingShift.id, shiftData);
                toast.success('Shift updated successfully!');
            } else {
                console.log('Creating shift:', shiftData);
                await shiftService.create(shiftData);
                toast.success('Shift created successfully!');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving shift:', error);
            toast.error('Failed to save shift: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoFill = () => {
        // Auto-fill with smart defaults based on current time and department
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const startTime = new Date(tomorrow);
        startTime.setHours(8, 0, 0, 0);

        const endTime = new Date(tomorrow);
        endTime.setHours(16, 0, 0, 0);

        setFormData(prev => ({
            ...prev,
            title: `${prev.shiftType.charAt(0).toUpperCase() + prev.shiftType.slice(1)} Shift - ${prev.department}`,
            startTime: startTime.toISOString().slice(0, 16),
            endTime: endTime.toISOString().slice(0, 16),
            location: prev.department
        }));

        // Animate the auto-fill
        gsap.fromTo('.form-field',
            { scale: 1 },
            { scale: 1.02, duration: 0.1, yoyo: true, repeat: 1 }
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="modal-content inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-medical-primary to-medical-secondary px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">
                                    {editingShift ? 'Edit Shift' : 'Create New Shift'}
                                </h3>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleAutoFill}
                                    className="flex items-center space-x-1 px-3 py-1 bg-white bg-opacity-20 text-white rounded-md hover:bg-opacity-30 transition-colors text-sm"
                                >
                                    <Zap className="w-4 h-4" />
                                    <span>Auto Fill</span>
                                </button>

                                <button
                                    onClick={onClose}
                                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                        {/* Basic Information */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="form-field">
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    Shift Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="e.g., Morning Shift - ICU"
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    Department *
                                </label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Shift Type and Priority */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="form-field">
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    Shift Type
                                </label>
                                <select
                                    name="shiftType"
                                    value={formData.shiftType}
                                    onChange={handleChange}
                                    className="input-field"
                                >
                                    <option value="morning">Morning</option>
                                    <option value="afternoon">Afternoon</option>
                                    <option value="evening">Evening</option>
                                    <option value="night">Night</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    Priority
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="input-field"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    Max Staff
                                </label>
                                <input
                                    type="number"
                                    name="maxStaff"
                                    value={formData.maxStaff}
                                    onChange={handleChange}
                                    className="input-field"
                                    min="1"
                                    max="10"
                                />
                            </div>
                        </div>

                        {/* Time and Location */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="form-field">
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    Start Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    End Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label className="block text-sm font-medium text-medical-dark mb-2">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Room/Unit"
                                />
                            </div>
                        </div>

                        {/* Required Skills */}
                        <div className="form-field">
                            <label className="block text-sm font-medium text-medical-dark mb-3">
                                Required Skills & Certifications
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {availableSkills.map(skill => (
                                    <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.requiredSkills.includes(skill)}
                                            onChange={() => handleSkillToggle(skill)}
                                            className="w-4 h-4 text-medical-primary focus:ring-medical-primary border-gray-300 rounded"
                                        />
                                        <span className="text-sm text-medical-dark">{skill}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="form-field">
                            <label className="block text-sm font-medium text-medical-dark mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="input-field"
                                placeholder="Additional details about this shift..."
                            />
                        </div>

                        {/* Recurring Options */}
                        <div className="form-field">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isRecurring"
                                    checked={formData.isRecurring}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-medical-primary focus:ring-medical-primary border-gray-300 rounded"
                                />
                                <span className="text-sm font-medium text-medical-dark">Make this a recurring shift</span>
                            </label>

                            {formData.isRecurring && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-medical-dark mb-1">
                                                Frequency
                                            </label>
                                            <select
                                                name="recurringPattern.frequency"
                                                value={formData.recurringPattern.frequency}
                                                onChange={handleChange}
                                                className="input-field"
                                            >
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-medical-dark mb-1">
                                                Interval
                                            </label>
                                            <input
                                                type="number"
                                                name="recurringPattern.interval"
                                                value={formData.recurringPattern.interval}
                                                onChange={handleChange}
                                                className="input-field"
                                                min="1"
                                                max="12"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-medical-dark mb-1">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                name="recurringPattern.endDate"
                                                value={formData.recurringPattern.endDate}
                                                onChange={handleChange}
                                                className="input-field"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-6 border-t">
                            <div className="flex items-center space-x-2 text-sm text-medical-gray">
                                <AlertTriangle className="w-4 h-4" />
                                <span>All fields marked with * are required</span>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-outline"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary flex items-center space-x-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="spinner"></div>
                                            <span>{editingShift ? 'Updating...' : 'Creating...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="w-4 h-4" />
                                            <span>{editingShift ? 'Update Shift' : 'Create Shift'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddShiftModal;

