"use client";

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/agrimitra/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, 
  Clock, 
  Calendar as CalendarIcon,
  Mic,
  MicOff,
  Download,
  Search,
  MoreVertical,
  CalendarDays,
  Repeat,
  Target,
  TrendingUp,
  History,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle,
  Circle,
  Edit,
  Bot,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isSameDay, isBefore, isAfter, startOfDay, differenceInDays } from "date-fns";

// OpenAI API configuration
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// AI Task Parsing Interface
interface ParsedTask {
  taskType: 'irrigation' | 'fertilization' | 'pest-control' | 'weeding' | 'harvesting' | 'custom';
  customType?: string; // For custom task types
  crop?: string;
  duration?: number;
  startDate?: Date;
  quantity?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  isMissingInfo: boolean;
  missingFields: string[];
}

// Speech Recognition TypeScript declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Utility functions
const getTaskTypeIcon = (type: string, customType?: string) => {
  switch (type) {
    case 'irrigation': return '💧';
    case 'fertilization': return '🌱';
    case 'pest-control': return '🛡️';
    case 'weeding': return '🌿';
    case 'harvesting': return '🌾';
    case 'custom': return customType ? '🔧' : '📝';
    default: return '📝';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

interface Task {
  id: string;
  name: string;
  type: 'irrigation' | 'fertilization' | 'pest-control' | 'weeding' | 'harvesting' | 'custom';
  customType?: string; // For custom task types
  date: Date;
  time: string;
  completed: boolean;
  notes?: string;
  quantity?: string;
  photos?: string[];
  priority: 'low' | 'medium' | 'high';
  crop?: string;
  stage?: string;
  scheduleId?: string; // For grouped scheduled tasks
  isRecurring?: boolean;
  originalDate?: Date; // For tracking original scheduled date
}

interface Plan {
  id: string;
  name: string;
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate: Date;
  tasks: Task[];
  crop: string;
  stage: string;
  autoAdjust: boolean;
}

interface ScheduledTask {
  id: string;
  name: string;
  type: 'irrigation' | 'fertilization' | 'pest-control' | 'weeding' | 'harvesting' | 'custom';
  customType?: string; // For custom task types
  startDate: Date;
  scheduleType: 'daily' | 'every-few-days' | 'custom';
  interval: number; // Days between tasks
  totalDays: number; // Total duration
  completedTasks: number;
  totalTasks: number;
  completedDays: string[]; // Track completed dates as ISO strings
  notes?: string;
  quantity?: string;
  priority: 'low' | 'medium' | 'high';
  crop?: string;
  stage?: string;
  isActive: boolean;
}

// Helper function to generate task dates for a scheduled task
const generateTaskDates = (scheduled: ScheduledTask): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(scheduled.startDate);
  for (let i = 0; i < scheduled.totalTasks; i++) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, scheduled.interval);
  }
  return dates;
};

