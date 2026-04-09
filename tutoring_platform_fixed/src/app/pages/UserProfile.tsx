import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { 
  Camera, Save, X, User, Mail, Phone, MapPin, Calendar, 
  Briefcase, Award, BookOpen, Clock, DollarSign, Edit2,
  CheckCircle2, AlertCircle, ArrowLeft, Shield, GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  dateOfBirth: string;
  // Role-specific fields
  institution?: string;
  grade?: string;
  major?: string;
  // Tutor-specific
  hourlyRate?: string;
  experience?: string;
  education?: string;
  subjects?: string[];
  // Admin-specific
  department?: string;
  employeeId?: string;
}

export default function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    bio: user?.role === 'student' 
      ? 'Passionate learner exploring various subjects and seeking knowledge in mathematics and programming.'
      : user?.role === 'tutor'
      ? 'Experienced educator dedicated to helping students achieve their academic goals through personalized instruction.'
      : 'Platform administrator ensuring smooth operations and excellent user experience.',
    location: 'San Francisco, CA',
    dateOfBirth: '1998-05-15',
    // Student fields
    institution: user?.role === 'student' ? 'Stanford University' : undefined,
    grade: user?.role === 'student' ? 'Junior' : undefined,
    major: user?.role === 'student' ? 'Computer Science' : undefined,
    // Tutor fields
    hourlyRate: user?.role === 'tutor' ? '45' : undefined,
    experience: user?.role === 'tutor' ? '5' : undefined,
    education: user?.role === 'tutor' ? 'Ph.D. in Mathematics, MIT' : undefined,
    subjects: user?.role === 'tutor' ? ['Mathematics', 'Physics', 'Programming'] : undefined,
    // Admin fields
    department: user?.role === 'admin' ? 'Operations' : undefined,
    employeeId: user?.role === 'admin' ? 'ADM-2024-001' : undefined,
  });

  const [originalData, setOriginalData] = useState(profileData);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setOriginalData(profileData);
    setIsEditing(false);
    setIsSaving(false);
    
    toast.success('Profile updated successfully!', {
      description: 'Your changes have been saved.',
      duration: 3000,
    });
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setAvatarPreview(user?.avatar || '');
    setIsEditing(false);
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'student': return <GraduationCap className="w-5 h-5" />;
      case 'tutor': return <BookOpen className="w-5 h-5" />;
      case 'admin': return <Shield className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'student': return 'from-violet-600 to-indigo-600';
      case 'tutor': return 'from-emerald-600 to-teal-600';
      case 'admin': return 'from-rose-600 to-pink-600';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'student': return 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800';
      case 'tutor': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'admin': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default: return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal information</p>
            </div>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Avatar Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-32 h-32 rounded-2xl object-cover ring-4 ring-slate-100 dark:ring-slate-800"
                  />
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 p-2 bg-violet-600 text-white rounded-xl cursor-pointer hover:bg-violet-700 transition-colors shadow-lg">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {profileData.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{profileData.email}</p>
                
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border capitalize ${getRoleBadgeColor()}`}>
                  {getRoleIcon()}
                  {user?.role}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                {user?.role === 'student' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm">Sessions</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Hours</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">36.5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Award className="w-4 h-4" />
                        <span className="text-sm">Achievements</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">8</span>
                    </div>
                  </>
                )}
                {user?.role === 'tutor' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm">Students</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">47</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Sessions</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">142</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Award className="w-4 h-4" />
                        <span className="text-sm">Rating</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">4.9</span>
                    </div>
                  </>
                )}
                {user?.role === 'admin' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm">Total Users</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">1,284</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Sessions</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">3,567</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Award className="w-4 h-4" />
                        <span className="text-sm">Platform Rating</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">4.8</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Profile Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Role-Specific Fields */}
              {user?.role === 'student' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Academic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Institution
                      </label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={profileData.institution}
                          onChange={(e) => handleInputChange('institution', e.target.value)}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Grade/Year
                      </label>
                      <input
                        type="text"
                        value={profileData.grade}
                        onChange={(e) => handleInputChange('grade', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Major/Field of Study
                      </label>
                      <input
                        type="text"
                        value={profileData.major}
                        onChange={(e) => handleInputChange('major', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {user?.role === 'tutor' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Professional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Hourly Rate ($)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          value={profileData.hourlyRate}
                          onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Years of Experience
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          value={profileData.experience}
                          onChange={(e) => handleInputChange('experience', e.target.value)}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Education Background
                      </label>
                      <input
                        type="text"
                        value={profileData.education}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {user?.role === 'admin' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Administrative Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Employee ID
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={profileData.employeeId}
                          onChange={(e) => handleInputChange('employeeId', e.target.value)}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Department
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={profileData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Settings */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Account Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Email Notifications</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Receive updates about your sessions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">SMS Notifications</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Get session reminders via text</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
