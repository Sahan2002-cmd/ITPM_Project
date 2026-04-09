# 🔐 PeerLearn - Validation Rules Documentation

## Overview
This document outlines all validation rules implemented in the PeerLearn platform for Student, Tutor, and Admin user types. All validations are enforced on both Sign Up and Sign In forms with real-time feedback.

---

## 📋 Common Validations (All User Types)

### 1. **Email Address**
- **Required**: Yes
- **Format**: Must be a valid email (contains @ and domain)
- **Pattern**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Additional Rules**:
  - Students & Tutors: Must end with `@my.sliit.lk` or `@sliit.lk`
  - Admins: Any valid email format accepted (e.g., `@peerlearn.com`)
- **Error Messages**:
  - "Email is required"
  - "Invalid email format"
  - "Please use your SLIIT email (@my.sliit.lk or @sliit.lk)" *(Students/Tutors only)*

### 2. **Password**
- **Required**: Yes
- **Minimum Length**: 8 characters
- **Complexity Requirements**:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*(),.?":{}|<>)
- **Error Messages**:
  - "Password is required"
  - "Password must be at least 8 characters"
  - "Password must contain at least one uppercase letter"
  - "Password must contain at least one lowercase letter"
  - "Password must contain at least one number"
  - "Password must contain at least one special character"

### 3. **Confirm Password** *(Sign Up Only)*
- **Required**: Yes
- **Rule**: Must exactly match the Password field
- **Error Message**:
  - "Passwords do not match"

### 4. **Full Name** *(Sign Up Only)*
- **Required**: Yes
- **Minimum Length**: 3 characters
- **Pattern**: Only letters and spaces allowed
- **RegEx**: `/^[a-zA-Z\s]+$/`
- **Error Messages**:
  - "Full name is required"
  - "Name must be at least 3 characters"
  - "Name can only contain letters and spaces"

### 5. **Phone Number** *(Sign Up Only)*
- **Required**: Yes
- **Format**: Sri Lankan phone number
- **Pattern**: `/^(\+94|0)?[0-9]{9}$/`
- **Accepted Formats**:
  - `0712345678`
  - `+94712345678`
  - `712345678`
- **Error Messages**:
  - "Phone number is required"
  - "Invalid Sri Lankan phone number format"

---

## 🎓 Student-Specific Validations

### 1. **Institution**
- **Required**: Yes
- **Field Type**: Text input
- **Example**: "SLIIT", "University of Colombo"
- **Error Message**:
  - "Institution is required"

### 2. **Grade/Year**
- **Required**: Yes
- **Field Type**: Dropdown select
- **Options**:
  - Year 1
  - Year 2
  - Year 3
  - Year 4
- **Error Message**:
  - "Grade/Year is required"

---

## 👨‍🏫 Tutor-Specific Validations

### 1. **Subjects**
- **Required**: Yes
- **Field Type**: Text input (comma-separated)
- **Example**: "Mathematics, Physics, Programming"
- **Error Message**:
  - "At least one subject is required"

### 2. **Hourly Rate**
- **Required**: Yes
- **Field Type**: Number input
- **Unit**: Sri Lankan Rupees (Rs.)
- **Minimum**: Rs. 100
- **Maximum**: Rs. 5,000
- **Rules**:
  - Must be a valid number
  - Cannot be negative
  - Must be within range
- **Error Messages**:
  - "Hourly rate is required for tutors"
  - "Hourly rate must be a number"
  - "Hourly rate must be at least Rs. 100"
  - "Hourly rate cannot exceed Rs. 5,000"

### 3. **Years of Experience**
- **Required**: Yes
- **Field Type**: Number input
- **Minimum**: 0 years
- **Maximum**: 10 years
- **Rules**:
  - Must be a valid integer
  - Cannot be negative
  - Cannot exceed 10 years
- **Error Messages**:
  - "Experience is required for tutors"
  - "Experience must be a number"
  - "Experience cannot be negative"
  - "Experience cannot exceed 10 years"

---

## 👔 Admin-Specific Validations

### 1. **Employee ID**
- **Required**: Yes
- **Field Type**: Text input
- **Format**: `ADM-YYYY-XXX`
  - ADM: Prefix (fixed)
  - YYYY: 4-digit year
  - XXX: 3-digit sequence number
