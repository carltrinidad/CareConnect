# CareConnect - Board & Care App

A mobile app connecting seniors, caregivers, board & care facilities, and volunteers.

## Features

### For Seniors/Family Members
- Browse and search board & care facilities
- Find private caregivers
- View facility details, amenities, and services
- Message facilities and caregivers directly

### For Caregivers
- Create professional profile with certifications
- Set hourly rates and availability
- Connect with families seeking care
- Apply for positions at facilities
- Message potential clients

### For Board & Care Facilities
- List your facility with photos and services
- Upload facility photos (from gallery or camera)
- Add and edit facility address
- Set hiring status to attract caregivers
- Hire caregivers from the app
- Manage inquiries from families
- Showcase amenities and availability
- Set volunteer hours for students/community members to sign up

### For Volunteers/Students
- Browse board & care facilities accepting volunteers
- View available volunteer time slots (days and hours)
- Sign up for volunteer shifts at facilities
- Track volunteer hours and completed sessions
- Filter facilities by day of week

## Account Signup

All users must sign up with:
- Full Name (required)
- Email Address (required)
- Phone Number (required)
- Password (required, min 6 characters)

## Tech Stack

- Expo SDK 53
- React Native 0.76.7
- NativeWind (TailwindCSS)
- React Query
- Zustand (state management)
- Expo Router (file-based routing)
- Hono (backend API)
- Prisma with SQLite (database)

## Screens

- **Onboarding**: Welcome screen, account type selection, and signup form with email/phone/password
- **Explore**: Browse facilities and caregivers with search
- **Find Care**: Dedicated caregiver search with filters
- **Volunteer**: Browse facilities with available volunteer hours, filter by day
- **My Signups**: Track signed up volunteer sessions and hours (volunteers only)
- **Messages**: View and manage conversations
- **Profile**: User profile with type-specific information
- **Edit Profile**: Edit basic info, photo, and type-specific fields (all users)
- **Edit Facility**: Upload photos, edit facility name/address/bio/capacity/residents/pricing, toggle hiring status, select amenities and services (facilities only). Changes persist to backend database and update listings in real-time.
- **Facility Detail**: Full facility information with volunteer hours, signup for volunteer shifts, call/message/share/favorite facility
- **Caregiver Detail**: Caregiver profile with hiring options
- **Chat**: Real-time messaging with contacts stored in backend database, messages sync across devices, call contact, view profile, clear chat, block contact
- **Settings**: Central settings hub for all account preferences
- **Notifications**: Manage notification preferences (messages, appointments, alerts)
- **Privacy & Security**: Control profile visibility, manage data, delete account
- **Help & Support**: FAQ, contact support via email or phone
