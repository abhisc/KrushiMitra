# Firebase and Firestore Tools for KrushiMitra AI

This document provides comprehensive documentation for the Firebase and Firestore tools integrated into the KrushiMitra AI system.

## Overview

The Firebase tools provide comprehensive access to Firebase services including:
- **Firebase Tool**: Authentication, Storage, and Analytics
- **Firestore Tool**: Database operations, queries, and batch operations
- **Farm Planning Tool**: Specialized farm task and plan management
- **Firebase Admin Tool**: Administrative operations and system maintenance

## Tools Overview

### 1. Firebase Tool (`firebase-tool.ts`)

Provides access to Firebase core services including authentication, storage, and analytics.

**Key Features:**
- User authentication (Google, Email, Anonymous)
- File upload/download/management
- Analytics event tracking
- User profile management

**Available Actions:**
- `sign_in_popup` - Google sign-in with popup
- `sign_in_email` - Email/password authentication
- `sign_up_email` - Create new user account
- `sign_out` - Sign out current user
- `sign_in_anonymous` - Anonymous authentication
- `get_current_user` - Get current user information
- `reset_password` - Send password reset email
- `update_user_profile` - Update user profile
- `upload_file` - Upload file to Firebase Storage
- `download_file` - Get download URL for file
- `delete_file` - Delete file from storage
- `list_files` - List files in directory
- `get_file_metadata` - Get file metadata
- `track_event` - Track analytics events

### 2. Firestore Tool (`firestore-tool.ts`)

Provides comprehensive Firestore database operations.

**Key Features:**
- CRUD operations (Create, Read, Update, Delete)
- Complex queries with filters and ordering
- Batch operations for multiple documents
- Transactions for data consistency
- Real-time listeners

**Available Actions:**
- `create_document` - Create new document
- `get_document` - Retrieve document by ID
- `update_document` - Update existing document
- `delete_document` - Delete document
- `get_collection` - Get all documents in collection
- `query_documents` - Query with filters and ordering
- `batch_write` - Perform batch operations
- `transaction` - Execute transactions
- `listen_to_document` - Real-time document listener
- `listen_to_collection` - Real-time collection listener
- `get_or_create` - Get document or create if not exists
- `upsert_document` - Update or create document
- `increment_field` - Increment numeric field
- `array_operations` - Array union/remove operations

### 3. Farm Planning Tool (`farm-planning-tool.ts`)

Specialized tool for managing farm tasks, plans, and schedules.

**Key Features:**
- Farm task management
- Crop-specific planning
- Scheduled task creation
- Progress tracking
- Task statistics and reporting

**Available Actions:**
- `create_task` - Create new farm task
- `get_task` - Get task details
- `update_task` - Update task
- `delete_task` - Delete task
- `get_user_tasks` - Get all user tasks
- `get_tasks_by_date` - Get tasks for specific date
- `get_tasks_by_crop` - Get tasks for specific crop
- `mark_task_completed` - Mark task as completed
- `create_plan` - Create farm plan
- `get_plan` - Get plan details
- `update_plan` - Update plan
- `delete_plan` - Delete plan
- `get_user_plans` - Get all user plans
- `create_scheduled_task` - Create recurring task
- `get_scheduled_task` - Get scheduled task details
- `update_scheduled_task` - Update scheduled task
- `delete_scheduled_task` - Delete scheduled task
- `get_user_scheduled_tasks` - Get user's scheduled tasks
- `get_today_tasks` - Get today's tasks
- `get_pending_tasks` - Get pending tasks
- `get_completed_tasks` - Get completed tasks
- `get_task_statistics` - Get task statistics

### 4. Firebase Admin Tool (`firebase-admin-tool.ts`)

Administrative operations for system maintenance and data management.

**Key Features:**
- Collection statistics and analysis
- Data backup and restoration
- Data cleanup and migration
- System health monitoring
- Performance optimization

**Available Actions:**
- `get_collection_stats` - Get collection statistics
- `backup_collection` - Backup collection data
- `cleanup_old_data` - Remove old data
- `migrate_data` - Migrate data with rules
- `bulk_update` - Bulk update documents
- `data_validation` - Validate data integrity
- `get_system_health` - Check system health
- `export_collection` - Export collection data
- `import_collection` - Import collection data
- `optimize_queries` - Optimize database queries
- `manage_indexes` - Manage database indexes
- `audit_user_activity` - Audit user activities
- `generate_reports` - Generate system reports

## Usage Examples

### Authentication Example
```typescript
// Sign in with Google
const result = await firebaseTool.handler({
  action: "sign_in_popup"
});

// Get current user
const user = await firebaseTool.handler({
  action: "get_current_user"
});
```

