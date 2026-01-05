# AttendEase - Technical Documentation

AttendEase is a high-fidelity, mobile-first Progressive Web App (PWA) for fitness studios.

## 🔑 Key Business Logics

### 1. Credit Economy & Attendance
- **Deduction**: 1 Credit is deducted upon booking (Trainee-initiated) or when a Trainer/Admin marks a Trainee as "Present".
- **Refund**: 1 Credit is refunded only if a cancellation (by Trainee) or an "Absent" toggle (by Staff) occurs **>30 minutes** before the session start time.
- **Credit Adjustment**: Admins can manually add or subtract credits for Trainees via the User list in AdminView.
- **Purchase**: Trainees buy credits via the Shop. Payments are simulated but result in immediate credit balance updates.

### 2. Booking & Cancellation (The 30-Minute Rule)
- **Trainee Removal**: Trainees can cancel any booking via the **SESSIONS** tab or the **ACTIVITY (Logbook)**.
- **Refund Eligibility**: 
  - If `(Session Start Time - Cancellation Time) > 30 minutes`: 1 Credit is automatically refunded.
  - If `(Session Start Time - Cancellation Time) <= 30 minutes`: The booking is "Locked". Trainees cannot cancel. They must contact the studio if they cannot attend.
- **Booking Window**: Sessions remain available for booking until 30 minutes after they have started (grace period for late arrivals).

### 3. Advance Sessions
- **Visibility**: Trainees see "Today's Sessions" and "Advance Bookings" for future dates.
- **History**: The Logbook shows all check-ins and upcoming bookings. Upcoming bookings with >30m lead time show a "Cancel" option.

### 4. Identity & Data Integrity
- **Email Guard**: Modifying the email field in any profile triggers an inline warning. Email serves as the unique login identifier.
- **Duplicate Rules**:
  - **Sessions**: Prevents sessions with the same Name+Date+Time. Displays inline error message if duplicate is detected.
  - **Packages**: Prevents credit packages with duplicate names (case-insensitive, whitespace-trimmed). Displays inline error message during creation or editing.
  - **Bookings**: Prevents trainees from booking overlapping sessions at the same Date+Time.

### 5. Staff Intelligence
- **Staff Override**: Trainers and Admins can remove attendance at any time regardless of the 30-minute rule (for administrative corrections).

## 🛠️ Technical Implementation
- **Mobile-First**: Optimized for 448px width with overflow prevention on modals.
- **UI Compactness**: Low-padding layouts and optimized typography.
- **Persistence**: All data is persisted in LocalStorage.
- **QR Code Features**:
  - **Camera Scanning**: Trainees can scan QR codes using their device camera for instant check-in.
  - **Image Upload**: Trainees can upload QR code images from their gallery for verification.
  - **Proper Error Handling**: Clear inline error messages when QR codes are invalid or not found.
- **User Experience Enhancements**:
  - **Inline Modals**: All confirmations (e.g., cancellations) use clean inline modals instead of browser alerts.
  - **No Screen Overflow**: Fixed positioning and z-index management prevent UI overflow issues on mobile devices (tested on iPhone 13 Pro).