export default function PlanPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showScheduleTask, setShowScheduleTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<'today' | 'scheduled' | 'history'>('today');
  
  // AI Task Creation State
  const [showAITaskDialog, setShowAITaskDialog] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpData, setFollowUpData] = useState<any>({});
  
  const { toast } = useToast();

  // AI Task Parsing Function (Rules-based fallback)
  const parseTaskWithAI = async (input: string): Promise<ParsedTask> => {
    const lowerInput = input.toLowerCase();
    
    // Extract task type
    let taskType: ParsedTask['taskType'] = 'custom';
    let customType: string | undefined;
    
    if (lowerInput.includes('fertiliz') || lowerInput.includes('fertiliser')) {
      taskType = 'fertilization';
    } else if (lowerInput.includes('water') || lowerInput.includes('irrigat')) {
      taskType = 'irrigation';
    } else if (lowerInput.includes('pest') || lowerInput.includes('pesticide')) {
      taskType = 'pest-control';
    } else if (lowerInput.includes('weed')) {
      taskType = 'weeding';
    } else if (lowerInput.includes('harvest')) {
      taskType = 'harvesting';
    } else {
      // For custom tasks, try to extract the custom type from the input
      // Look for patterns like "do [task]", "perform [task]", "complete [task]"
      const customMatch = input.match(/(?:do|perform|complete|finish|start|begin)\s+([a-zA-Z\s]+?)(?:\s+for|\s+on|\s+to|\s+with|\s+tomorrow|\s+next|\s+the|$)/i);
      if (customMatch) {
        customType = customMatch[1].trim();
      } else {
        // If no clear pattern, use the first few words as custom type
        const words = input.split(' ').slice(0, 3).join(' ').trim();
        if (words.length > 0) {
          customType = words;
        }
      }
    }

    // Extract duration (number of days) - improved regex to catch more patterns
    let duration = 1;
    const durationMatch = lowerInput.match(/(\d+)\s*days?/);
    if (durationMatch) {
      duration = parseInt(durationMatch[1]);
    } else {
      // Also check for word numbers
      const wordNumbers: { [key: string]: number } = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      for (const [word, num] of Object.entries(wordNumbers)) {
        if (lowerInput.includes(`${word} days`) || lowerInput.includes(`${word} day`)) {
          duration = num;
          break;
        }
      }
    }

    // Extract crop name - improved to avoid extracting task types as crops
    let crop: string | undefined;
    const cropMatch = lowerInput.match(/(?:for|on|to|the)\s+([a-zA-Z]+)/);
    if (cropMatch) {
      const potentialCrop = cropMatch[1].toLowerCase();
      // Don't extract task types as crops
      if (!['water', 'irrigate', 'fertilize', 'pest', 'weed', 'harvest', 'spray'].includes(potentialCrop)) {
        crop = cropMatch[1];
      }
    }
    
    // If no crop found, try to extract from common crop patterns
    if (!crop) {
      const commonCrops = ['tomato', 'wheat', 'rice', 'corn', 'cotton', 'potato', 'onion', 'pepper', 'cucumber', 'lettuce'];
      for (const cropName of commonCrops) {
        if (lowerInput.includes(cropName)) {
          crop = cropName;
          break;
        }
      }
    }

    // Extract quantity
    const quantityMatch = lowerInput.match(/(\d+)\s*(liters?|kg|grams?|pounds?)/i);
    const quantity = quantityMatch ? `${quantityMatch[1]} ${quantityMatch[2]}` : undefined;

    // Extract priority
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (lowerInput.includes('urgent') || lowerInput.includes('high priority')) {
      priority = 'high';
    } else if (lowerInput.includes('low priority')) {
      priority = 'low';
    }

    // Check for start date keywords
    let startDate: Date | undefined;
    if (lowerInput.includes('tomorrow')) {
      startDate = addDays(new Date(), 1);
    } else if (lowerInput.includes('today')) {
      startDate = new Date();
    } else if (lowerInput.includes('next week')) {
      startDate = addDays(new Date(), 7);
    }

    // Determine if information is missing
    const missingFields: string[] = [];
    if (!startDate) {
      missingFields.push('startDate');
    }

    return {
      taskType,
      customType,
      crop,
      duration,
      startDate,
      quantity,
      notes: input,
      priority,
      isMissingInfo: missingFields.length > 0,
      missingFields
    };
  };

  // Handle AI Task Creation
  const handleAITaskCreation = async () => {
    if (!aiInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter your task description.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const parsed = await parseTaskWithAI(aiInput);
      setParsedTask(parsed);

      if (parsed.isMissingInfo) {
        setShowFollowUp(true);
        setFollowUpData({});
      } else {
        // Create the task directly
        await createTaskFromParsed(parsed);
        setShowAITaskDialog(false);
        setAiInput("");
        setParsedTask(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process task",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Create Task from Parsed Data
  const createTaskFromParsed = async (parsed: ParsedTask) => {
    const taskName = parsed.taskType === 'custom' && parsed.customType 
      ? `AI Generated: ${parsed.customType}`
      : `AI Generated: ${parsed.taskType} task`;
    
    if (parsed.duration && parsed.duration > 1) {
      // Create scheduled task for multi-day tasks
      const scheduledData: Partial<ScheduledTask> = {
        name: taskName,
        type: parsed.taskType,
        customType: parsed.customType,
        startDate: parsed.startDate || new Date(),
        scheduleType: 'daily',
        interval: 1,
        totalDays: parsed.duration,
        notes: parsed.notes,
        quantity: parsed.quantity,
        priority: parsed.priority || 'medium',
        crop: parsed.crop,
        stage: 'AI Generated',
      };
      handleAddScheduledTask(scheduledData);
    } else {
      // Create single task
      const taskData: Partial<Task> = {
        name: taskName,
        type: parsed.taskType,
        customType: parsed.customType,
        date: parsed.startDate || new Date(),
        time: '09:00',
        completed: false, // Always set to false for new tasks
        notes: parsed.notes,
        quantity: parsed.quantity,
        priority: parsed.priority || 'medium',
        crop: parsed.crop,
        stage: 'AI Generated',
      };
      handleAddTask(taskData);
    }

    toast({
      title: "Task Created",
      description: `Successfully created ${parsed.duration && parsed.duration > 1 ? `${parsed.duration} tasks` : 'task'} using AI!`,
    });
  };

  // Handle Follow-up Data
  const handleFollowUpSubmit = async () => {
    if (!parsedTask) return;

    const updatedTask = { ...parsedTask, ...followUpData };
    
    if (updatedTask.startDate) {
      updatedTask.isMissingInfo = false;
      updatedTask.missingFields = updatedTask.missingFields.filter((field: string) => field !== 'startDate');
    }

    if (!updatedTask.isMissingInfo) {
      await createTaskFromParsed(updatedTask);
      setShowAITaskDialog(false);
      setAiInput("");
      setParsedTask(null);
      setShowFollowUp(false);
      setFollowUpData({});
    }
  };


  const todayTasks = tasks.filter(task => 
    format(task.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const completedTasks = todayTasks.filter(task => task.completed);
  const pendingTasks = todayTasks.filter(task => !task.completed);
  const progressPercentage = todayTasks.length > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0;

  // Get scheduled tasks for today
  const todayScheduledTasks = scheduledTasks.flatMap(scheduled => {
    const taskDates = generateTaskDates(scheduled);
    return taskDates
      .filter(date => isSameDay(date, selectedDate))
      .map((date, index) => {
        const dateString = format(date, 'yyyy-MM-dd');
        const isCompleted = scheduled.completedDays?.includes(dateString) || false;
        
        return {
          id: `${scheduled.id}-${dateString}`, // Use date string for unique ID
          name: scheduled.name,
          type: scheduled.type,
          customType: scheduled.customType,
          date: date,
          time: '09:00',
          completed: isCompleted,
          notes: scheduled.notes,
          quantity: scheduled.quantity,
          priority: scheduled.priority,
          crop: scheduled.crop,
          stage: scheduled.stage,
          scheduleId: scheduled.id,
          isRecurring: true,
          originalDate: date
        };
      });
  });

  // Combine regular tasks and scheduled tasks for today
  const allTodayTasks = [...todayTasks, ...todayScheduledTasks];
  const allCompletedTasks = allTodayTasks.filter(task => task.completed);
  const allPendingTasks = allTodayTasks.filter(task => !task.completed);
  const allProgressPercentage = allTodayTasks.length > 0 ? (allCompletedTasks.length / allTodayTasks.length) * 100 : 0;

  // History tasks (completed tasks from past dates)
  const historyTasks = tasks.filter(task => 
    task.completed && isBefore(task.date, startOfDay(new Date()))
  );

  const handleTaskToggle = (taskId: string) => {
    // Find the task to determine its current state
    const taskToToggle = allTodayTasks.find(t => t.id === taskId);
    const isCurrentlyCompleted = taskToToggle?.completed || false;
    
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
    
    // If it's a scheduled task, update the scheduled task progress
    if (taskToToggle?.scheduleId) {
      const taskDateString = format(taskToToggle.date, 'yyyy-MM-dd');
      
      setScheduledTasks(prevScheduled =>
        prevScheduled.map(scheduled =>
          scheduled.id === taskToToggle.scheduleId
            ? { 
                ...scheduled, 
                completedDays: isCurrentlyCompleted 
                  ? scheduled.completedDays?.filter(date => date !== taskDateString) || [] // Remove date if unchecking
                  : [...(scheduled.completedDays || []), taskDateString], // Add date if checking
                completedTasks: isCurrentlyCompleted 
                  ? Math.max(0, (scheduled.completedDays?.length || 0) - 1) // Calculate based on completedDays
                  : (scheduled.completedDays?.length || 0) + 1 // Calculate based on completedDays
              }
            : scheduled
        )
      );
    }
    
    toast({
      title: "Task Updated",
      description: isCurrentlyCompleted 
        ? "Task marked as incomplete." 
        : "Task marked as complete.",
    });
  };

  const handleAddTask = (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      name: taskData.name || "",
      type: taskData.type || "custom",
      date: taskData.date || new Date(),
      time: taskData.time || "09:00",
      completed: false, // Always set to false for new tasks
      notes: taskData.notes,
      quantity: taskData.quantity,
      priority: taskData.priority || "medium",
      crop: taskData.crop,
      stage: taskData.stage
    };

    setTasks(prev => [...prev, newTask]);
    setShowAddTask(false);
    
    toast({
      title: "Task Added",
      description: "New task has been added to your plan.",
    });
  };

  const handleAddScheduledTask = (scheduledData: Partial<ScheduledTask>) => {
    const newScheduledTask: ScheduledTask = {
      id: Date.now().toString(),
      name: scheduledData.name || "",
      type: scheduledData.type || "custom",
      startDate: scheduledData.startDate || new Date(),
      scheduleType: scheduledData.scheduleType || "daily",
      interval: scheduledData.interval || 1,
      totalDays: scheduledData.totalDays || 7,
      totalTasks: Math.ceil((scheduledData.totalDays || 7) / (scheduledData.interval || 1)),
      completedTasks: 0,
      completedDays: [], // Initialize empty array for completed days
      notes: scheduledData.notes,
      quantity: scheduledData.quantity,
      priority: scheduledData.priority || "medium",
      crop: scheduledData.crop,
      stage: scheduledData.stage,
      isActive: true
    };

    setScheduledTasks(prev => [...prev, newScheduledTask]);
    setShowScheduleTask(false);
    
    toast({
      title: "Scheduled Task Created",
      description: `Created ${newScheduledTask.totalTasks} tasks starting from ${format(newScheduledTask.startDate, 'MMM dd, yyyy')}`,
    });
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // Here you would integrate with speech recognition API
    toast({
      title: isRecording ? "Recording Stopped" : "Recording Started",
      description: isRecording ? "Voice input stopped." : "Start speaking to add a task...",
    });
  };

  const exportData = (format: 'pdf' | 'excel') => {
    // Here you would implement export functionality
    toast({
      title: "Export Started",
      description: `Exporting data in ${format.toUpperCase()} format...`,
    });
  };

  return (
    <AppLayout title="Plan" subtitle="Manage your farm tasks efficiently">
      <div className="p-4 max-w-4xl mx-auto">
        {/* Move Add Task button to top left */}
        <div className="mb-6 flex justify-start">
          <Dialog
            open={showAITaskDialog}
            onOpenChange={(open) => {
              setShowAITaskDialog(open);
              if (!open) {
                setAiInput("");
                setParsedTask(null);
                setShowFollowUp(false);
                setFollowUpData({});
                setIsProcessing(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Tell Me About Your Farm Work
                </DialogTitle>
              </DialogHeader>
              <AITaskForm
                input={aiInput}
                setInput={setAiInput}
                onSubmit={handleAITaskCreation}
                onCancel={() => {
                  setShowAITaskDialog(false);
                  setAiInput("");
                  setParsedTask(null);
                  setShowFollowUp(false);
                  setFollowUpData({});
                  setIsProcessing(false);
                }}
                isProcessing={isProcessing}
                parsedTask={parsedTask}
                showFollowUp={showFollowUp}
                followUpData={followUpData}
                setFollowUpData={setFollowUpData}
                onFollowUpSubmit={handleFollowUpSubmit}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Main content (Tabs, task list, etc.) */}
        <div className="space-y-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-14">
              <TabsTrigger value="today" className="text-lg font-semibold">Today's Work</TabsTrigger>
              <TabsTrigger value="scheduled" className="text-lg font-semibold">Planned Work</TabsTrigger>
              <TabsTrigger value="history" className="text-lg font-semibold">Completed Work</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="irrigation">Irrigation</SelectItem>
                    <SelectItem value="fertilization">Fertilization</SelectItem>
                    <SelectItem value="pest-control">Pest Control</SelectItem>
                    <SelectItem value="weeding">Weeding</SelectItem>
                    <SelectItem value="harvesting">Harvesting</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Today's Tasks */}
              <div className="space-y-3">
                {allTodayTasks.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <div className="flex flex-col items-center w-full">
                        <p className="text-muted-foreground text-center">
                          Add some activities to get started with your farming plan.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  allTodayTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={handleTaskToggle}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              <div className="space-y-3">
                {scheduledTasks.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <CalendarDays className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No scheduled tasks</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Create recurring tasks to automate your farming schedule.
                      </p>
                      <Button onClick={() => setShowScheduleTask(true)}>
                        Create Scheduled Task
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  scheduledTasks.map((scheduled) => (
                    <ScheduledTaskCard key={scheduled.id} scheduled={scheduled} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-3">
                {historyTasks.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <History className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No completed tasks</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Completed tasks will appear here for your reference.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  historyTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={handleTaskToggle}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}

// Task Card Component
function TaskCard({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const pendingMessages = [
    { emoji: '😕', text: 'Need help? You can do this! 💚' },
    { emoji: '🌟', text: 'Every small step helps!' },
    { emoji: '💡', text: 'Start with one small task!' },
    { emoji: '🤗', text: 'We believe in you!' },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow border-2">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggle(task.id)}
            className="mt-2 w-6 h-6"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTaskTypeIcon(task.type, task.customType)}</span>
                <h3 className={`text-lg font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {task.name}
                </h3>
                {task.type === 'custom' && task.customType && (
                  <Badge variant="outline" className="text-xs">
                    {task.customType}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge className={`${getPriorityColor(task.priority)} text-sm font-medium px-3 py-1`}>
                  {task.priority === 'high' ? 'Important' : task.priority === 'medium' ? 'Normal' : 'Low Priority'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-10 h-10"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-base text-gray-600 mb-3">
              {task.crop && (
                <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                  {task.crop}
                </Badge>
              )}
              {task.quantity && (
                <span className="font-medium">Amount: {task.quantity}</span>
              )}
            </div>

            {showDetails && task.notes && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-base">{task.notes}</p>
              </div>
            )}
            {!task.completed && (
              <div className="flex items-center gap-3 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-xl">{pendingMessages[parseInt(task.id, 36) % pendingMessages.length].emoji}</span>
                <span className="text-base font-medium text-yellow-800">{pendingMessages[parseInt(task.id, 36) % pendingMessages.length].text}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Add Task Form Component
function AddTaskForm({ onSubmit, onCancel }: { onSubmit: (data: Partial<Task>) => void; onCancel: () => void }) {
  const { toast } = useToast();
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [parsedData, setParsedData] = useState<Partial<Task>>({
    name: '',
    type: 'custom',
    customType: '',
    time: '09:00',
    priority: 'medium',
    crop: '',
    stage: ''
  });

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect for recording
  useEffect(() => {
    if (!isRecording && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMicToggle = () => {
    if (!isRecording) {
      // Start recording
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast({
          title: "Speech Recognition Not Supported",
          description: "Your browser doesn't support speech recognition. Please use the text input instead.",
          variant: "destructive",
        });
        return;
      }
      setIsRecording(true);
      setRecordingTime(0);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNaturalLanguageInput(transcript);
        setIsRecording(false);
      };
      recognition.onerror = (event: any) => {
        let errorMessage = "Speech recognition error occurred.";
        switch (event.error) {
          case 'no-speech':
            errorMessage = "No speech detected. Please try again and speak clearly into your microphone.";
            break;
          case 'audio-capture':
          case 'not-allowed':
            errorMessage = "Microphone access denied. Please allow microphone permissions and try again.";
            break;
          case 'network':
            errorMessage = "Network error occurred. Please check your internet connection and try again.";
            break;
          case 'service-not-allowed':
            errorMessage = "Speech recognition service not available. Please try again later.";
            break;
          case 'bad-grammar':
            errorMessage = "Speech recognition grammar error. Please try speaking more clearly.";
            break;
          case 'language-not-supported':
            errorMessage = "Language not supported. Please try speaking in English.";
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}. Please try again.`;
        }
        toast({
          title: "Voice Input Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsRecording(false);
      };
      recognition.onend = () => {
        setIsRecording(false);
      };
      recognition.start();
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop recording
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const parseNaturalLanguage = (input: string) => {
    // Simple natural language parsing
    const lowerInput = input.toLowerCase();
    
    // Extract task type
    let type: Task['type'] = 'custom';
    let customType: string | undefined;
    
    if (lowerInput.includes('water') || lowerInput.includes('irrigation')) type = 'irrigation';
    else if (lowerInput.includes('fertilizer') || lowerInput.includes('fertilize')) type = 'fertilization';
    else if (lowerInput.includes('pest') || lowerInput.includes('spray')) type = 'pest-control';
    else if (lowerInput.includes('weed')) type = 'weeding';
    else if (lowerInput.includes('harvest')) type = 'harvesting';
    else {
      // For custom tasks, try to extract the custom type from the input
      const customMatch = input.match(/(?:do|perform|complete|finish|start|begin)\s+([a-zA-Z\s]+?)(?:\s+for|\s+on|\s+to|\s+with|\s+tomorrow|\s+next|\s+the|$)/i);
      if (customMatch) {
        customType = customMatch[1].trim();
      } else {
        // If no clear pattern, use the first few words as custom type
        const words = input.split(' ').slice(0, 3).join(' ').trim();
        if (words.length > 0) {
          customType = words;
        }
      }
    }

    // Extract time
    let time = '09:00';
    const timeMatch = input.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3]?.toLowerCase();
      
      if (period === 'pm' && hour !== 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      
      time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    // Extract crop
    const cropMatch = input.match(/(tomato|wheat|rice|corn|cotton|potato|onion|pepper|cucumber|lettuce)/i);
    const crop = cropMatch ? cropMatch[1] : '';

    // Extract quantity
    const quantityMatch = input.match(/(\d+)\s*(liter|l|kg|kilo|gram|g)/i);
    const quantity = quantityMatch ? `${quantityMatch[1]}${quantityMatch[2]}` : '';

    // Extract priority
    let priority: Task['priority'] = 'medium';
    if (lowerInput.includes('urgent') || lowerInput.includes('important')) priority = 'high';
    else if (lowerInput.includes('low priority')) priority = 'low';

    // Generate task name
    let name = input;
    if (type !== 'custom') {
      const typeNames = {
        'irrigation': 'Irrigation',
        'fertilization': 'Fertilization',
        'pest-control': 'Pest Control',
        'weeding': 'Weeding',
        'harvesting': 'Harvesting'
      };
      name = typeNames[type];
    } else if (customType) {
      name = customType;
    }

    setParsedData({
      name,
      type,
      customType,
      time,
      priority,
      crop,
      quantity,
      notes: input
    });
  };

  const handleTextInput = (text: string) => {
    setNaturalLanguageInput(text);
    parseNaturalLanguage(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(parsedData);
  };

  return (
    <div className="space-y-6">
      {/* Input Mode Selection */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant={inputMode === 'text' ? 'default' : 'outline'}
          onClick={() => setInputMode('text')}
          className="flex-1"
        >
          <Search className="w-4 h-4 mr-2" />
          Type
        </Button>
        <Button
          type="button"
          variant={inputMode === 'voice' ? 'default' : 'outline'}
          onClick={() => setInputMode('voice')}
          className="flex-1"
        >
          <Mic className="w-4 h-4 mr-2" />
          Voice
        </Button>
      </div>

      {/* Input Area */}
      {inputMode === 'text' ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Describe your activity in natural language</label>
            <Textarea
              value={naturalLanguageInput}
              onChange={(e) => handleTextInput(e.target.value)}
              placeholder="e.g., Water the tomato field tomorrow morning at 6 AM with 500 liters"
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
             ) : (
         <div className="space-y-4">
           <div className="text-center">
             <div className="mb-4">
               <p className="text-sm text-muted-foreground mb-2">
                 Tap the button below and speak your farming activity
               </p>
               <p className="text-xs text-muted-foreground">
                 Example: "Water the tomato field tomorrow morning at 6 AM"
               </p>
             </div>
             
             {isRecording && (
               <div className="mb-4 text-center">
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
                   <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                   <span className="text-sm font-medium">Recording: {formatTime(recordingTime)}</span>
                 </div>
               </div>
             )}
             
             <Button
               type="button"
               variant={isRecording ? 'destructive' : 'default'}
               size="lg"
               onClick={handleMicToggle}
               className={`rounded-full flex flex-col items-center justify-center ${isRecording ? 'bg-red-600 text-white animate-pulse shadow-lg scale-110' : 'bg-gray-200 text-gray-800'} w-20 h-20 md:w-24 md:h-24 transition-all duration-200`}
               style={{ fontSize: '1.2rem' }}
             >
               {isRecording ? (
                 <>
                   <MicOff className="w-10 h-10 mb-1" />
                   <span className="text-xs">Stop</span>
                   <span className="text-xs mt-1">{formatTime(recordingTime)}</span>
                 </>
               ) : (
                 <>
                   <Mic className="w-10 h-10 mb-1" />
                   <span className="text-xs">Start</span>
                 </>
               )}
             </Button>
             
             {naturalLanguageInput && (
               <div className="mt-4 p-3 bg-muted rounded-lg">
                 <p className="text-sm font-medium">You said:</p>
                 <p className="text-sm text-muted-foreground">{naturalLanguageInput}</p>
               </div>
             )}
             
             {isRecording && (
               <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                 <p className="text-sm text-blue-800">
                   🎤 Listening... Please speak clearly and describe your farming activity
                 </p>
               </div>
             )}
           </div>
         </div>
       )}

      {/* Parsed Data Preview */}
      {naturalLanguageInput && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Activity Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">Task Name</label>
              <Input
                value={parsedData.name}
                onChange={(e) => setParsedData({ ...parsedData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <Select value={parsedData.type} onValueChange={(value: Task['type']) => setParsedData({ ...parsedData, type: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="irrigation">Irrigation</SelectItem>
                  <SelectItem value="fertilization">Fertilization</SelectItem>
                  <SelectItem value="pest-control">Pest Control</SelectItem>
                  <SelectItem value="weeding">Weeding</SelectItem>
                  <SelectItem value="harvesting">Harvesting</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {parsedData.type === 'custom' && (
              <div>
                <label className="text-xs text-muted-foreground">Custom Type</label>
                <Input
                  value={parsedData.customType || ''}
                  onChange={(e) => setParsedData({ ...parsedData, customType: e.target.value })}
                  placeholder="e.g., Soil testing, Equipment repair"
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground">Time</label>
              <Input
                type="time"
                value={parsedData.time}
                onChange={(e) => setParsedData({ ...parsedData, time: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Priority</label>
              <Select value={parsedData.priority} onValueChange={(value: Task['priority']) => setParsedData({ ...parsedData, priority: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Crop</label>
              <Input
                value={parsedData.crop}
                onChange={(e) => setParsedData({ ...parsedData, crop: e.target.value })}
                placeholder="e.g., Tomato"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Quantity</label>
              <Input
                value={parsedData.quantity}
                onChange={(e) => setParsedData({ ...parsedData, quantity: e.target.value })}
                placeholder="e.g., 500L"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          onClick={handleSubmit}
          disabled={!naturalLanguageInput.trim()}
        >
          Add Activity
        </Button>
      </div>
    </div>
  );
}

// Add Plan Form Component
function AddPlanForm({ onSubmit, onCancel }: { onSubmit: () => void; onCancel: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Plan Name</label>
        <Input placeholder="e.g., Tomato Weekly Plan" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Period</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Crop</label>
          <Input placeholder="e.g., Tomato" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>Create Plan</Button>
      </div>
    </div>
  );
}

// Plan Card Component
function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.name}</CardTitle>
          <Badge variant="outline">{plan.period}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Crop: {plan.crop}</span>
            <span>Stage: {plan.stage}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Tasks: {plan.tasks.length}</span>
            <span>Auto-adjust: {plan.autoAdjust ? 'Yes' : 'No'}</span>
          </div>
          <Progress value={(plan.tasks.filter(t => t.completed).length / plan.tasks.length) * 100} />
        </div>
      </CardContent>
    </Card>
  );
}

// History View Component
function HistoryView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Activity History</h3>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
      
      <div className="space-y-3">
        {tasks.slice(0, 10).map((task) => (
          <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">{getTaskTypeIcon(task.type)}</span>
              <div>
                <p className="font-medium">{task.name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(task.date, 'MMM d, yyyy')} at {task.time}
                </p>
              </div>
            </div>
            <Badge variant={task.completed ? "default" : "secondary"}>
              {task.completed ? "Completed" : "Pending"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// Reports View Component
function ReportsView({ tasks, plans }: { tasks: Task[]; plans: Plan[] }) {
  const completedTasks = tasks.filter(t => t.completed);
  const taskTypes = ['irrigation', 'fertilization', 'pest-control', 'weeding', 'harvesting'];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tasks.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{plans.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {taskTypes.map(type => {
              const count = tasks.filter(t => t.type === type).length;
              const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTaskTypeIcon(type)}</span>
                    <span className="capitalize">{type.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-sm text-muted-foreground">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Schedule Task Form Component
function ScheduleTaskForm({ onSubmit, onCancel }: { onSubmit: (data: Partial<ScheduledTask>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'irrigation' as const,
    startDate: new Date(),
    scheduleType: 'daily' as const,
    interval: 1,
    totalDays: 7,
    notes: '',
    quantity: '',
    priority: 'medium' as const,
    crop: '',
    stage: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const calculateTotalTasks = () => {
    return Math.ceil(formData.totalDays / formData.interval);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Task Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Water tomato plants"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Task Type</label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="irrigation">Irrigation</SelectItem>
              <SelectItem value="fertilization">Fertilization</SelectItem>
              <SelectItem value="pest-control">Pest Control</SelectItem>
              <SelectItem value="weeding">Weeding</SelectItem>
              <SelectItem value="harvesting">Harvesting</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData.startDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="text-sm font-medium">Schedule Type</label>
          <Select value={formData.scheduleType} onValueChange={(value: any) => setFormData({ ...formData, scheduleType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="every-few-days">Every Few Days</SelectItem>
              <SelectItem value="custom">Custom Interval</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Interval (Days)</label>
          <Input
            type="number"
            min="1"
            value={formData.interval}
            onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
            placeholder="1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Total Duration (Days)</label>
          <Input
            type="number"
            min="1"
            value={formData.totalDays}
            onChange={(e) => setFormData({ ...formData, totalDays: parseInt(e.target.value) || 7 })}
            placeholder="7"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Priority</label>
          <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Quantity</label>
          <Input
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="e.g., 5 liters"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Crop</label>
          <Input
            value={formData.crop}
            onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
            placeholder="e.g., Tomato"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Growth Stage</label>
          <Input
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            placeholder="e.g., Flowering"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Schedule Summary</span>
            </div>
            <div className="text-sm text-blue-700">
              <p>• {calculateTotalTasks()} tasks will be created</p>
              <p>• Starting from {format(formData.startDate, 'MMM dd, yyyy')}</p>
              <p>• Every {formData.interval} day{formData.interval > 1 ? 's' : ''} for {formData.totalDays} days</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Schedule
            </Button>
          </div>
        </form>
      );
    }

    // Scheduled Task Card Component
    function ScheduledTaskCard({ scheduled }: { scheduled: ScheduledTask }) {
      const actualCompletedTasks = scheduled.completedDays?.length || 0;
      const progressPercentage = (actualCompletedTasks / scheduled.totalTasks) * 100;
      const remainingDays = scheduled.totalDays - (actualCompletedTasks * scheduled.interval);
      const nextTaskDate = addDays(scheduled.startDate, actualCompletedTasks * scheduled.interval);

      return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">{getTaskTypeIcon(scheduled.type, scheduled.customType)}</span>
                </div>
                <div>
                  <CardTitle className="text-lg">{scheduled.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {scheduled.scheduleType === 'daily' ? 'Daily' : 
                     scheduled.scheduleType === 'every-few-days' ? `Every ${scheduled.interval} days` :
                     `Custom: ${scheduled.interval} day interval`}
                  </p>
                </div>
              </div>
              <Badge className={getPriorityColor(scheduled.priority)}>
                {scheduled.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{scheduled.totalTasks}</div>
                  <div className="text-xs text-gray-600">Total Tasks</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{actualCompletedTasks}</div>
                  <div className="text-xs text-green-600">Completed</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">{scheduled.totalTasks - actualCompletedTasks}</div>
                  <div className="text-xs text-orange-600">Remaining</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Start Date:</span>
                  <p className="font-medium">{format(scheduled.startDate, 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Next Task:</span>
                  <p className="font-medium">{format(nextTaskDate, 'MMM dd, yyyy')}</p>
                </div>
              </div>

              {scheduled.crop && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Crop:</span>
                  <span className="font-medium">{scheduled.crop}</span>
                  {scheduled.stage && (
                    <>
                      <span className="text-gray-600">• Stage:</span>
                      <span className="font-medium">{scheduled.stage}</span>
                    </>
                  )}
                </div>
              )}

              {scheduled.notes && (
                <div className="text-sm">
                  <span className="text-gray-600">Notes:</span>
                  <p className="mt-1">{scheduled.notes}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Schedule
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Tasks
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } 

// AI Task Form Component
function AITaskForm({ 
  input, 
  setInput, 
  onSubmit, 
  onCancel, 
  isProcessing, 
  parsedTask, 
  showFollowUp, 
  followUpData, 
  setFollowUpData, 
  onFollowUpSubmit 
}: {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  parsedTask: ParsedTask | null;
  showFollowUp: boolean;
  followUpData: any;
  setFollowUpData: (data: any) => void;
  onFollowUpSubmit: () => void;
}) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect for recording
  useEffect(() => {
    if (!isRecording && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMicToggle = () => {
    if (!isRecording) {
      // Start recording
      if (!('webkitSpeechRecognition' in window)) {
        toast({
          title: "Voice Not Supported",
          description: "Your device doesn't support voice input. Please type your farm work instead.",
          variant: "destructive",
        });
        return;
      }

      setIsRecording(true);
      setRecordingTime(0);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        let errorMessage = "Voice input error occurred.";
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = "I didn't hear anything. Please try again and speak clearly.";
            break;
          case 'audio-capture':
          case 'not-allowed':
            errorMessage = "Please allow microphone access and try again.";
            break;
          case 'network':
            errorMessage = "Network problem. Please check your internet and try again.";
            break;
          case 'service-not-allowed':
            errorMessage = "Voice service not available. Please try again later.";
            break;
          case 'bad-grammar':
            errorMessage = "Please speak more clearly and try again.";
            break;
          case 'language-not-supported':
            errorMessage = "Please speak in English.";
            break;
          default:
            errorMessage = `Voice error: ${event.error}. Please try again.`;
        }
        
        toast({
          title: "Voice Input Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop recording
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  if (showFollowUp && parsedTask) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <Bot className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-semibold text-blue-800">I Understand Your Farm Work</span>
          </div>
          <div className="text-base text-blue-700 space-y-2">
            <p>Work Type: <strong className="text-blue-900">{parsedTask.taskType}</strong></p>
            {parsedTask.duration && <p>Duration: <strong className="text-blue-900">{parsedTask.duration} days</strong></p>}
            {parsedTask.crop ? (
              <p>Crop: <strong className="text-blue-900">{parsedTask.crop}</strong></p>
            ) : (
              <p>Crop: <span className="text-orange-600 font-medium">You didn't mention a crop</span></p>
            )}
            {parsedTask.quantity && <p>Amount: <strong className="text-blue-900">{parsedTask.quantity}</strong></p>}
          </div>
        </div>

        {parsedTask.missingFields.includes('startDate') && (
          <div className="space-y-3">
            <label className="text-lg font-semibold">When do you want to start this work?</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-12 justify-start text-left font-normal text-lg">
                  <CalendarIcon className="mr-3 h-5 w-5" />
                  {followUpData.startDate ? format(followUpData.startDate, 'PPP') : 'Choose a start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={followUpData.startDate}
                  onSelect={(date) => date && setFollowUpData({ ...followUpData, startDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onCancel} className="h-12 px-6 text-lg">
            Cancel
          </Button>
          <Button 
            onClick={onFollowUpSubmit}
            disabled={!followUpData.startDate}
            className="bg-green-600 hover:bg-green-700 h-12 px-6 text-lg"
          >
            Create Task
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-lg font-semibold">Describe your farm work:</label>
        <div className="flex gap-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Example: I need to water the tomato field for 5 days starting tomorrow"
            rows={4}
            className="flex-1 text-lg resize-none"
          />
          <Button
            onClick={handleMicToggle}
            className={`rounded-full flex flex-col items-center justify-center ${isRecording ? 'bg-red-600 text-white animate-pulse shadow-lg scale-110' : 'bg-gray-200 text-gray-800'} w-24 h-24 transition-all duration-200`}
            style={{ fontSize: '1.2rem' }}
            type="button"
          >
            {isRecording ? (
              <>
                <MicOff className="w-12 h-12 mb-2" />
                <span className="text-sm font-semibold">Stop</span>
                <span className="text-sm mt-1">{formatTime(recordingTime)}</span>
              </>
            ) : (
              <>
                <Mic className="w-12 h-12 mb-2" />
                <span className="text-sm font-semibold">Voice</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {isProcessing && (
        <div className="flex items-center gap-3 text-blue-600 p-4 bg-blue-50 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-lg">Understanding your farm work...</span>
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-lg border">
        <div className="flex items-center gap-3 mb-3">
          <Bot className="w-5 h-5 text-gray-600" />
          <span className="text-lg font-semibold text-gray-700">Farm Work Assistant</span>
        </div>
        <p className="text-base text-gray-600">
          Tell me about your farm work in simple words. I'll help you create a schedule and reminders.
        </p>
        <div className="mt-4 p-4 bg-white rounded border">
          <p className="text-sm font-semibold text-gray-700 mb-2">Examples:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• "Water the tomato field for 5 days"</li>
            <li>• "Add fertilizer to wheat field tomorrow"</li>
            <li>• "Spray pesticides on cotton for 3 days"</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel} className="h-12 px-6 text-lg">
          Cancel
        </Button>
        <Button 
          onClick={onSubmit}
          disabled={!input.trim() || isProcessing}
          className="bg-green-600 hover:bg-green-700 h-12 px-6 text-lg"
        >
          {isProcessing ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </div>
          ) : (
            'Create Task'
          )}
        </Button>
      </div>
    </div>
  );
} 