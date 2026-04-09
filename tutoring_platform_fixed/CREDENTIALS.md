# PeerLearn Platform - Login Credentials

## 🔐 Demo Accounts

The application includes three hardcoded demo accounts for testing different user roles:

### Student Account
- **Email:** `student@peerlearn.com`
- **Password:** `student123`
- **Role:** Student
- **Access:** Student dashboard, browse tutors, book sessions, view recordings, chat, materials library

### Tutor Account
- **Email:** `tutor@peerlearn.com`
- **Password:** `tutor123`
- **Role:** Tutor
- **Access:** Tutor dashboard, registration, subject selection, availability management, upload recordings, file upload, session notes

### Admin Account
- **Email:** `admin@peerlearn.com`
- **Password:** `admin123`
- **Role:** Admin
- **Access:** Analytics panel, moderation tools, full platform oversight

## 🎨 Features

### Authentication
- **Secure Login Page** with animated UI and error handling
- **Session Persistence** using localStorage
- **Protected Routes** - redirects to login if not authenticated
- **Role-based Navigation** based on user account

### User Profile Management
- **Editable Profile** - Click on your profile picture in the sidebar to access
- **Avatar Upload** - Change your profile picture
- **Personal Information** - Edit name, email, phone, location, bio
- **Role-Specific Fields**:
  - **Students:** Institution, grade/year, major
  - **Tutors:** Hourly rate, experience, education, subjects
  - **Admins:** Employee ID, department
- **Account Settings** - Email and SMS notification preferences
- **Quick Stats** - View your activity metrics
- **Animated UI** - Smooth transitions and micro-interactions
- **Dark Mode Support** - Full theme compatibility

### Theme System
- **Light Mode** - Clean, professional interface
- **Dark Mode** - Easy on the eyes for extended use
- **Smooth Transitions** - Animated theme switching
- **Persistent Theme** - Saves user preference

### Enterprise-Level UI/UX
- **Smooth Animations** using Motion (Framer Motion)
- **Responsive Design** works on all screen sizes
- **Dark Mode Support** across all pages
- **Gradient Accents** for modern, premium feel
- **Micro-interactions** - hover effects, transitions
- **Loading States** - visual feedback for all actions
- **Error Handling** - beautiful, informative error messages
- **Success Notifications** - toast messages for confirmations

## 🚀 Quick Start

1. Open the application
2. You'll be automatically redirected to the login page
3. Use any of the demo credentials above
4. Explore the platform features
5. Click the Sun/Moon icon in the top bar to toggle themes
6. **Click your profile picture in the sidebar** to edit your profile
7. Click the logout icon (hover over profile) to log out

## 💡 Tips

### Login Page
- The **Quick Login** buttons on the login page auto-fill credentials
- Click **"Show All Credentials"** to see all available demo accounts
- Wrong credentials will show an animated error message
- All data is stored locally and persists across sessions

### Profile Management
- **Access Profile:** Click on your avatar at the bottom of the sidebar
- **Edit Mode:** Click the "Edit Profile" button in the top-right
- **Save Changes:** Click "Save Changes" after editing
- **Cancel Edits:** Click "Cancel" to discard changes
- **Avatar Upload:** Click the camera icon on your profile picture
- **Online Status:** Green dot indicates you're active
- **Hover Hints:** Hover over your profile to see "Click to edit profile" text
- Changes are saved to localStorage and persist across sessions

### Navigation
- Theme preference is saved and restored on next visit
- Profile changes are immediately reflected in the sidebar
- Use the back arrow on profile page to return to previous page