# AttendEase - Technical Documentation

AttendEase is a high-fidelity, mobile-first Progressive Web App (PWA) designed for fitness studios and training centers. It handles the complete lifecycle of session scheduling, attendance tracking via QR codes, and a credit-based payment economy.

## 🔑 Key Business Logics

### 1. Attendance Conflict Detection
To prevent "ghost checking" or double-booking, the system implements a strict time-overlap check.
- **Logic**: When a trainee attempts to check into a class, the system queries the `attendance` ledger for that `traineeId` on the same `date`. 
- **Validation**: If a record exists for a class at the exact same `time`, the check-in is rejected with an `Attendance Conflict` warning.

### 2. Credit-Based Economy
The app operates on a "Prepaid Credit" model.
- **Deduction**: Every successful attendance (QR or Manual) triggers a `-1` decrement from the user's `credits` balance.
- **Verification**: If `credits <= 0`, the check-in fails immediately, prompting the user to visit the Shop.
- **Persistence**: Credit balances are synchronized across all views and saved to persistent storage.

### 3. Temporal Check-in Windows (Grace Period)
Prevents trainees from marking attendance hours or days in advance.
- **Window**: Check-in opens exactly **15 minutes** before the scheduled `class.time`.
- **Feedback**: Early attempts display a countdown or the specific time the window opens.

### 4. Staff Synchronicity & Unified Scheduling
Unlike standard apps where users only see their own data, AttendEase implements a **Global Staff View**.
- **Visibility**: Both Admins and Trainers see the full list of classes created by any staff member.
- **Collision Prevention**: A trainer cannot schedule a class that overlaps with an existing session at the same `location` and `time`.

## 🛡️ Security Implementation

### QR Secret Rotation
Instead of static URLs, the QR code encodes a complex JSON object containing:
- `cid`: The unique Class ID.
- `sec`: A randomly generated `qrSecret` (e.g., `AE-ADM-XJ92`).
- `t`: A creation timestamp to prevent replay attacks from old screenshots.

### Identity Recovery
The `Auth.tsx` component includes a "ShieldCheck" recovery flow.
- **Logic**: Users can reset passwords by providing a matching Email + Phone Number combination.
- **Login ID Protection**: Changing a profile email triggers a high-priority warning, as it updates the unique identifier used for authentication.

## 💳 Simulated Payment Gateway
A Stripe-inspired "Checkout" experience is implemented in `TraineeView.tsx`.
- **States**: Includes `PENDING`, `PROCESSING` (simulated latency), and `SUCCESS`.
- **Validation**: Mock regex validation for 16-digit card numbers and 3-digit CVVs.

## 🛠️ Tech Stack Attributes
- **Framework**: React 19 (Functional Components & Hooks).
- **Styling**: Tailwind CSS (Utility-first, mobile-responsive).
- **QR Engine**: `html5-qrcode` (Hardware-accelerated camera access).
- **Data Viz**: `recharts` (Administrative engagement trends).
- **Persistence**: `localStorage` with JSON serialization for offline-ready data.
