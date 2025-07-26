# Plan Module Documentation

## Overview

The Plan module is a comprehensive farming activity management system that allows farmers to create, manage, and track their farming activities through an intuitive mobile-first interface. It integrates with the existing log feature and provides intelligent task generation based on crop stages and seasons.

## Features

### 1. Task Management
- **Create Tasks**: Add custom tasks via text or voice input
- **Task Types**: Irrigation, fertilization, pest control, weeding, harvesting, and custom tasks
- **Priority Levels**: Low, medium, and high priority tasks
- **Task Details**: Include notes, quantities, photos, and crop information
- **Checklist UI**: Mark tasks as completed with visual feedback

### 2. Plan Generation
- **Period-based Plans**: Daily, weekly, monthly, or custom period plans
- **Crop-specific Plans**: Generate plans based on crop type and growth stage
- **Seasonal Adjustments**: Auto-adjust plans based on weather and crop calendar
- **Smart Recommendations**: AI-powered task suggestions

### 3. Progress Tracking
- **Visual Progress**: Progress bars and completion statistics
- **Real-time Updates**: Live progress tracking
- **Performance Analytics**: Daily, weekly, and seasonal reports
- **Task History**: Complete activity log with timestamps

### 4. Integration Features
- **Log Integration**: Seamless integration with existing log feature
- **Weather Integration**: Adjust plans based on weather forecasts
- **Crop Management**: Link tasks to specific crops and growth stages
- **Photo Support**: Attach photos to tasks for documentation

### 5. Offline Capabilities
- **Offline Mode**: Work without internet connection
- **Data Sync**: Automatic sync when online
- **Local Storage**: Store data locally for offline access

### 6. Export & Reporting
- **PDF Export**: Generate detailed reports in PDF format
- **Excel Export**: Export data for analysis in spreadsheet applications
- **Custom Reports**: Generate reports for specific date ranges
- **Analytics Dashboard**: Visual representation of farming activities

## User Interface

### Mobile-First Design
- **Responsive Layout**: Optimized for mobile devices
- **Touch-friendly**: Large buttons and easy navigation
- **Quick Actions**: Fast access to common tasks
- **Intuitive Navigation**: Simple and clear menu structure

### Key Screens

#### 1. Today's Plan
- **Task List**: Shows all tasks for the current day
- **Progress Overview**: Visual progress indicator
- **Quick Actions**: Add task, voice input, export buttons
- **Filter Options**: Filter by task type, priority, or crop

#### 2. Plan Management
- **Plan List**: View all created plans
- **Plan Details**: Detailed view of plan tasks and progress
- **Create Plan**: Wizard to create new plans
- **Edit Plan**: Modify existing plans

#### 3. History & Reports
- **Activity History**: Complete log of all activities
- **Analytics**: Performance metrics and trends
- **Export Options**: Download reports in various formats
- **Search & Filter**: Find specific activities or time periods