### Firestore Example
```typescript
// Create a document
const createResult = await firestoreTool.handler({
  action: "create_document",
  collectionName: "users",
  documentId: "user123",
  data: {
    name: "John Doe",
    email: "john@example.com",
    role: "farmer"
  }
});

// Query documents
const queryResult = await firestoreTool.handler({
  action: "query_documents",
  collectionName: "farm_tasks",
  queryConstraints: [
    { type: "where", field: "userId", operator: "==", value: "user123" },
    { type: "where", field: "completed", operator: "==", value: false },
    { type: "orderBy", field: "date", direction: "asc" }
  ]
});
```

### Farm Planning Example
```typescript
// Create a farm task
const taskResult = await farmPlanningTool.handler({
  action: "create_task",
  userId: "user123",
  taskData: {
    name: "Water tomato plants",
    type: "irrigation",
    date: "2024-01-15",
    time: "06:00",
    crop: "tomato",
    priority: "high",
    notes: "Early morning watering for best results"
  }
});

// Get today's tasks
const todayTasks = await farmPlanningTool.handler({
  action: "get_today_tasks",
  userId: "user123"
});
```

### Admin Example
```typescript
// Get collection statistics
const stats = await firebaseAdminTool.handler({
  action: "get_collection_stats",
  collectionName: "farm_tasks"
});

// Backup collection
const backup = await firebaseAdminTool.handler({
  action: "backup_collection",
  collectionName: "farm_tasks"
});
```

## Data Models

### Farm Task Model
```typescript
interface FarmTask {
  id: string;
  name: string;
  type: 'irrigation' | 'fertilization' | 'pest-control' | 'weeding' | 'harvesting' | 'custom';
  date: Date;
  time: string;
  completed: boolean;
  notes?: string;
  quantity?: string;
  photos?: string[];
  priority: 'low' | 'medium' | 'high';
  crop?: string;
  stage?: string;
  scheduleId?: string;
  isRecurring?: boolean;
  originalDate?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Farm Plan Model
```typescript
interface FarmPlan {
  id: string;
  name: string;
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate: Date;
  tasks: string[]; // Task IDs
  crop: string;
  stage: string;
  autoAdjust: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Scheduled Task Model
```typescript
interface ScheduledTask {
  id: string;
  name: string;
  type: 'irrigation' | 'fertilization' | 'pest-control' | 'weeding' | 'harvesting' | 'custom';
  startDate: Date;
  scheduleType: 'daily' | 'every-few-days' | 'custom';
  interval: number;
  totalDays: number;
  totalTasks: number;
  completedTasks: number;
  notes?: string;
  quantity?: string;
  priority: 'low' | 'medium' | 'high';
  crop?: string;
  stage?: string;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Security Considerations

1. **Authentication**: All tools require proper user authentication
2. **Authorization**: User-specific data is filtered by userId
3. **Input Validation**: All inputs are validated using Zod schemas
4. **Error Handling**: Comprehensive error handling and logging
5. **Rate Limiting**: Consider implementing rate limiting for API calls

## Performance Optimization

1. **Indexing**: Create appropriate Firestore indexes for queries
2. **Pagination**: Use limit and cursor-based pagination for large datasets
3. **Batch Operations**: Use batch operations for multiple document updates
4. **Caching**: Implement caching for frequently accessed data
5. **Query Optimization**: Optimize queries to minimize read operations

## Integration with AI System

The tools are designed to integrate seamlessly with the Genkit AI system:

1. **Tool Registration**: Tools are registered with Genkit for AI access
2. **Schema Validation**: Input/output schemas ensure data integrity
3. **Error Handling**: Proper error responses for AI processing
4. **Async Operations**: All operations are async for non-blocking AI interactions

## Future Enhancements

1. **Real-time Sync**: Enhanced real-time synchronization capabilities
2. **Advanced Analytics**: More sophisticated analytics and reporting
3. **Machine Learning**: Integration with ML models for predictive analytics
4. **Mobile Optimization**: Enhanced mobile-specific features
5. **Multi-language Support**: Internationalization support

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure Firebase configuration is correct
2. **Permission Denied**: Check Firestore security rules
3. **Query Performance**: Optimize queries and add appropriate indexes
4. **Storage Limits**: Monitor Firebase usage and quotas

### Debug Mode

Enable debug logging by setting environment variables:
```bash
DEBUG_FIREBASE=true
DEBUG_FIRESTORE=true
```

## Support

For issues and questions:
1. Check Firebase console for errors
2. Review Firestore security rules
3. Verify Firebase configuration
4. Check network connectivity
5. Review error logs in browser console 