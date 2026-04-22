import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { registerUser, verifyOtp } from '../services/UserAPI';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Lock, User, Phone, MapPin, GraduationCap, Building2,
  Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'signin' | 'signup';
type UserRole = 'student' | 'tutor' | 'admin';

interface ValidationError {
  field: string;
  message: string;
}

interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: UserRole;
  // Student fields
  institution?: string;
  grade?: string;
  // Tutor fields
  subjects?: string;
  hourlyRate?: string;
  experience?: string;
  // Admin fields
  employeeId?: string;
  department?: string;
}

export default function Auth() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up State
  const [signUpData, setSignUpData] = useState<SignUpFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'student',
  });

  // OTP verification state
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Validation Functions
  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';

    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone) return 'Phone number is required';
    const phoneRegex = /^(\+94|0)?[0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return 'Invalid Sri Lankan phone number format';
    }
    return null;
  };

  const validateFullName = (name: string): string | null => {
    if (!name) return 'Full name is required';
    if (name.length < 3) return 'Name must be at least 3 characters';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name can only contain letters and spaces';
    return null;
  };

  const validateHourlyRate = (rate: string): string | null => {
    if (!rate) return 'Hourly rate is required for tutors';
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) return 'Hourly rate must be a number';
    if (numRate < 100) return 'Hourly rate must be at least Rs. 100';
    if (numRate > 5000) return 'Hourly rate cannot exceed Rs. 5,000';
    return null;
  };

  const validateExperience = (exp: string): string | null => {
    if (!exp) return 'Experience is required for tutors';
    const numExp = parseInt(exp);
    if (isNaN(numExp)) return 'Experience must be a number';
    if (numExp < 0) return 'Experience cannot be negative';
    if (numExp > 10) return 'Experience cannot exceed 10 years';
    return null;
  };

  const validateEmployeeId = (id: string): string | null => {
    if (!id) return 'Employee ID is required for admins';
    if (!/^ADM-\d{4}-\d{3}$/.test(id)) {
      return 'Employee ID must be in format: ADM-YYYY-XXX';
    }
    return null;
  };

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    const newErrors: ValidationError[] = [];

    const emailError = validateEmail(signInEmail);
    if (emailError) newErrors.push({ field: 'signInEmail', message: emailError });

    if (!signInPassword) newErrors.push({ field: 'signInPassword', message: 'Password is required' });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    // Call backend via AuthContext
    const result = await authLogin(signInEmail, signInPassword);

    if (result.success) {
      // Tutors with PendingApproval go to the waiting page, not the dashboard
      if (result.role === 'tutor' && result.status === 'PendingApproval') {
        toast.info('Account Pending Approval', {
          description: 'Your account is under review. You will be notified once approved.',
        });
        navigate('/tutor/pending-approval');
      } else {
        toast.success('Welcome back!', { description: 'You have successfully signed in.' });
        if (result.role === 'student') navigate('/student/dashboard');
        else if (result.role === 'tutor') navigate('/tutor/dashboard');
        else navigate('/admin/analytics');
      }
    } else {
      setErrors([{ field: 'general', message: result.error || 'Invalid email or password' }]);
    }

    setIsLoading(false);
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    const newErrors: ValidationError[] = [];

    // Common validations
    const nameError = validateFullName(signUpData.fullName);
    if (nameError) newErrors.push({ field: 'fullName', message: nameError });

    const emailError = validateEmail(signUpData.email);
    if (emailError) newErrors.push({ field: 'email', message: emailError });

    const passwordError = validatePassword(signUpData.password);
    if (passwordError) newErrors.push({ field: 'password', message: passwordError });

    if (signUpData.password !== signUpData.confirmPassword) {
      newErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }

    const phoneError = validatePhone(signUpData.phone);
    if (phoneError) newErrors.push({ field: 'phone', message: phoneError });

    // Role-specific validations
    if (signUpData.role === 'student') {
      if (!signUpData.institution) {
        newErrors.push({ field: 'institution', message: 'Institution is required' });
      }
      if (!signUpData.grade) {
        newErrors.push({ field: 'grade', message: 'Grade/Year is required' });
      }
    }

    if (signUpData.role === 'tutor') {
      if (!signUpData.subjects) {
        newErrors.push({ field: 'subjects', message: 'At least one subject is required' });
      }
      
      if (signUpData.hourlyRate) {
        const rateError = validateHourlyRate(signUpData.hourlyRate);
        if (rateError) newErrors.push({ field: 'hourlyRate', message: rateError });
      }

      if (signUpData.experience) {
        const expError = validateExperience(signUpData.experience);
        if (expError) newErrors.push({ field: 'experience', message: expError });
      }
    }

    if (signUpData.role === 'admin') {
      if (signUpData.employeeId) {
        const empIdError = validateEmployeeId(signUpData.employeeId);
        if (empIdError) newErrors.push({ field: 'employeeId', message: empIdError });
      }
      
      if (!signUpData.department) {
        newErrors.push({ field: 'department', message: 'Department is required for admins' });
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      toast.error('Validation Failed', { description: 'Please check all fields and try again.' });
      return;
    }

    // Map role name to roleId expected by backend
    const roleIdMap: Record<string, number> = { student: 3, tutor: 2, admin: 1 };

    try {
      const data = await registerUser({
        fullName: signUpData.fullName,
        email: signUpData.email,
        phoneNumber: signUpData.phone,
        password: signUpData.password,
        roleId: roleIdMap[signUpData.role],
      });

      if (data.StatusCode !== 1) {
        setErrors([{ field: 'general', message: data.Message || 'Registration failed.' }]);
        setIsLoading(false);
        return;
      }

      // OTP verification disabled — redirect to sign-in tab
      // setPendingEmail(signUpData.email);
      // setShowOtpStep(true);
      setSignInEmail(signUpData.email);
      setActiveTab('signin');
      if (signUpData.role === 'tutor') {
        toast.success('Tutor Sign-up Submitted!', {
          description: 'Your account is pending admin approval. Please sign in to check your status.',
        });
      } else {
        toast.success('Registration Successful!', {
          description: 'Your account is active. Please sign in.',
        });
      }
    } catch (err: any) {
      setErrors([{ field: 'general', message: err.message || 'Registration failed. Please try again.' }]);
    }

    setIsLoading(false);
  };

  // OTP verification handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    if (!otpCode.trim()) {
      setErrors([{ field: 'otp', message: 'Please enter the OTP code.' }]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await verifyOtp({ email: pendingEmail, otpCode: otpCode.trim() });

      if (data.StatusCode !== 1) {
        setErrors([{ field: 'otp', message: data.Message || 'Invalid or expired OTP.' }]);
        setIsLoading(false);
        return;
      }

      toast.success('Account Verified!', {
        description: 'Your account is active. Please sign in.',
      });

      // Reset and go to sign in
      setShowOtpStep(false);
      setOtpCode('');
      setSignInEmail(pendingEmail);
      setActiveTab('signin');
    } catch (err: any) {
      setErrors([{ field: 'otp', message: err.message || 'Verification failed. Please try again.' }]);
    }

    setIsLoading(false);
  };

  // Google OAuth Handler
  const handleGoogleOAuth = async () => {
    setIsLoading(true);
    toast.info('Google OAuth', {
      description: 'Redirecting to Google authentication...',
    });

    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo purposes, simulate Google OAuth as student
    // In production, this would use real Google OAuth token
    await authLogin('it23837676@my.sliit.lk', 'Student@123');
    toast.success('Signed in with Google!');
    navigate('/student/dashboard');
    setIsLoading(false);
  };

  const getError = (field: string) => {
    return errors.find(e => e.field === field)?.message;
  };

  const hasError = (field: string) => {
    return errors.some(e => e.field === field);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-6">
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all group"
      >
        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Branding */}
          <div className="p-12 bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex flex-col justify-center">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">PeerLearn</h1>
                  <p className="text-sm text-violet-200">SLIIT Tutoring Platform</p>
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-4">
                {activeTab === 'signin' ? 'Welcome Back!' : 'Join Our Community'}
              </h2>
              <p className="text-violet-100 text-lg">
                {activeTab === 'signin'
                  ? 'Sign in to continue your learning journey with peer tutors.'
                  : 'Create an account to start learning from the best peer tutors at SLIIT.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Expert Peer Tutors</h3>
                  <p className="text-sm text-violet-200">Learn from top-performing students</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Flexible Scheduling</h3>
                  <p className="text-sm text-violet-200">Book sessions at your convenience</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Secure & Verified</h3>
                  <p className="text-sm text-violet-200">All tutors are verified by admin</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Forms */}
          <div className="p-12">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8">
              <button
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'signin'
                    ? 'bg-white dark:bg-slate-900 text-violet-600 shadow-md'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-violet-600 shadow-md'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sign Up
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'signin' ? (
                <motion.form
                  key="signin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSignIn}
                  className="space-y-5"
                >
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                          hasError('signInEmail')
                            ? 'border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-violet-500/20'
                        } rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 transition-all`}
                        placeholder="your@email.com"
                        disabled={isLoading}
                      />
                    </div>
                    {hasError('signInEmail') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {getError('signInEmail')}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className={`w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border ${
                          hasError('signInPassword')
                            ? 'border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-violet-500/20'
                        } rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 transition-all`}
                        placeholder="Enter your password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {hasError('signInPassword') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {getError('signInPassword')}
                      </p>
                    )}
                  </div>

                  {/* General Error */}
                  {hasError('general') && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {getError('general')}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleOAuth}
                    disabled={isLoading}
                    className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </button>

                  {/* Demo Credentials */}
                  <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Demo Credentials:
                    </p>
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <p>Student: it23837676@my.sliit.lk / Student@123</p>
                      <p>Tutor: randeer.p@sliit.lk / Tutor@123</p>
                      <p>Admin: gamage.admin@sliit.lk / Admin@123</p>
                    </div>
                  </div>
                </motion.form>
              ) : showOtpStep ? (
                <motion.form
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-5"
                >
                  <div className="text-center mb-2">
                    <CheckCircle2 className="w-12 h-12 text-violet-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Verify Your Account</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Enter the 6-digit OTP sent to<br />
                      <span className="font-medium text-violet-600">{pendingEmail}</span>
                    </p>
                  </div>

                  {errors.some(e => e.field === 'otp') && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {getError('otp')}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      OTP Code
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-center text-xl tracking-widest font-semibold focus:outline-none focus:ring-4 focus:ring-violet-500/20"
                      placeholder="000000"
                      maxLength={6}
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Verify OTP
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowOtpStep(false); setOtpCode(''); setErrors([]); }}
                    className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    Back to Sign Up
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSignUp}
                  className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"
                >
                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      I am a...
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['student', 'tutor'] as UserRole[]).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSignUpData({ ...signUpData, role })}
                          className={`py-2 px-3 rounded-lg font-semibold text-sm capitalize transition-all ${
                            signUpData.role === role
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={signUpData.fullName}
                        onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                        className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                          hasError('fullName')
                            ? 'border-red-500'
                            : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                        placeholder="John Doe"
                        disabled={isLoading}
                      />
                    </div>
                    {hasError('fullName') && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getError('fullName')}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                          hasError('email')
                            ? 'border-red-500'
                            : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                        placeholder={
                          signUpData.role === 'admin'
                            ? 'admin@peerlearn.com'
                            : 'your@email.com'
                        }
                        disabled={isLoading}
                      />
                    </div>
                    {hasError('email') && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getError('email')}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        className={`w-full pl-11 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                          hasError('password')
                            ? 'border-red-500'
                            : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                        placeholder="Min. 8 characters"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {hasError('password') && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getError('password')}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                        className={`w-full pl-11 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                          hasError('confirmPassword')
                            ? 'border-red-500'
                            : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                        placeholder="Re-enter password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {hasError('confirmPassword') && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getError('confirmPassword')}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={signUpData.phone}
                        onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                        className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                          hasError('phone')
                            ? 'border-red-500'
                            : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                        placeholder="+94 71 234 5678"
                        disabled={isLoading}
                      />
                    </div>
                    {hasError('phone') && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getError('phone')}</p>
                    )}
                  </div>

                  {/* Student-specific fields */}
                  {signUpData.role === 'student' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Institution *
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            value={signUpData.institution || ''}
                            onChange={(e) => setSignUpData({ ...signUpData, institution: e.target.value })}
                            className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                              hasError('institution')
                                ? 'border-red-500'
                                : 'border-slate-200 dark:border-slate-700'
                            } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                            placeholder="SLIIT"
                            disabled={isLoading}
                          />
                        </div>
                        {hasError('institution') && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getError('institution')}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Grade/Year *
                        </label>
                        <select
                          value={signUpData.grade || ''}
                          onChange={(e) => setSignUpData({ ...signUpData, grade: e.target.value })}
                          className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                            hasError('grade')
                              ? 'border-red-500'
                              : 'border-slate-200 dark:border-slate-700'
                          } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                          disabled={isLoading}
                        >
                          <option value="">Select year</option>
                          <option value="Year 1">Year 1</option>
                          <option value="Year 2">Year 2</option>
                          <option value="Year 3">Year 3</option>
                          <option value="Year 4">Year 4</option>
                        </select>
                        {hasError('grade') && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getError('grade')}</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Tutor-specific fields */}
                  {signUpData.role === 'tutor' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Subjects *
                        </label>
                        <input
                          type="text"
                          value={signUpData.subjects || ''}
                          onChange={(e) => setSignUpData({ ...signUpData, subjects: e.target.value })}
                          className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                            hasError('subjects')
                              ? 'border-red-500'
                              : 'border-slate-200 dark:border-slate-700'
                          } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                          placeholder="Mathematics, Physics, Programming"
                          disabled={isLoading}
                        />
                        {hasError('subjects') && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getError('subjects')}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Hourly Rate (Rs.) *
                          </label>
                          <input
                            type="number"
                            value={signUpData.hourlyRate || ''}
                            onChange={(e) => setSignUpData({ ...signUpData, hourlyRate: e.target.value })}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                              hasError('hourlyRate')
                                ? 'border-red-500'
                                : 'border-slate-200 dark:border-slate-700'
                            } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                            placeholder="500"
                            disabled={isLoading}
                          />
                          {hasError('hourlyRate') && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getError('hourlyRate')}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Experience (years) *
                          </label>
                          <input
                            type="number"
                            value={signUpData.experience || ''}
                            onChange={(e) => setSignUpData({ ...signUpData, experience: e.target.value })}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                              hasError('experience')
                                ? 'border-red-500'
                                : 'border-slate-200 dark:border-slate-700'
                            } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                            placeholder="2"
                            disabled={isLoading}
                          />
                          {hasError('experience') && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getError('experience')}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Admin-specific fields */}
                  {signUpData.role === 'admin' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Employee ID *
                        </label>
                        <input
                          type="text"
                          value={signUpData.employeeId || ''}
                          onChange={(e) => setSignUpData({ ...signUpData, employeeId: e.target.value })}
                          className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                            hasError('employeeId')
                              ? 'border-red-500'
                              : 'border-slate-200 dark:border-slate-700'
                          } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                          placeholder="ADM-2026-001"
                          disabled={isLoading}
                        />
                        {hasError('employeeId') && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getError('employeeId')}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Department *
                        </label>
                        <select
                          value={signUpData.department || ''}
                          onChange={(e) => setSignUpData({ ...signUpData, department: e.target.value })}
                          className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                            hasError('department')
                              ? 'border-red-500'
                              : 'border-slate-200 dark:border-slate-700'
                          } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                          disabled={isLoading}
                        >
                          <option value="">Select department</option>
                          <option value="Operations">Operations</option>
                          <option value="Academic Affairs">Academic Affairs</option>
                          <option value="Student Services">Student Services</option>
                          <option value="IT Support">IT Support</option>
                        </select>
                        {hasError('department') && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getError('department')}</p>
                        )}
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                        Or sign up with
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleOAuth}
                    disabled={isLoading}
                    className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign up with Google
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}