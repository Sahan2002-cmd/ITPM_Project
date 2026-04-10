// src/pages/AdminUsers.tsx
import { useState, useEffect } from 'react';
import { 
  Search, Edit2, Save, X, Plus, User, Mail, Phone, MapPin, 
  GraduationCap, Shield, Calendar, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllUsers, approveUser, editUserProfile, registerUser } from '../services/UserAPI';

// Backend user interface (uppercase fields)
interface BackendUser {
  UserId: number;
  FullName: string;
  Email: string;
  PhoneNumber: string;
  RoleId: number;
  RoleName: string;
  Status: string;
  Center?: string;
  Semester?: string;
  ProfileImage?: string;
  CreatedAt?: string;
}

// Frontend user interface (camelCase)
interface User {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  roleId: number;
  roleName: string;
  status: string;
  center?: string;
  semester?: string;
  profileImage?: string;
  createdAt?: string;
}

type StatusFilter = 'all' | 'Active' | 'Pending' | 'Inactive' | 'Suspended';
type RoleFilter = 'all' | 'Student' | 'Tutor' | 'Admin';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    roleId: 3,
    center: '',
    semester: '',
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, search, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      const normalizedUsers = (data || []).map((u: BackendUser) => ({
        userId: u.UserId,
        fullName: u.FullName,
        email: u.Email,
        phoneNumber: u.PhoneNumber,
        roleId: u.RoleId,
        roleName: u.RoleName,
        status: u.Status,
        center: u.Center,
        semester: u.Semester,
        profileImage: u.ProfileImage,
        createdAt: u.CreatedAt,
      }));
      setUsers(normalizedUsers);
      setFilteredUsers(normalizedUsers);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    if (search) {
      filtered = filtered.filter(u =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.roleName === roleFilter);
    }
    setFilteredUsers(filtered);
  };

  const handleStatusChange = async (userId: number, newStatus: string) => {
    try {
      await approveUser({ userId, status: newStatus });
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
      if (selectedUser?.userId === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAddUser = async () => {
    setAddErrors({});
    if (!newUser.fullName) setAddErrors(prev => ({ ...prev, fullName: 'Full name required' }));
    if (!newUser.email) setAddErrors(prev => ({ ...prev, email: 'Email required' }));
    if (!newUser.password) setAddErrors(prev => ({ ...prev, password: 'Password required' }));
    if (!newUser.phoneNumber) setAddErrors(prev => ({ ...prev, phoneNumber: 'Phone required' }));
    if (Object.keys(addErrors).length > 0) return;

    setAddingUser(true);
    try {
      await registerUser({
        fullName: newUser.fullName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        password: newUser.password,
        roleId: newUser.roleId,
        center: newUser.center,
        semester: newUser.roleId === 3 ? newUser.semester : null,
        confirmDetails: true,
        profileImage: null,  // ✅ added missing property
      });
      toast.success('User created successfully');
      setShowAddModal(false);
      setNewUser({ fullName: '', email: '', phoneNumber: '', password: '', roleId: 3, center: '', semester: '' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setAddingUser(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Active: 'bg-emerald-100 text-emerald-700',
      Pending: 'bg-amber-100 text-amber-700',
      Inactive: 'bg-slate-100 text-slate-600',
      Suspended: 'bg-rose-100 text-rose-700',
    };
    return styles[status] || 'bg-slate-100 text-slate-600';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Student': return <GraduationCap className="w-5 h-5" />;
      case 'Tutor': return <User className="w-5 h-5" />;
      case 'Admin': return <Shield className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Add User button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage all platform users, their roles, and status</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
        >
          <option value="all">All Roles</option>
          <option value="Student">Student</option>
          <option value="Tutor">Tutor</option>
          <option value="Admin">Admin</option>
        </select>
        <button
          onClick={() => {
            setSearch('');
            setStatusFilter('all');
            setRoleFilter('all');
          }}
          className="px-4 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
        >
          Reset Filters
        </button>
      </div>

      {/* Users Table – clickable rows */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Phone</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Center</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => (
                <tr
                  key={user.userId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  onClick={() => { setSelectedUser(user); setShowModal(true); }}
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{user.fullName}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                      {user.roleName}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {user.phoneNumber || '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {user.center || '—'}
                  </td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setSelectedUser(user); setShowModal(true); }}
                      className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No users found</p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Details</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <img
                  src={selectedUser.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.fullName}`}
                  alt={selectedUser.fullName}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-100"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedUser.fullName}</h3>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                      {getRoleIcon(selectedUser.roleName)} {selectedUser.roleName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Full Name</p>
                    <p className="text-sm font-medium">{selectedUser.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-sm font-medium">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="text-sm font-medium">{selectedUser.phoneNumber || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Center</p>
                    <p className="text-sm font-medium">{selectedUser.center || '—'}</p>
                  </div>
                </div>
                {selectedUser.roleName === 'Student' && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <GraduationCap className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400">Semester</p>
                      <p className="text-sm font-medium">{selectedUser.semester || '—'}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Joined</p>
                    <p className="text-sm font-medium">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
              </div>

              {/* Status Change */}
              <div className="border-t border-slate-200 pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Change Status</label>
                <select
                  value={selectedUser.status}
                  onChange={(e) => handleStatusChange(selectedUser.userId, e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New User</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                {addErrors.fullName && <p className="text-xs text-red-500 mt-1">{addErrors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={newUser.roleId}
                  onChange={(e) => setNewUser({ ...newUser, roleId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={3}>Student</option>
                  <option value={2}>Tutor</option>
                  <option value={1}>Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Center</label>
                <select
                  value={newUser.center}
                  onChange={(e) => setNewUser({ ...newUser, center: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Center</option>
                  <option value="Malabe">Malabe</option>
                  <option value="Matara">Matara</option>
                  <option value="Jaffna">Jaffna</option>
                  <option value="Kandy">Kandy</option>
                </select>
              </div>
              {newUser.roleId === 3 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Semester</label>
                  <select
                    value={newUser.semester}
                    onChange={(e) => setNewUser({ ...newUser, semester: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Semester</option>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                  </select>
                </div>
              )}
              <button
                onClick={handleAddUser}
                disabled={addingUser}
                className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {addingUser ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}