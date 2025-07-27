import { defineTool } from "@genkit-ai/ai";
import { z } from "zod";
import { auth, storage, analytics, googleProvider } from "@/firebaseStore/firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata
} from "firebase/storage";
import { logEvent } from "firebase/analytics";

export const firebaseTool = defineTool({
  name: "firebase_tool",
  description: "Firebase services tool for authentication, storage, and analytics",
  inputSchema: z.object({
    action: z.enum([
      "sign_in_popup",
      "sign_in_email",
      "sign_up_email", 
      "sign_out",
      "sign_in_anonymous",
      "get_current_user",
      "reset_password",
      "update_user_profile",
      "upload_file",
      "download_file",
      "delete_file",
      "list_files",
      "get_file_metadata",
      "track_event"
    ]),
    email: z.string().email().optional(),
    password: z.string().optional(),
    displayName: z.string().optional(),
    filePath: z.string().optional(),
    fileData: z.string().optional(), // Base64 encoded file data
    fileName: z.string().optional(),
    eventName: z.string().optional(),
    eventParameters: z.record(z.any()).optional(),
    resetEmail: z.string().email().optional()
  }),
  handler: async ({ action, email, password, displayName, filePath, fileData, fileName, eventName, eventParameters, resetEmail }) => {
    try {
      switch (action) {
        case "sign_in_popup":
          const result = await signInWithPopup(auth, googleProvider);
          return {
            success: true,
            user: {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL
            }
          };

        case "sign_in_email":
          if (!email || !password) {
            throw new Error("Email and password are required for email sign in");
          }
          const emailSignInResult = await signInWithEmailAndPassword(auth, email, password);
          return {
            success: true,
            user: {
              uid: emailSignInResult.user.uid,
              email: emailSignInResult.user.email,
              displayName: emailSignInResult.user.displayName
            }
          };

        case "sign_up_email":
          if (!email || !password) {
            throw new Error("Email and password are required for email sign up");
          }
          const signUpResult = await createUserWithEmailAndPassword(auth, email, password);
          return {
            success: true,
            user: {
              uid: signUpResult.user.uid,
              email: signUpResult.user.email
            }
          };

        case "sign_out":
          await signOut(auth);
          return { success: true, message: "User signed out successfully" };

        case "sign_in_anonymous":
          const anonymousResult = await signInAnonymously(auth);
          return {
            success: true,
            user: {
              uid: anonymousResult.user.uid,
              isAnonymous: anonymousResult.user.isAnonymous
            }
          };

        case "get_current_user":
          const currentUser = auth.currentUser;
          if (!currentUser) {
            return { success: false, message: "No user is currently signed in" };
          }
          return {
            success: true,
            user: {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              isAnonymous: currentUser.isAnonymous
            }
          };

        case "reset_password":
          if (!resetEmail) {
            throw new Error("Email is required for password reset");
          }
          await sendPasswordResetEmail(auth, resetEmail);
          return { success: true, message: "Password reset email sent successfully" };

        case "update_user_profile":
          if (!auth.currentUser) {
            throw new Error("No user is currently signed in");
          }
          const updateData: any = {};
          if (displayName) updateData.displayName = displayName;
          
          await updateProfile(auth.currentUser, updateData);
          return { success: true, message: "User profile updated successfully" };

        case "upload_file":
          if (!filePath || !fileData || !fileName) {
            throw new Error("filePath, fileData, and fileName are required for file upload");
          }
          
          // Convert base64 to blob
          const base64Response = await fetch(`data:application/octet-stream;base64,${fileData}`);
          const blob = await base64Response.blob();
          
          const storageRef = ref(storage, `${filePath}/${fileName}`);
          const uploadResult = await uploadBytes(storageRef, blob);
          const downloadURL = await getDownloadURL(uploadResult.ref);
          
          return {
            success: true,
            downloadURL,
            metadata: {
              fullPath: uploadResult.ref.fullPath,
              name: uploadResult.ref.name,
              size: uploadResult.metadata.size,
              contentType: uploadResult.metadata.contentType
            }
          };

        case "download_file":
          if (!filePath) {
            throw new Error("filePath is required for file download");
          }
          const downloadRef = ref(storage, filePath);
          const downloadURLResult = await getDownloadURL(downloadRef);
          return { success: true, downloadURL: downloadURLResult };

        case "delete_file":
          if (!filePath) {
            throw new Error("filePath is required for file deletion");
          }
          const deleteRef = ref(storage, filePath);
          await deleteObject(deleteRef);
          return { success: true, message: "File deleted successfully" };

        case "list_files":
          if (!filePath) {
            throw new Error("filePath is required for listing files");
          }
          const listRef = ref(storage, filePath);
          const listResult = await listAll(listRef);
          
          const files = await Promise.all(
            listResult.items.map(async (item) => {
              const metadata = await getMetadata(item);
              return {
                name: item.name,
                fullPath: item.fullPath,
                size: metadata.size,
                contentType: metadata.contentType,
                timeCreated: metadata.timeCreated
              };
            })
          );
          
          return { success: true, files };

        case "get_file_metadata":
          if (!filePath) {
            throw new Error("filePath is required for getting file metadata");
          }
          const metadataRef = ref(storage, filePath);
          const metadata = await getMetadata(metadataRef);
          return {
            success: true,
            metadata: {
              name: metadata.name,
              fullPath: metadata.fullPath,
              size: metadata.size,
              contentType: metadata.contentType,
              timeCreated: metadata.timeCreated,
              updated: metadata.updated
            }
          };

        case "track_event":
          if (!eventName) {
            throw new Error("eventName is required for tracking events");
          }
          if (analytics) {
            logEvent(analytics, eventName, eventParameters || {});
            return { success: true, message: "Event tracked successfully" };
          } else {
            return { success: false, message: "Analytics not available" };
          }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}); 