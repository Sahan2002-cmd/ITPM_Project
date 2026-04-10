import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { 
  Camera, Save, X, User, Mail, Phone, Calendar, 
  Edit2, CheckCircle2, AlertCircle, ArrowLeft, GraduationCap, MapPin, Key, RefreshCw, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserById, editUserProfile, uploadProfileImage, requestEditOtp, verifyEditOtp } from '../services/UserAPI';

interface ProfileData {
  fullName: string;
  email: string;
  phoneNumber: string;
  center: string;
  semester?: string;
  profileImage?: string;
}

export default function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpRequesting, setOtpRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    center: '',
    semester: '',
  });

  const [originalData, setOriginalData] = useState<ProfileData>(profileData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }
      try {
        const userData = await getUserById(user.userId);
        setProfileData({
          fullName: userData.fullName || userData.FullName || '',
          email: userData.email || userData.Email || '',
          phoneNumber: userData.phoneNumber || userData.PhoneNumber || '',
          center: userData.center || userData.Center || '',
          semester: userData.semester || userData.Semester || '',
          profileImage: userData.profileImage || userData.ProfileImage || '',
        });
        setProfileImagePreview(userData.profileImage || userData.ProfileImage || '');
        setOriginalData({
          fullName: userData.fullName || userData.FullName || '',
          email: userData.email || userData.Email || '',
          phoneNumber: userData.phoneNumber || userData.PhoneNumber || '',
          center: userData.center || userData.Center || '',
          semester: userData.semester || userData.Semester || '',
        });
      } catch (err) {
        console.error('Failed to fetch user data', err);
        toast.error('Error loading profile');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user?.userId]);

  const handleEditClick = async () => {
    setOtpRequesting(true);
    try {
      await requestEditOtp();
      setOtpSent(true);
      toast.success('OTP sent to your registered email', { description: 'Please enter the 6-digit code to verify.' });
      setIsEditing(true);
      setIsVerified(false);
      setOtpCode(''); // clear previous OTP
    } catch (err: any) {
      toast.error('Failed to send OTP', { description: err.message });
    } finally {
      setOtpRequesting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setErrors({ otp: 'Please enter the 6-digit OTP sent to your email.' });
      return;
    }
    setVerifying(true);
    setErrors({});
    try {
      await verifyEditOtp(otpCode);
      setIsVerified(true);
      toast.success('OTP verified! You can now edit your profile.');
    } catch (err: any) {
      toast.error('OTP verification failed', { description: err.message });
      setErrors({ otp: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpRequesting(true);
    try {
      await requestEditOtp();
      toast.success('OTP resent to your email');
    } catch (err: any) {
      toast.error('Failed to resend OTP', { description: err.message });
    } finally {
      setOtpRequesting(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image too large', { description: 'Maximum size is 2MB.' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type', { description: 'Please upload an image (JPG, PNG).' });
        return;
      }
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!isVerified) {
      toast.error('Please verify OTP first');
      return;
    }
    setIsSaving(true);
    setErrors({});

    try {
      // Upload profile image if changed
      if (profileImageFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(profileImageFile);
        });
        await uploadProfileImage(base64);
        toast.success('Profile photo updated');
      }

      // Update profile fields – send the already verified OTP
      const updatePayload: any = {
        userId: user?.userId,
        fullName: profileData.fullName,
        phoneNumber: profileData.phoneNumber,
        center: profileData.center,
        otpCode: otpCode,   // ← reuse the same OTP
      };
      if (user?.role === 'student') {
        updatePayload.semester = profileData.semester;
      }

      const result = await editUserProfile(updatePayload);
      // Update stored user data
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, ...result.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');

      setIsEditing(false);
      setIsVerified(false);
      setOtpCode('');
      setOtpSent(false);
      setProfileImageFile(null);
      setOriginalData(profileData);
    } catch (err: any) {
      toast.error('Update failed', { description: err.message });
      if (err.errors) setErrors(err.errors);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setProfileImagePreview(originalData.profileImage || '');
    setProfileImageFile(null);
    setOtpCode('');
    setOtpSent(false);
    setIsEditing(false);
    setIsVerified(false);
    setErrors({});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
              onClick={handleEditClick}
              disabled={otpRequesting}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30 disabled:opacity-50"
            >
              {otpRequesting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending OTP...</>
              ) : (
                <><Edit2 className="w-4 h-4" /> Edit Profile</>
              )}
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
              {!isVerified ? (
                <button
                  onClick={handleVerifyOtp}
                  disabled={verifying || !otpCode || otpCode.length !== 6}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {verifying ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Verify OTP</>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                >
                  {isSaving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Changes</>
                  )}
                </button>
              )}
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
                    src={profileImagePreview || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.fullName}`}
                    alt="Profile"
                    className="w-32 h-32 rounded-2xl object-cover ring-4 ring-slate-100 dark:ring-slate-800"
                  />
                  {isEditing && isVerified && (
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
                  {profileData.fullName}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{profileData.email}</p>
                
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800">
                  <GraduationCap className="w-4 h-4" />
                  {user?.role}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-sm">Sessions</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Hours</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">36.5</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Achievements</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">8</span>
                </div>
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
                        value={profileData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        disabled={!isEditing || !isVerified}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                      />
                    </div>
                    {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
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
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white opacity-60 cursor-not-allowed"
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
                        value={profileData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        disabled={!isEditing || !isVerified}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                      />
                    </div>
                    {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      SLIIT Center
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        value={profileData.center}
                        onChange={(e) => handleInputChange('center', e.target.value)}
                        disabled={!isEditing || !isVerified}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                      >
                        <option value="">Select Center</option>
                        <option value="Malabe">Malabe</option>
                        <option value="Matara">Matara</option>
                        <option value="Jaffna">Jaffna</option>
                        <option value="Kandy">Kandy</option>
                      </select>
                    </div>
                    {errors.center && <p className="mt-1 text-xs text-red-600">{errors.center}</p>}
                  </div>

                  {user?.role === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Semester
                      </label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                          value={profileData.semester || ''}
                          onChange={(e) => handleInputChange('semester', e.target.value)}
                          disabled={!isEditing || !isVerified}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                        >
                          <option value="">Select Semester</option>
                          <option value="1st Semester">1st Semester</option>
                          <option value="2nd Semester">2nd Semester</option>
                        </select>
                      </div>
                      {errors.semester && <p className="mt-1 text-xs text-red-600">{errors.semester}</p>}
                    </div>
                  )}
                </div>

                {/* OTP Input Field (visible only when editing and not yet verified) */}
                {isEditing && !isVerified && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        OTP Code <span className="text-red-500">*</span>
                        {otpSent && <span className="text-xs text-emerald-600 ml-2">(OTP sent to your email)</span>}
                      </label>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={otpRequesting}
                        className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Resend OTP
                      </button>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                      />
                    </div>
                    {errors.otp && <p className="mt-1 text-xs text-red-600">{errors.otp}</p>}
                    <p className="text-xs text-slate-400 mt-1">
                      Check your email for the OTP code. The code expires in 10 minutes.
                    </p>
                  </div>
                )}

                {isEditing && isVerified && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 inline mr-2" />
                      OTP verified. You can now edit and save your profile.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}