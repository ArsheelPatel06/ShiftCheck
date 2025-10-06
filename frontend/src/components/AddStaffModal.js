import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Award, UserPlus } from 'lucide-react';
import { gsap } from 'gsap';
import { userService } from '../services/dataService';
import toast from 'react-hot-toast';

const AddStaffModal = ({ isOpen, onClose, onSuccess, editingUser, viewingUser }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        role: 'staff',
        department: '',
        skills: [],
        preferences: {
            preferredShifts: [],
            maxHoursPerWeek: 40,
            availableDays: []
        },
        emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
        },
        certifications: []
    });

    const [newCertification, setNewCertification] = useState({
        name: '',
        issueDate: '',
        expiryDate: '',
        issuingOrganization: ''
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
        'IV Therapy',
        'Medication Administration',
        'Patient Assessment',
        'Wound Care'
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
        'Pharmacy',
    ];

    const shiftTypes = ['morning', 'afternoon', 'evening', 'night'];
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    useEffect(() => {
        if (isOpen) {
            gsap.fromTo('.modal-content',
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
            );
        }
    }, [isOpen]);

    useEffect(() => {
        if (editingUser || viewingUser) {
            // Populate form with user data
            const userData = editingUser || viewingUser;
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                phoneNumber: userData.phoneNumber || '',
                role: userData.role || 'staff',
                department: userData.department || '',
                skills: userData.skills || [],
                preferences: userData.preferences || {
                    preferredShifts: [],
                    maxHoursPerWeek: 40,
                    availableDays: []
                },
                emergencyContact: userData.emergencyContact || {
                    name: '',
                    phone: '',
                    relationship: ''
                },
                certifications: userData.certifications || []
            });
        } else {
            // Reset form for new user
            setFormData({
                name: '',
                email: '',
                phoneNumber: '',
                role: 'staff',
                department: '',
                skills: [],
                preferences: {
                    preferredShifts: [],
                    maxHoursPerWeek: 40,
                    availableDays: []
                },
                emergencyContact: {
                    name: '',
                    phone: '',
                    relationship: ''
                },
                certifications: []
            });
        }
    }, [editingUser, viewingUser, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('preferences.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                preferences: {
                    ...prev.preferences,
                    [field]: type === 'number' ? parseInt(value) : value
                }
            }));
        } else if (name.startsWith('emergencyContact.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                emergencyContact: {
                    ...prev.emergencyContact,
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
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    const handlePreferenceToggle = (type, value) => {
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [type]: prev.preferences[type].includes(value)
                    ? prev.preferences[type].filter(item => item !== value)
                    : [...prev.preferences[type], value]
            }
        }));
    };

    const handleAddCertification = () => {
        if (newCertification.name && newCertification.issueDate) {
            setFormData(prev => ({
                ...prev,
                certifications: [...prev.certifications, { ...newCertification, id: Date.now() }]
            }));
            setNewCertification({
                name: '',
                issueDate: '',
                expiryDate: '',
                issuingOrganization: ''
            });
        }
    };

    const handleRemoveCertification = (id) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.filter(cert => cert.id !== id)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // If viewing, don't submit
        if (viewingUser) {
            onClose();
            return;
        }

        setIsLoading(true);

        try {
            if (editingUser) {
                console.log('Updating staff member:', formData);
                toast.loading('Updating staff member...', { id: 'update-staff' });

                // Real API call to update user
                await userService.update(editingUser.id || editingUser._id, formData);

                toast.success('Staff member updated successfully!', { id: 'update-staff' });
            } else {
                console.log('Creating staff member:', formData);
                toast.loading('Creating staff member...', { id: 'create-staff' });

                // Real API call to create user
                const newUser = await userService.create(formData);

                console.log('Created user:', newUser);
                toast.success('Staff member created successfully!', { id: 'create-staff' });
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving staff member:', error);
            toast.error(error.message || 'Failed to save staff member');
        } finally {
            setIsLoading(false);
        }
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
                <div className="modal-content inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-medical-secondary to-medical-primary px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <UserPlus className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">
                                    {viewingUser ? 'View Staff Member' : editingUser ? 'Edit Staff Member' : 'Add New Staff Member'}
                                </h3>
                            </div>

                            <button
                                onClick={onClose}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8 max-h-96 overflow-y-auto">
                        {/* Personal Information */}
                        <div>
                            <h4 className="text-lg font-medium text-medical-dark mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                Personal Information
                            </h4>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Email Address *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-gray w-4 h-4" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="input-field-with-icon"
                                            placeholder="email@hospital.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-gray w-4 h-4" />
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className="input-field-with-icon"
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Role
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="input-field"
                                    >
                                        <option value="staff">Healthcare Staff</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Work Information */}
                        <div>
                            <h4 className="text-lg font-medium text-medical-dark mb-4 flex items-center">
                                <MapPin className="w-5 h-5 mr-2" />
                                Work Information
                            </h4>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
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

                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Max Hours Per Week
                                    </label>
                                    <input
                                        type="number"
                                        name="preferences.maxHoursPerWeek"
                                        value={formData.preferences.maxHoursPerWeek}
                                        onChange={handleChange}
                                        className="input-field"
                                        min="1"
                                        max="60"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Skills & Certifications */}
                        <div>
                            <h4 className="text-lg font-medium text-medical-dark mb-4 flex items-center">
                                <Award className="w-5 h-5 mr-2" />
                                Skills & Certifications
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-3">
                                        Skills
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                                        {availableSkills.map(skill => (
                                            <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.skills.includes(skill)}
                                                    onChange={() => handleSkillToggle(skill)}
                                                    className="w-4 h-4 text-medical-primary focus:ring-medical-primary border-gray-300 rounded"
                                                />
                                                <span className="text-sm text-medical-dark">{skill}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Add Certification */}
                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium text-medical-dark mb-3">
                                        Certifications
                                    </label>

                                    <div className="grid md:grid-cols-4 gap-3 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Certification name"
                                            value={newCertification.name}
                                            onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                                            className="input-field text-sm"
                                        />
                                        <input
                                            type="date"
                                            placeholder="Issue date"
                                            value={newCertification.issueDate}
                                            onChange={(e) => setNewCertification(prev => ({ ...prev, issueDate: e.target.value }))}
                                            className="input-field text-sm"
                                        />
                                        <input
                                            type="date"
                                            placeholder="Expiry date"
                                            value={newCertification.expiryDate}
                                            onChange={(e) => setNewCertification(prev => ({ ...prev, expiryDate: e.target.value }))}
                                            className="input-field text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCertification}
                                            className="btn-outline text-sm py-2"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {/* Certification List */}
                                    {formData.certifications.length > 0 && (
                                        <div className="space-y-2">
                                            {formData.certifications.map(cert => (
                                                <div key={cert.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <div>
                                                        <span className="font-medium text-sm">{cert.name}</span>
                                                        <span className="text-xs text-medical-gray ml-2">
                                                            {cert.issueDate} - {cert.expiryDate || 'No expiry'}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveCertification(cert.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Preferences */}
                        <div>
                            <h4 className="text-lg font-medium text-medical-dark mb-4">
                                Work Preferences
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Preferred Shift Types
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {shiftTypes.map(shift => (
                                            <label key={shift} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.preferences.preferredShifts.includes(shift)}
                                                    onChange={() => handlePreferenceToggle('preferredShifts', shift)}
                                                    className="w-4 h-4 text-medical-primary focus:ring-medical-primary border-gray-300 rounded"
                                                />
                                                <span className="text-sm text-medical-dark capitalize">{shift}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Available Days
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {daysOfWeek.map(day => (
                                            <label key={day} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.preferences.availableDays.includes(day)}
                                                    onChange={() => handlePreferenceToggle('availableDays', day)}
                                                    className="w-4 h-4 text-medical-primary focus:ring-medical-primary border-gray-300 rounded"
                                                />
                                                <span className="text-sm text-medical-dark capitalize">{day}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                            <h4 className="text-lg font-medium text-medical-dark mb-4">
                                Emergency Contact
                            </h4>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Contact Name
                                    </label>
                                    <input
                                        type="text"
                                        name="emergencyContact.name"
                                        value={formData.emergencyContact.name}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="Full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="emergencyContact.phone"
                                        value={formData.emergencyContact.phone}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-medical-dark mb-2">
                                        Relationship
                                    </label>
                                    <input
                                        type="text"
                                        name="emergencyContact.relationship"
                                        value={formData.emergencyContact.relationship}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="e.g., Spouse, Parent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-6 border-t">
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
                                        <span>{editingUser ? 'Updating...' : 'Adding...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        <span>
                                            {viewingUser ? 'Close' : editingUser ? 'Update Staff Member' : 'Add Staff Member'}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddStaffModal;