## Technical Architecture

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  preferences JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Crops Table
```sql
CREATE TABLE crops (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  variety VARCHAR(255),
  planting_date DATE NOT NULL,
  expected_harvest_date DATE,
  current_stage VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Plans Table
```sql
CREATE TABLE plans (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  period ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  crop_id VARCHAR(255),
  stage VARCHAR(100),
  auto_adjust BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL
);
```

#### Tasks Table
```sql
CREATE TABLE tasks (
  id VARCHAR(255) PRIMARY KEY,
  plan_id VARCHAR(255),
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('irrigation', 'fertilization', 'pest-control', 'weeding', 'harvesting', 'custom') NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  quantity VARCHAR(100),
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  crop_id VARCHAR(255),
  stage VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL
);
```

### API Endpoints

#### Plans
- `GET /api/plans` - Get all plans for a user
- `POST /api/plans` - Create a new plan
- `GET /api/plans/:id` - Get a specific plan
- `PUT /api/plans/:id` - Update a plan
- `DELETE /api/plans/:id` - Delete a plan

#### Tasks
- `GET /api/tasks` - Get all tasks for a user (with filters)
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get a specific task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `PUT /api/tasks/:id/toggle` - Toggle task completion

#### Crops
- `GET /api/crops` - Get all crops for a user
- `POST /api/crops` - Create a new crop
- `PUT /api/crops/:id` - Update a crop
- `DELETE /api/crops/:id` - Delete a crop

#### Analytics
- `GET /api/analytics/tasks` - Get task analytics
- `GET /api/analytics/plans` - Get plan analytics
- `GET /api/analytics/crops` - Get crop analytics

#### Export
- `GET /api/export/tasks` - Export tasks as PDF/Excel
- `GET /api/export/plans` - Export plans as PDF/Excel

#### Sync
- `POST /api/sync/upload` - Upload offline data
- `GET /api/sync/download` - Download data for offline use

## Usage Examples

### Creating a Task
1. Navigate to the Plan module
2. Click "Add Activity" button
3. Fill in task details:
   - Task name (e.g., "Morning Irrigation")
   - Type (irrigation, fertilization, etc.)
   - Date and time
   - Crop and stage
   - Priority level
   - Notes and quantity
4. Click "Add Task"

### Creating a Plan
1. Click "Create Plan" button
2. Enter plan details:
   - Plan name (e.g., "Tomato Weekly Plan")
   - Period (daily, weekly, monthly, custom)
   - Start and end dates
   - Associated crop
3. System will generate tasks based on crop stage
4. Review and modify tasks as needed
5. Click "Create Plan"

### Voice Input
1. Click "Voice Input" button
2. Speak your task description
3. System will convert speech to text
4. Review and edit the generated task
5. Save the task

### Exporting Data
1. Navigate to Reports tab
2. Select date range and filters
3. Choose export format (PDF or Excel)
4. Click "Export" button
5. Download the generated report

## Integration Points

### Weather Module
- Adjust irrigation schedules based on rainfall forecasts
- Modify pest control timing based on weather conditions
- Reschedule outdoor activities during adverse weather

### Market Module
- Plan harvesting based on market prices
- Schedule activities around market days
- Track costs and returns for financial planning

### Diagnosis Module
- Create treatment plans based on disease diagnosis
- Schedule follow-up monitoring tasks
- Track treatment effectiveness

## Future Enhancements

### Planned Features
1. **AI-Powered Recommendations**: Advanced task suggestions based on historical data
2. **Weather Integration**: Real-time weather-based plan adjustments
3. **Community Features**: Share plans and best practices with other farmers
4. **Advanced Analytics**: Predictive analytics for crop management
5. **IoT Integration**: Connect with smart farming devices
6. **Multi-language Support**: Support for regional languages
7. **Offline Maps**: Field mapping and GPS tracking
8. **Voice Commands**: Advanced voice control features

### Technical Improvements
1. **Real-time Sync**: WebSocket-based real-time updates
2. **Push Notifications**: Task reminders and alerts
3. **Advanced Search**: Full-text search across all data
4. **Data Visualization**: Interactive charts and graphs
5. **API Rate Limiting**: Optimized API performance
6. **Caching**: Improved data loading performance

## Troubleshooting

### Common Issues

#### Task Not Saving
- Check internet connection
- Verify all required fields are filled
- Try refreshing the page

#### Voice Input Not Working
- Ensure microphone permissions are granted
- Check browser compatibility
- Try using text input as alternative

#### Export Not Working
- Verify sufficient storage space
- Check file permissions
- Try different export format

#### Sync Issues
- Check internet connection
- Verify server status
- Try manual sync from settings

### Performance Optimization
- Use filters to reduce data load
- Export large datasets in batches
- Clear browser cache regularly
- Update to latest app version

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

## Contributing

To contribute to the Plan module:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

This module is part of the Agrimitra project and follows the same licensing terms. 