import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface Task {
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
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate: Date;
  tasks: Task[];
  crop: string;
  stage: string;
  autoAdjust: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Crop {
  id: string;
  name: string;
  variety?: string;
  plantingDate: Date;
  expectedHarvestDate: Date;
  currentStage: string;
  userId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  preferences: {
    notifications: boolean;
    language: string;
    units: 'metric' | 'imperial';
  };
}

// Database structure suggestions
export const DATABASE_SCHEMA = {
  users: `
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
  `,
  
  crops: `
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
  `,
  
  plans: `
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
  `,
  
  tasks: `
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
  `,
  
  task_photos: `
    CREATE TABLE task_photos (
      id VARCHAR(255) PRIMARY KEY,
      task_id VARCHAR(255) NOT NULL,
      photo_url VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `,
  
  reminders: `
    CREATE TABLE reminders (
      id VARCHAR(255) PRIMARY KEY,
      task_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      reminder_time TIMESTAMP NOT NULL,
      sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `
};

// API Endpoints suggestions
export const API_ENDPOINTS = {
  // Plans
  'GET /api/plans': 'Get all plans for a user',
  'POST /api/plans': 'Create a new plan',
  'GET /api/plans/:id': 'Get a specific plan',
  'PUT /api/plans/:id': 'Update a plan',
  'DELETE /api/plans/:id': 'Delete a plan',
  
  // Tasks
  'GET /api/tasks': 'Get all tasks for a user (with filters)',
  'POST /api/tasks': 'Create a new task',
  'GET /api/tasks/:id': 'Get a specific task',
  'PUT /api/tasks/:id': 'Update a task',
  'DELETE /api/tasks/:id': 'Delete a task',
  'PUT /api/tasks/:id/toggle': 'Toggle task completion',
  
  // Crops
  'GET /api/crops': 'Get all crops for a user',
  'POST /api/crops': 'Create a new crop',
  'PUT /api/crops/:id': 'Update a crop',
  'DELETE /api/crops/:id': 'Delete a crop',
  
  // Analytics
  'GET /api/analytics/tasks': 'Get task analytics',
  'GET /api/analytics/plans': 'Get plan analytics',
  'GET /api/analytics/crops': 'Get crop analytics',
  
  // Export
  'GET /api/export/tasks': 'Export tasks as PDF/Excel',
  'GET /api/export/plans': 'Export plans as PDF/Excel',
  
  // Sync
  'POST /api/sync/upload': 'Upload offline data',
  'GET /api/sync/download': 'Download data for offline use'
};

// Utility functions
export const planUtils = {
  // Generate tasks based on crop stage and season
  generateTasksForCrop: (crop: Crop, period: 'daily' | 'weekly' | 'monthly'): Task[] => {
    const tasks: Task[] = [];
    const today = new Date();
    
    // Example task generation logic based on crop stage
    switch (crop.currentStage.toLowerCase()) {
      case 'seedling':
        tasks.push({
          id: `task-${Date.now()}-1`,
          name: 'Daily Watering',
          type: 'irrigation',
          date: today,
          time: '06:00',
          completed: false,
          priority: 'high',
          crop: crop.name,
          stage: crop.currentStage,
          userId: crop.userId,
          createdAt: today,
          updatedAt: today
        });
        break;
        
      case 'vegetative':
        tasks.push(
          {
            id: `task-${Date.now()}-1`,
            name: 'Irrigation',
            type: 'irrigation',
            date: today,
            time: '06:00',
            completed: false,
            priority: 'high',
            crop: crop.name,
            stage: crop.currentStage,
            userId: crop.userId,
            createdAt: today,
            updatedAt: today
          },
          {
            id: `task-${Date.now()}-2`,
            name: 'Fertilizer Application',
            type: 'fertilization',
            date: addDays(today, 3),
            time: '08:00',
            completed: false,
            priority: 'medium',
            crop: crop.name,
            stage: crop.currentStage,
            userId: crop.userId,
            createdAt: today,
            updatedAt: today
          }
        );
        break;
        
      case 'flowering':
        tasks.push(
          {
            id: `task-${Date.now()}-1`,
            name: 'Pest Control',
            type: 'pest-control',
            date: today,
            time: '16:00',
            completed: false,
            priority: 'high',
            crop: crop.name,
            stage: crop.currentStage,
            userId: crop.userId,
            createdAt: today,
            updatedAt: today
          },
          {
            id: `task-${Date.now()}-2`,
            name: 'Weeding',
            type: 'weeding',
            date: addDays(today, 2),
            time: '07:00',
            completed: false,
            priority: 'medium',
            crop: crop.name,
            stage: crop.currentStage,
            userId: crop.userId,
            createdAt: today,
            updatedAt: today
          }
        );
        break;
        
      case 'fruiting':
        tasks.push(
          {
            id: `task-${Date.now()}-1`,
            name: 'Harvest Preparation',
            type: 'harvesting',
            date: addDays(today, 7),
            time: '06:00',
            completed: false,
            priority: 'high',
            crop: crop.name,
            stage: crop.currentStage,
            userId: crop.userId,
            createdAt: today,
            updatedAt: today
          }
        );
        break;
    }
    
    return tasks;
  },

  // Auto-adjust plans based on completed tasks
  adjustPlan: (plan: Plan, completedTasks: Task[]): Plan => {
    const adjustedTasks = plan.tasks.map(task => {
      const completedTask = completedTasks.find(ct => 
        ct.name === task.name && 
        ct.type === task.type && 
        ct.crop === task.crop
      );
      
      if (completedTask) {
        return { ...task, completed: true };
      }
      
      return task;
    });
    
    return { ...plan, tasks: adjustedTasks };
  },

  // Get tasks for a specific date range
  getTasksForDateRange: (tasks: Task[], startDate: Date, endDate: Date): Task[] => {
    return tasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate >= startDate && taskDate <= endDate;
    });
  },

  // Calculate progress percentage
  calculateProgress: (tasks: Task[]): number => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.completed);
    return (completedTasks.length / tasks.length) * 100;
  },

  // Generate reminders for pending tasks
  generateReminders: (tasks: Task[]): any[] => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    return tasks
      .filter(task => !task.completed && new Date(task.date) <= tomorrow)
      .map(task => ({
        id: `reminder-${task.id}`,
        taskId: task.id,
        userId: task.userId,
        reminderTime: new Date(task.date + ' ' + task.time),
        message: `Reminder: ${task.name} is scheduled for ${format(new Date(task.date), 'MMM d, yyyy')} at ${task.time}`
      }));
  },

  // Export data functions
  exportToPDF: async (data: any, filename: string): Promise<void> => {
    // Implementation for PDF export
    console.log('Exporting to PDF:', filename, data);
  },

  exportToExcel: async (data: any, filename: string): Promise<void> => {
    // Implementation for Excel export
    console.log('Exporting to Excel:', filename, data);
  },

  // Offline sync functions
  saveForOffline: (data: any): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('offline_plan_data', JSON.stringify(data));
    }
  },

  loadFromOffline: (): any => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('offline_plan_data');
      return data ? JSON.parse(data) : null;
    }
    return null;
  },

  // Voice input processing
  processVoiceInput: async (audioBlob: Blob): Promise<string> => {
    // Implementation for speech-to-text
    // This would integrate with a speech recognition API
    return new Promise((resolve) => {
      // Mock implementation
      setTimeout(() => {
        resolve("Add irrigation task for tomorrow morning");
      }, 1000);
    });
  }
};

// Date utilities
export const dateUtils = {
  getWeekRange: (date: Date) => ({
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 })
  }),
  
  getMonthRange: (date: Date) => ({
    start: startOfMonth(date),
    end: endOfMonth(date)
  }),
  
  formatDate: (date: Date, formatStr: string = 'MMM d, yyyy') => {
    return format(date, formatStr);
  },
  
  isToday: (date: Date) => {
    const today = new Date();
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  },
  
  isPast: (date: Date) => {
    const today = new Date();
    return date < today;
  }
};

// Validation functions
export const validation = {
  isValidTask: (task: Partial<Task>): boolean => {
    return !!(task.name && task.type && task.date && task.time);
  },
  
  isValidPlan: (plan: Partial<Plan>): boolean => {
    return !!(plan.name && plan.period && plan.startDate && plan.endDate);
  },
  
  isValidCrop: (crop: Partial<Crop>): boolean => {
    return !!(crop.name && crop.plantingDate);
  }
}; 