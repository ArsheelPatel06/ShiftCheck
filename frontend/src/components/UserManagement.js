import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye
} from 'lucide-react';
import { userService } from '../services/dataService';
import deletionService from '../services/deletionService';
import AddStaffModal from './AddStaffModal';
import toast from 'react-hot-toast';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    const [filters, setFilters] = useState({
        role: '',
        department: '',
        search: ''
    });

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await userService.getAll(filters);
            const usersData = response.users || response || [];

            // Filter out any invalid user objects
            const validUsers = Array.isArray(usersData)
                ? usersData.filter(user => user && (user.id || user._id))
                : [];

            setUsers(validUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEdit = (user) => {
        setEditingUser(user);
        setShowAddModal(true);
    };

    const handleView = (user) => {
        setViewingUser(user);
        setShowAddModal(true);
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This will permanently delete:\n• User account and authentication\n• All user data (shifts, leaves, notifications)\n• All related records\n\nThis action cannot be undone.')) {
            const result = await deletionService.deleteUser(userId);
            if (result.success) {
                fetchUsers();
            }
        }
    };

    const handleModalSuccess = () => {
        fetchUsers();
        setShowAddModal(false);
        setEditingUser(null);
        setViewingUser(null);
    };

    const handleModalClose = () => {
        setShowAddModal(false);
        setEditingUser(null);
        setViewingUser(null);
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'manager': return 'bg-orange-100 text-orange-800';
            case 'staff': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-medical-gray">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-medical-dark">User Management</h2>
                    <p className="text-medical-gray">Manage your staff members and their roles</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Staff</span>
                </button>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-gray w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="input-field pl-10"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>
                    <select
                        className="input-field"
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                    </select>
                    <select
                        className="input-field"
                        value={filters.department}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    >
                        <option value="">All Departments</option>
                        <option value="Emergency Department">Emergency Department</option>
                        <option value="Intensive Care Unit">Intensive Care Unit</option>
                        <option value="Surgery">Surgery</option>
                    </select>
                </div>
            </div>

            {/* Users List */}
            <div className="grid gap-4">
                {users.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-xl font-semibold text-medical-dark mb-2">No Users Found</h3>
                        <p className="text-medical-gray mb-6">
                            {loading ? 'Loading users...' : 'No users have been created yet. Add your first user to get started.'}
                        </p>
                        {!loading && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn-primary flex items-center space-x-2 mx-auto"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add First User</span>
                            </button>
                        )}
                    </div>
                ) : (
                    users.map((user) => (
                        <div key={user._id || user.id} className="card">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-medical-primary rounded-full flex items-center justify-center">
                                        <span className="text-white text-lg font-medium">
                                            {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-medical-dark">{user.name || 'Unknown User'}</h3>
                                        <p className="text-medical-gray">{user.email || 'No email'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="text-center">
                                        <p className="text-sm text-medical-gray">Role</p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role || 'staff')}`}>
                                            {user.role || 'staff'}
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-medical-gray">Department</p>
                                        <p className="font-medium text-medical-dark">{user.department || 'Unknown'}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-medical-gray">Status</p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${(user.status || 'active') === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.status || 'active'}
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleView(user)}
                                            className="btn-outline text-sm"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="btn-outline text-sm"
                                            title="Edit User"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user._id || user.id)}
                                            className="btn-outline text-red-600 hover:bg-red-50 text-sm"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>


            {/* Add/Edit/View Staff Modal */}
            {showAddModal && (
                <AddStaffModal
                    isOpen={showAddModal}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                    editingUser={editingUser}
                    viewingUser={viewingUser}
                />
            )}
        </div>
    );
};

export default UserManagement;
