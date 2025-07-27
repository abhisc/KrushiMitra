import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { UserService, UserProfile } from '@/firebaseStore/services/user-service';

const inputSchema = z.object({
  userId: z.string().describe('The user ID (uid) to retrieve additional information for'),
});

const outputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
  message: z.string().describe('Success or error message'),
  additionalInfo: z.object({
    age: z.number().optional(),
    gender: z.enum(['All', 'Male', 'Female', 'Other']).optional(),
    location: z.object({
      city: z.string().optional(),
      state: z.string().optional(),
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }).optional(),
    }).optional(),
    isStudent: z.enum(['Yes', 'No']).optional(),
    minority: z.enum(['Yes', 'No']).optional(),
    disability: z.enum(['Yes', 'No']).optional(),
    caste: z.enum(['All', 'General', 'SC', 'ST', 'OBC']).optional(),
    residence: z.enum(['Both', 'Urban', 'Rural']).optional(),
  }).nullable().describe('User additional information if available'),
  userProfile: z.object({
    uid: z.string(),
    displayName: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    photoURL: z.string().nullable().optional(),
  }).optional().describe('Basic user profile information'),
});

export const retrieveAdditionalInfoOfUser = ai.defineTool(
  {
    name: 'retrieve_additional_info_of_user',
    description: 'Retrieve additional information of a user including age, gender, location, student status, minority status, disability, caste, and residence type',
    inputSchema,
    outputSchema,
  },
  async ({ userId }) => {
    try {
      const userService = new UserService();
      const userProfile = await userService.getUserProfile(userId);

      if (!userProfile) {
        return {
          success: false,
          message: 'User profile not found',
          additionalInfo: null,
        };
      }

      // Extract additional information fields
      const additionalInfo = {
        age: userProfile.age,
        gender: userProfile.gender,
        location: userProfile.location,
        isStudent: userProfile.isStudent,
        minority: userProfile.minority,
        disability: userProfile.disability,
        caste: userProfile.caste,
        residence: userProfile.residence,
      };

      // Check if user has any additional information
      const hasAdditionalInfo = Object.values(additionalInfo).some(
        (value) => value !== undefined && value !== null
      );

      return {
        success: true,
        message: hasAdditionalInfo
          ? 'Additional information retrieved successfully'
          : 'No additional information available for this user',
        additionalInfo: hasAdditionalInfo ? additionalInfo : null,
        userProfile: {
          uid: userProfile.uid,
          displayName: userProfile.displayName,
          email: userProfile.email,
          photoURL: userProfile.photoURL,
        },
      };
    } catch (error) {
      console.error('Error retrieving user additional information:', error);
      return {
        success: false,
        message: `Error retrieving user additional information: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        additionalInfo: null,
      };
    }
  }
);

export type RetrieveAdditionalInfoInput = z.infer<typeof inputSchema>;
export type RetrieveAdditionalInfoOutput = z.infer<typeof outputSchema>; 