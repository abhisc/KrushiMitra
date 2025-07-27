import { ai } from "@/ai/genkit";
import { z } from "zod";
import { db } from "@/firebaseStore/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";

// Interfaces for farm planning data
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

export const farmPlanningTool = ai.defineTool(
  {
    name: "farm_planning_tool",
    description: "Farm planning and task management tool for creating, managing, and tracking farm activities",
    inputSchema: z.object({
      action: z.enum([
        "create_task",
        "get_task",
        "update_task",
        "delete_task",
        "get_user_tasks",
        "get_tasks_by_date",
        "get_tasks_by_crop",
        "mark_task_completed",
        "create_plan",
        "get_plan",
        "update_plan",
        "delete_plan",
        "get_user_plans",
        "create_scheduled_task",
        "get_scheduled_task",
        "update_scheduled_task",
        "delete_scheduled_task",
        "get_user_scheduled_tasks",
        "get_today_tasks",
        "get_pending_tasks",
        "get_completed_tasks",
        "get_task_statistics"
      ]),
      userId: z.string().optional(),
      taskId: z.string().optional(),
      planId: z.string().optional(),
      scheduledTaskId: z.string().optional(),
      taskData: z.object({
        name: z.string().optional(),
        type: z.enum(['irrigation', 'fertilization', 'pest-control', 'weeding', 'harvesting', 'custom']).optional(),
        date: z.string().optional(), // ISO date string
        time: z.string().optional(),
        notes: z.string().optional(),
        quantity: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        crop: z.string().optional(),
        stage: z.string().optional(),
        completed: z.boolean().optional()
      }).optional(),
      planData: z.object({
        name: z.string().optional(),
        period: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
        startDate: z.string().optional(), // ISO date string
        endDate: z.string().optional(), // ISO date string
        crop: z.string().optional(),
        stage: z.string().optional(),
        autoAdjust: z.boolean().optional()
      }).optional(),
      scheduledTaskData: z.object({
        name: z.string().optional(),
        type: z.enum(['irrigation', 'fertilization', 'pest-control', 'weeding', 'harvesting', 'custom']).optional(),
        startDate: z.string().optional(), // ISO date string
        scheduleType: z.enum(['daily', 'every-few-days', 'custom']).optional(),
        interval: z.number().optional(),
        totalDays: z.number().optional(),
        notes: z.string().optional(),
        quantity: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        crop: z.string().optional(),
        stage: z.string().optional(),
        isActive: z.boolean().optional()
      }).optional(),
      date: z.string().optional(), // ISO date string
      crop: z.string().optional(),
      limit: z.number().optional()
    }),
  },
  async ({ 
    action, 
    userId, 
    taskId, 
    planId, 
    scheduledTaskId, 
    taskData, 
    planData, 
    scheduledTaskData,
    date,
    crop,
    limit: limitCount
  }) => {
    try {
      if (!userId && action !== "get_task_statistics") {
        throw new Error("userId is required for most operations");
      }

      switch (action) {
        case "create_task":
          if (!taskData) {
            throw new Error("taskData is required for creating tasks");
          }
          
          const newTaskId = taskId || `task_${Date.now()}`;
          const taskDoc = doc(db, "farm_tasks", newTaskId);
          
          const newTask: FarmTask = {
            id: newTaskId,
            name: taskData.name || "New Task",
            type: taskData.type || "custom",
            date: taskData.date ? new Date(taskData.date) : new Date(),
            time: taskData.time || "09:00",
            completed: taskData.completed || false,
            notes: taskData.notes,
            quantity: taskData.quantity,
            priority: taskData.priority || "medium",
            crop: taskData.crop,
            stage: taskData.stage,
            userId: userId!,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await setDoc(taskDoc, newTask);
          return { success: true, taskId: newTaskId, task: newTask };

        case "get_task":
          if (!taskId) {
            throw new Error("taskId is required for getting a task");
          }
          
          const taskDocRef = doc(db, "farm_tasks", taskId);
          const taskSnap = await getDoc(taskDocRef);
          
          if (taskSnap.exists()) {
            return { success: true, task: taskSnap.data() };
          } else {
            return { success: false, message: "Task not found" };
          }

        case "update_task":
          if (!taskId || !taskData) {
            throw new Error("taskId and taskData are required for updating tasks");
          }
          
          const updateTaskRef = doc(db, "farm_tasks", taskId);
          const updateData: any = { updatedAt: new Date() };
          
          if (taskData.name !== undefined) updateData.name = taskData.name;
          if (taskData.type !== undefined) updateData.type = taskData.type;
          if (taskData.date !== undefined) updateData.date = new Date(taskData.date);
          if (taskData.time !== undefined) updateData.time = taskData.time;
          if (taskData.notes !== undefined) updateData.notes = taskData.notes;
          if (taskData.quantity !== undefined) updateData.quantity = taskData.quantity;
          if (taskData.priority !== undefined) updateData.priority = taskData.priority;
          if (taskData.crop !== undefined) updateData.crop = taskData.crop;
          if (taskData.stage !== undefined) updateData.stage = taskData.stage;
          if (taskData.completed !== undefined) updateData.completed = taskData.completed;
          
          await updateDoc(updateTaskRef, updateData);
          return { success: true, message: "Task updated successfully" };

        case "delete_task":
          if (!taskId) {
            throw new Error("taskId is required for deleting tasks");
          }
          
          const deleteTaskRef = doc(db, "farm_tasks", taskId);
          await deleteDoc(deleteTaskRef);
          return { success: true, message: "Task deleted successfully" };

        case "get_user_tasks":
          const userTasksQuery = query(
            collection(db, "farm_tasks"),
            where("userId", "==", userId),
            orderBy("date", "desc")
          );
          
          const userTasksSnap = await getDocs(userTasksQuery);
          const userTasks = userTasksSnap.docs.map(doc => doc.data());
          
          return { success: true, tasks: userTasks, count: userTasks.length };

        case "get_tasks_by_date":
          if (!date) {
            throw new Error("date is required for getting tasks by date");
          }
          
          const targetDate = new Date(date);
          const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
          const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
          
          const dateTasksQuery = query(
            collection(db, "farm_tasks"),
            where("userId", "==", userId),
            where("date", ">=", startOfDay),
            where("date", "<", endOfDay),
            orderBy("date", "asc")
          );
          
          const dateTasksSnap = await getDocs(dateTasksQuery);
          const dateTasks = dateTasksSnap.docs.map(doc => doc.data());
          
          return { success: true, tasks: dateTasks, count: dateTasks.length };

        case "get_tasks_by_crop":
          if (!crop) {
            throw new Error("crop is required for getting tasks by crop");
          }
          
          const cropTasksQuery = query(
            collection(db, "farm_tasks"),
            where("userId", "==", userId),
            where("crop", "==", crop),
            orderBy("date", "desc")
          );
          
          const cropTasksSnap = await getDocs(cropTasksQuery);
          const cropTasks = cropTasksSnap.docs.map(doc => doc.data());
          
          return { success: true, tasks: cropTasks, count: cropTasks.length };

        case "mark_task_completed":
          if (!taskId) {
            throw new Error("taskId is required for marking tasks as completed");
          }
          
          const completeTaskRef = doc(db, "farm_tasks", taskId);
          await updateDoc(completeTaskRef, {
            completed: true,
            updatedAt: new Date()
          });
          
          return { success: true, message: "Task marked as completed" };

        case "create_plan":
          if (!planData) {
            throw new Error("planData is required for creating plans");
          }
          
          const newPlanId = planId || `plan_${Date.now()}`;
          const planDoc = doc(db, "farm_plans", newPlanId);
          
          const newPlan: FarmPlan = {
            id: newPlanId,
            name: planData.name || "New Plan",
            period: planData.period || "weekly",
            startDate: planData.startDate ? new Date(planData.startDate) : new Date(),
            endDate: planData.endDate ? new Date(planData.endDate) : new Date(),
            tasks: [],
            crop: planData.crop || "",
            stage: planData.stage || "",
            autoAdjust: planData.autoAdjust || false,
            userId: userId!,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await setDoc(planDoc, newPlan);
          return { success: true, planId: newPlanId, plan: newPlan };

        case "get_plan":
          if (!planId) {
            throw new Error("planId is required for getting a plan");
          }
          
          const planDocRef = doc(db, "farm_plans", planId);
          const planSnap = await getDoc(planDocRef);
          
          if (planSnap.exists()) {
            return { success: true, plan: planSnap.data() };
          } else {
            return { success: false, message: "Plan not found" };
          }

        case "update_plan":
          if (!planId || !planData) {
            throw new Error("planId and planData are required for updating plans");
          }
          
          const updatePlanRef = doc(db, "farm_plans", planId);
          const updatePlanData: any = { updatedAt: new Date() };
          
          if (planData.name !== undefined) updatePlanData.name = planData.name;
          if (planData.period !== undefined) updatePlanData.period = planData.period;
          if (planData.startDate !== undefined) updatePlanData.startDate = new Date(planData.startDate);
          if (planData.endDate !== undefined) updatePlanData.endDate = new Date(planData.endDate);
          if (planData.crop !== undefined) updatePlanData.crop = planData.crop;
          if (planData.stage !== undefined) updatePlanData.stage = planData.stage;
          if (planData.autoAdjust !== undefined) updatePlanData.autoAdjust = planData.autoAdjust;
          
          await updateDoc(updatePlanRef, updatePlanData);
          return { success: true, message: "Plan updated successfully" };

        case "delete_plan":
          if (!planId) {
            throw new Error("planId is required for deleting plans");
          }
          
          const deletePlanRef = doc(db, "farm_plans", planId);
          await deleteDoc(deletePlanRef);
          return { success: true, message: "Plan deleted successfully" };

        case "get_user_plans":
          const userPlansQuery = query(
            collection(db, "farm_plans"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
          );
          
          const userPlansSnap = await getDocs(userPlansQuery);
          const userPlans = userPlansSnap.docs.map(doc => doc.data());
          
          return { success: true, plans: userPlans, count: userPlans.length };

        case "create_scheduled_task":
          if (!scheduledTaskData) {
            throw new Error("scheduledTaskData is required for creating scheduled tasks");
          }
          
          const newScheduledTaskId = scheduledTaskId || `scheduled_${Date.now()}`;
          const scheduledTaskDoc = doc(db, "scheduled_tasks", newScheduledTaskId);
          
          const newScheduledTask: ScheduledTask = {
            id: newScheduledTaskId,
            name: scheduledTaskData.name || "New Scheduled Task",
            type: scheduledTaskData.type || "custom",
            startDate: scheduledTaskData.startDate ? new Date(scheduledTaskData.startDate) : new Date(),
            scheduleType: scheduledTaskData.scheduleType || "daily",
            interval: scheduledTaskData.interval || 1,
            totalDays: scheduledTaskData.totalDays || 7,
            totalTasks: Math.ceil((scheduledTaskData.totalDays || 7) / (scheduledTaskData.interval || 1)),
            completedTasks: 0,
            notes: scheduledTaskData.notes,
            quantity: scheduledTaskData.quantity,
            priority: scheduledTaskData.priority || "medium",
            crop: scheduledTaskData.crop,
            stage: scheduledTaskData.stage,
            isActive: scheduledTaskData.isActive !== undefined ? scheduledTaskData.isActive : true,
            userId: userId!,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await setDoc(scheduledTaskDoc, newScheduledTask);
          return { success: true, scheduledTaskId: newScheduledTaskId, scheduledTask: newScheduledTask };

        case "get_scheduled_task":
          if (!scheduledTaskId) {
            throw new Error("scheduledTaskId is required for getting a scheduled task");
          }
          
          const scheduledTaskDocRef = doc(db, "scheduled_tasks", scheduledTaskId);
          const scheduledTaskSnap = await getDoc(scheduledTaskDocRef);
          
          if (scheduledTaskSnap.exists()) {
            return { success: true, scheduledTask: scheduledTaskSnap.data() };
          } else {
            return { success: false, message: "Scheduled task not found" };
          }

        case "update_scheduled_task":
          if (!scheduledTaskId || !scheduledTaskData) {
            throw new Error("scheduledTaskId and scheduledTaskData are required for updating scheduled tasks");
          }
          
          const updateScheduledTaskRef = doc(db, "scheduled_tasks", scheduledTaskId);
          const updateScheduledData: any = { updatedAt: new Date() };
          
          if (scheduledTaskData.name !== undefined) updateScheduledData.name = scheduledTaskData.name;
          if (scheduledTaskData.type !== undefined) updateScheduledData.type = scheduledTaskData.type;
          if (scheduledTaskData.startDate !== undefined) updateScheduledData.startDate = new Date(scheduledTaskData.startDate);
          if (scheduledTaskData.scheduleType !== undefined) updateScheduledData.scheduleType = scheduledTaskData.scheduleType;
          if (scheduledTaskData.interval !== undefined) updateScheduledData.interval = scheduledTaskData.interval;
          if (scheduledTaskData.totalDays !== undefined) updateScheduledData.totalDays = scheduledTaskData.totalDays;
          if (scheduledTaskData.notes !== undefined) updateScheduledData.notes = scheduledTaskData.notes;
          if (scheduledTaskData.quantity !== undefined) updateScheduledData.quantity = scheduledTaskData.quantity;
          if (scheduledTaskData.priority !== undefined) updateScheduledData.priority = scheduledTaskData.priority;
          if (scheduledTaskData.crop !== undefined) updateScheduledData.crop = scheduledTaskData.crop;
          if (scheduledTaskData.stage !== undefined) updateScheduledData.stage = scheduledTaskData.stage;
          if (scheduledTaskData.isActive !== undefined) updateScheduledData.isActive = scheduledTaskData.isActive;
          
          await updateDoc(updateScheduledTaskRef, updateScheduledData);
          return { success: true, message: "Scheduled task updated successfully" };

        case "delete_scheduled_task":
          if (!scheduledTaskId) {
            throw new Error("scheduledTaskId is required for deleting scheduled tasks");
          }
          
          const deleteScheduledTaskRef = doc(db, "scheduled_tasks", scheduledTaskId);
          await deleteDoc(deleteScheduledTaskRef);
          return { success: true, message: "Scheduled task deleted successfully" };

        case "get_user_scheduled_tasks":
          const userScheduledTasksQuery = query(
            collection(db, "scheduled_tasks"),
            where("userId", "==", userId),
            where("isActive", "==", true),
            orderBy("startDate", "asc")
          );
          
          const userScheduledTasksSnap = await getDocs(userScheduledTasksQuery);
          const userScheduledTasks = userScheduledTasksSnap.docs.map(doc => doc.data());
          
          return { success: true, scheduledTasks: userScheduledTasks, count: userScheduledTasks.length };

        case "get_today_tasks":
          const today = new Date();
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
          
          const todayTasksQuery = query(
            collection(db, "farm_tasks"),
            where("userId", "==", userId),
            where("date", ">=", todayStart),
            where("date", "<", todayEnd),
            orderBy("date", "asc")
          );
          
          const todayTasksSnap = await getDocs(todayTasksQuery);
          const todayTasks = todayTasksSnap.docs.map(doc => doc.data());
          
          return { success: true, tasks: todayTasks, count: todayTasks.length };

        case "get_pending_tasks":
          const pendingTasksQuery = query(
            collection(db, "farm_tasks"),
            where("userId", "==", userId),
            where("completed", "==", false),
            orderBy("date", "asc")
          );
          
          const pendingTasksSnap = await getDocs(pendingTasksQuery);
          const pendingTasks = pendingTasksSnap.docs.map(doc => doc.data());
          
          return { success: true, tasks: pendingTasks, count: pendingTasks.length };

        case "get_completed_tasks":
          const completedTasksQuery = query(
            collection(db, "farm_tasks"),
            where("userId", "==", userId),
            where("completed", "==", true),
            orderBy("date", "desc")
          );
          
          const completedTasksSnap = await getDocs(completedTasksQuery);
          const completedTasks = completedTasksSnap.docs.map(doc => doc.data());
          
          return { success: true, tasks: completedTasks, count: completedTasks.length };

        case "get_task_statistics":
          const allTasksQuery = query(collection(db, "farm_tasks"));
          const allTasksSnap = await getDocs(allTasksQuery);
          const allTasks = allTasksSnap.docs.map(doc => doc.data());
          
          const totalTasks = allTasks.length;
          const completedTasksCount = allTasks.filter(task => task.completed).length;
          const pendingTasksCount = totalTasks - completedTasksCount;
          
          const taskTypes = allTasks.reduce((acc: any, task) => {
            acc[task.type] = (acc[task.type] || 0) + 1;
            return acc;
          }, {});
          
          const cropStats = allTasks.reduce((acc: any, task) => {
            if (task.crop) {
              acc[task.crop] = (acc[task.crop] || 0) + 1;
            }
            return acc;
          }, {});
          
          return {
            success: true,
            statistics: {
              totalTasks,
              completedTasks: completedTasksCount,
              pendingTasks: pendingTasksCount,
              completionRate: totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0,
              taskTypes,
              cropStats
            }
          };

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
);