- **Pattern**: `/^ADM-\d{4}-\d{3}$/`
- **Example**: "ADM-2026-001"
- **Error Messages**:
  - "Employee ID is required for admins"
  - "Employee ID must be in format: ADM-YYYY-XXX"

### 2. **Department**
- **Required**: Yes
- **Field Type**: Dropdown select
- **Options**:
  - Operations
  - Academic Affairs
  - Student Services
  - IT Support
- **Error Message**:
  - "Department is required for admins"

---

## 🔄 Validation Behavior

### **Real-Time Validation**
- All fields validate onChange (as user types)
- Error messages appear immediately below fields
- Invalid fields show red border
- Valid fields show default border

### **Form Submission**
- All validations run on form submit
- Form submission blocked if any validation fails
- Error summary toast notification shown
- User can scroll to see all errors

### **Visual Feedback**
- ✅ **Valid State**: Default border, no message
- ❌ **Invalid State**: Red border + error message with AlertCircle icon
- 🔄 **Loading State**: Disabled inputs, spinner button

---

## 🎨 UI/UX Enhancements

### **Password Visibility Toggle**
- Eye icon button to show/hide password
- Works for both Password and Confirm Password fields
- State independent for each field

### **Role Selection**
- Three-button toggle for Student/Tutor/Admin
- Selected role highlighted with violet background
- Form fields dynamically change based on role

### **Demo Credentials Display** *(Sign In Only)*
- Visible at bottom of sign-in form
- Shows all three demo accounts
- Copy-friendly format

### **Google OAuth Integration**
- Google sign-in button with official branding
- Simulates OAuth flow (2-second delay)
- Auto-logs in as Student role (demo)

---

## 📝 Implementation Notes

### **Frontend Validation Functions**
```typescript
validateEmail(email: string): string | null
validatePassword(password: string): string | null
validatePhone(phone: string): string | null
validateFullName(name: string): string | null
validateHourlyRate(rate: string): string | null
validateExperience(exp: string): string | null
validateEmployeeId(id: string): string | null
```

### **Error Handling**
- All validation errors stored in array: `ValidationError[]`
- Each error has: `{ field: string, message: string }`
- Errors cleared on new form submission attempt
- Toast notifications for general feedback

### **Accessibility**
- All form fields have proper labels
- Error messages have semantic markup
- Icons have descriptive aria-labels
- Keyboard navigation fully supported

---

## 🚀 Future Enhancements

### **Planned Validations**
1. **Email Verification**: OTP sent to email on registration
2. **Phone Verification**: SMS OTP for phone number
3. **Password Strength Meter**: Visual indicator
4. **Duplicate Check**: Real-time username/email availability
5. **File Upload Validation**: Profile picture size/format
6. **CAPTCHA**: Bot prevention on sign-up

### **Backend Integration**
- Server-side validation matching frontend rules
- SQL injection prevention
- XSS attack prevention
- Rate limiting on authentication endpoints
- Brute force protection with lockout

---

## 📊 Validation Summary Table

| Field | Student | Tutor | Admin | Min | Max | Pattern |
|-------|---------|-------|-------|-----|-----|---------|
| Email | ✅ (@sliit) | ✅ (@sliit) | ✅ (any) | - | - | Email format |
| Password | ✅ | ✅ | ✅ | 8 chars | - | Complex |
| Confirm Password | ✅ | ✅ | ✅ | - | - | Match |
| Full Name | ✅ | ✅ | ✅ | 3 chars | - | Letters only |
| Phone | ✅ | ✅ | ✅ | - | - | LK format |
| Institution | ✅ | ❌ | ❌ | - | - | Required |
| Grade/Year | ✅ | ❌ | ❌ | - | - | Select |
| Subjects | ❌ | ✅ | ❌ | - | - | Required |
| Hourly Rate | ❌ | ✅ | ❌ | Rs. 100 | Rs. 5,000 | Number |
| Experience | ❌ | ✅ | ❌ | 0 years | 10 years | Integer |
| Employee ID | ❌ | ❌ | ✅ | - | - | ADM-YYYY-XXX |
| Department | ❌ | ❌ | ✅ | - | - | Select |

---

## 📞 Contact & Support

For questions about validation rules or to report issues:
- **Platform**: PeerLearn - SLIIT IT3040 Project
- **Email**: support@peerlearn.com
- **GitHub**: [Project Repository]

---

*Last Updated: March 29, 2026*
*Version: 1.0*
*Module: IT3040 - IT Project Management*
