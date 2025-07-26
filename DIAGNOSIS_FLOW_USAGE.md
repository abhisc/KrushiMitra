# Crop Disease Diagnosis Flow Usage

## Overview
The `diagnoseCropDisease` function is a consolidated flow that handles both detailed and chat-based crop disease diagnosis. The system also includes a `diagnoseFollowUp` function for handling follow-up questions about diagnoses.

## Usage Examples

### 1. Detailed Diagnosis (Default)
```typescript
import { diagnoseCropDisease } from '@/ai/flows/diagnose-crop-disease';

// For detailed, structured output
const result = await diagnoseCropDisease({
  description: "My rice plants have yellow leaves with brown spots",
  photoDataUri: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  outputFormat: 'detailed' // default
});

// Result contains structured data:
// {
//   disease: "Bacterial Leaf Blight",
//   confidence: 0.85,
//   symptoms: "Yellow leaves with brown spots...",
//   cause: "Xanthomonas oryzae pv. oryzae...",
//   diseaseCycle: "The bacteria overwinter in...",
//   management: {
//     cultural: "Remove infected plants...",
//     chemical: "Apply copper-based fungicides...",
//     biological: "Use biocontrol agents..."
//   },
//   resistantVarieties: "IR64, IR72..."
// }
```

### 2. Chat-based Diagnosis
```typescript
// For simple chat output
const result = await diagnoseCropDisease({
  textDescription: "My rice plants have yellow leaves with brown spots",
  photoDataUri: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  outputFormat: 'chat'
});

// Result contains simple string:
// {
//   diagnosisResult: "Based on the symptoms, this appears to be Bacterial Leaf Blight..."
// }
```

### 3. Follow-up Questions
```typescript
import { diagnoseFollowUp } from '@/ai/flows/diagnose-crop-disease';

// Ask follow-up questions about a diagnosis
const followUpResult = await diagnoseFollowUp({
  previousDiagnosis: result, // The detailed diagnosis result
  followUpQuestion: "How long will it take for the treatment to show results?",
  photoDataUri: undefined // Optional additional photo
});

// Result contains:
// {
//   answer: "Based on your Bacterial Leaf Blight diagnosis, treatment typically shows results within 7-14 days...",
//   additionalRecommendations: "Consider monitoring closely for the first week..."
// }
```

## Input Parameters

### diagnoseCropDisease
- `photoDataUri` (optional): Base64 encoded image data URI
- `description` (optional): Text description of symptoms
- `textDescription` (optional): Alternative description field for chat input
- `outputFormat` (optional): 'detailed' | 'chat' (defaults to 'detailed')

### diagnoseFollowUp
- `previousDiagnosis` (required): The detailed diagnosis result object
- `followUpQuestion` (required): The farmer's follow-up question
- `photoDataUri` (optional): Additional photo for follow-up analysis

## Output Formats

### Detailed Format
Returns structured data with comprehensive disease information including management strategies.

### Chat Format
Returns a simple string suitable for chat interfaces.

### Follow-up Format
Returns an answer and optional additional recommendations based on the follow-up question.

## Benefits of Consolidation

1. **Single Source of Truth**: One flow handles both use cases
2. **External Prompt File**: Uses `prompts/diagnose-crop-disease.prompt` for detailed diagnosis
3. **Follow-up Support**: Uses `prompts/diagnose-follow-up.prompt` for follow-up questions
4. **Flexible Output**: Can switch between detailed and chat formats
5. **Maintainable**: Easier to maintain and update
6. **Type Safe**: Full TypeScript support with proper type guards
7. **Chat Loop**: Supports continuous conversation about diagnoses

## UI Integration

The diagnosis page now includes:
- **Initial Diagnosis**: Upload image/describe symptoms for disease identification
- **Detailed Results**: Comprehensive disease information with management strategies
- **Follow-up Chat**: Interactive chat interface for asking follow-up questions
- **Real-time Responses**: Immediate answers to follow-up questions
- **Chat History**: Persistent conversation thread during the session 