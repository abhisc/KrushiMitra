# Additional User Information Feature

## Overview
This feature allows users to provide additional personal information to receive personalized recommendations for weather, government schemes, and other services.

## Features

### 1. Dismissible Information Card
- Shows a dismissible card prompting users to fill additional information
- Card appears when user doesn't have additional info filled
- Can be dismissed and will remember the dismissal state
- Option to fill again from profile page

### 2. Comprehensive Information Form
- **Personal Information**: Age, Gender
- **Location Information**: City, State (with GPS location support)
- **Eligibility Information**: 
  - Student Status (Yes/No)
  - Minority Community (Yes/No)
  - Disability Status (Yes/No)
  - Caste Category (General/SC/ST/OBC)
  - Residence Type (Urban/Rural/Both)

### 3. Firestore Integration
- All additional information is stored in Firestore "users" collection
- Data is linked to user's UID
- Automatic profile creation on signup
- Real-time profile updates

### 4. Profile Display
- Shows all filled additional information in profile page
- Organized display with proper labels
- Option to update information anytime

## Technical Implementation

### Files Created/Modified:

1. **`src/lib/firebase.ts`** - Added Firestore initialization
2. **`src/lib/user-service.ts`** - New service for Firestore operations
3. **`src/contexts/auth-context.tsx`** - Updated to include user profile management
4. **`src/components/additional-info-card.tsx`** - Dismissible prompt card
5. **`src/components/additional-info-form.tsx`** - Comprehensive form modal
6. **`src/hooks/use-additional-info.ts`** - Hook for card state management
7. **`src/app/profile/page.tsx`** - Updated to show additional info

### Data Structure

```typescript
interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  // Additional user details
  isStudent?: 'Yes' | 'No';
  minority?: 'Yes' | 'No';
  disability?: 'Yes' | 'No';
  caste?: 'All' | 'General' | 'SC' | 'ST' | 'OBC';
  residence?: 'Both' | 'Urban' | 'Rural';
  age?: number;
  gender?: 'All' | 'Male' | 'Female' | 'Other';
  location?: {
    city?: string;
    state?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage

### For Users:
1. After signing up, users will see a dismissible card prompting for additional information
2. Click "Fill Now" to open the comprehensive form
3. Fill in the information (all fields are optional)
4. Save the information
5. View and update information anytime from the profile page

### For Developers:
1. The feature automatically creates user profiles in Firestore on signup
2. Use `UserService` class for all Firestore operations
3. Access user profile data through the auth context: `const { userProfile } = useAuth()`
4. The additional information can be used for filtering government schemes and providing personalized weather data

## Benefits

1. **Personalized Experience**: Users get tailored recommendations based on their profile
2. **Government Scheme Filtering**: Additional info helps filter relevant government schemes
3. **Weather Services**: Location data enables location-specific weather information
4. **Optional**: All fields are optional, respecting user privacy
5. **Persistent**: Information is stored securely in Firestore
6. **User-Friendly**: Clean UI with proper validation and feedback

## Future Enhancements

1. **Geocoding Integration**: Add proper reverse geocoding service
2. **Data Validation**: Enhanced client-side validation
3. **Privacy Controls**: Allow users to control what information is shared
4. **Analytics**: Track feature usage for improvements
5. **Export/Import**: Allow users to export their data 