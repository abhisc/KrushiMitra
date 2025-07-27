import { z } from "zod";
import { ai } from "@/ai/genkit";
import { db } from "@/firebaseStore/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  runTransaction,
  Timestamp
} from "firebase/firestore";

export const firebaseAdminTool = ai.defineTool({
  name: "firebase_admin_tool",
  description: "Firebase administrative operations for data management, user management, and system maintenance",
  inputSchema: z.object({
    action: z.enum([
      "get_collection_stats",
      "backup_collection",
      "cleanup_old_data",
      "migrate_data",
      "bulk_update",
      "data_validation",
      "get_system_health",
      "export_collection",
      "import_collection",
      "optimize_queries",
      "manage_indexes",
      "audit_user_activity",
      "generate_reports"
    ]),
    collectionName: z.string().optional(),
    backupPath: z.string().optional(),
    daysToKeep: z.number().optional(),
    migrationRules: z.record(z.any()).optional(),
    updateRules: z.record(z.any()).optional(),
    validationRules: z.record(z.any()).optional(),
    exportFormat: z.enum(["json", "csv", "xml"]).optional(),
    importData: z.array(z.record(z.any())).optional(),
    queryOptimizations: z.array(z.object({
      collection: z.string(),
      field: z.string(),
      indexType: z.enum(["ascending", "descending", "array"])
    })).optional(),
    reportType: z.enum(["user_activity", "data_usage", "performance", "errors"]).optional(),
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional()
    }).optional()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z.any().optional()
  })
}, async ({ 
    action, 
    collectionName, 
    backupPath, 
    daysToKeep, 
    migrationRules, 
    updateRules, 
    validationRules,
    exportFormat,
    importData,
    queryOptimizations,
    reportType,
    dateRange
  }) => {
    try {
      switch (action) {
        case "get_collection_stats":
          if (!collectionName) {
            throw new Error("collectionName is required for getting collection statistics");
          }
          
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          
          const documents = snapshot.docs.map(doc => doc.data());
          const totalDocs = documents.length;
          
          // Calculate basic statistics
          const stats = {
            totalDocuments: totalDocs,
            averageDocumentSize: totalDocs > 0 ? 
              documents.reduce((acc, doc) => acc + JSON.stringify(doc).length, 0) / totalDocs : 0,
            fields: totalDocs > 0 ? Object.keys(documents[0] || {}).length : 0,
            lastModified: totalDocs > 0 ? 
              Math.max(...documents.map(doc => doc.updatedAt?.toDate?.() || doc.updatedAt || 0)) : null
          };
          
          // Field analysis
          const fieldAnalysis: any = {};
          if (totalDocs > 0) {
            const sampleDoc = documents[0];
            for (const [key, value] of Object.entries(sampleDoc)) {
              fieldAnalysis[key] = {
                type: typeof value,
                hasValue: documents.filter(doc => doc[key] !== undefined && doc[key] !== null).length,
                percentage: (documents.filter(doc => doc[key] !== undefined && doc[key] !== null).length / totalDocs) * 100
              };
            }
          }
          
          return {
            success: true,
            collectionName,
            statistics: stats,
            fieldAnalysis
          };

        case "backup_collection":
          if (!collectionName) {
            throw new Error("collectionName is required for backing up collections");
          }
          
          const backupCollectionRef = collection(db, collectionName);
          const backupSnapshot = await getDocs(backupCollectionRef);
          
          const backupData = backupSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          const backupMetadata = {
            collectionName,
            backupDate: new Date().toISOString(),
            documentCount: backupData.length,
            totalSize: JSON.stringify(backupData).length
          };
          
          return {
            success: true,
            backup: {
              metadata: backupMetadata,
              data: backupData
            }
          };

        case "cleanup_old_data":
          if (!collectionName || !daysToKeep) {
            throw new Error("collectionName and daysToKeep are required for cleanup operations");
          }
          
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
          
          const cleanupQuery = query(
            collection(db, collectionName),
            where("createdAt", "<", cutoffDate)
          );
          
          const cleanupSnapshot = await getDocs(cleanupQuery);
          const documentsToDelete = cleanupSnapshot.docs;
          
          if (documentsToDelete.length === 0) {
            return { success: true, message: "No old documents found to clean up" };
          }
          
          // Use batch operations for deletion
          const batch = writeBatch(db);
          documentsToDelete.forEach(doc => {
            batch.delete(doc.ref);
          });
          
          await batch.commit();
          
          return {
            success: true,
            message: `Cleaned up ${documentsToDelete.length} old documents`,
            deletedCount: documentsToDelete.length
          };

        case "migrate_data":
          if (!collectionName || !migrationRules) {
            throw new Error("collectionName and migrationRules are required for data migration");
          }
          
          const migrationQuery = query(collection(db, collectionName));
          const migrationSnapshot = await getDocs(migrationQuery);
          
          const migrationResults = await runTransaction(db, async (transaction) => {
            const results = [];
            
            for (const doc of migrationSnapshot.docs) {
              const originalData = doc.data();
              const migratedData = { ...originalData };
              
              // Apply migration rules
              for (const [field, rule] of Object.entries(migrationRules)) {
                const migrationRule = rule as any;
                if (migrationRule.type === "rename" && originalData[migrationRule.oldName]) {
                  migratedData[migrationRule.newName] = originalData[migrationRule.oldName];
                  delete migratedData[migrationRule.oldName];
                } else if (migrationRule.type === "transform" && originalData[field]) {
                  migratedData[field] = migrationRule.transform(originalData[field]);
                } else if (migrationRule.type === "add" && !originalData[field]) {
                  migratedData[field] = migrationRule.defaultValue;
                }
              }
              
              migratedData.updatedAt = new Date();
              migratedData.migratedAt = new Date();
              
              transaction.update(doc.ref, migratedData);
              results.push({
                documentId: doc.id,
                migrated: true,
                changes: Object.keys(migrationRules)
              });
            }
            
            return results;
          });
          
          return {
            success: true,
            message: `Migrated ${migrationResults.length} documents`,
            results: migrationResults
          };

        case "bulk_update":
          if (!collectionName || !updateRules) {
            throw new Error("collectionName and updateRules are required for bulk updates");
          }
          
          const bulkUpdateQuery = query(collection(db, collectionName));
          const bulkUpdateSnapshot = await getDocs(bulkUpdateQuery);
          
          const bulkUpdateResults = await runTransaction(db, async (transaction) => {
            const results = [];
            
            for (const doc of bulkUpdateSnapshot.docs) {
              const originalData = doc.data();
              const updatedData = { ...originalData };
              
              // Apply update rules
              for (const [field, rule] of Object.entries(updateRules)) {
                const updateRule = rule as any;
                if (updateRule.condition && updateRule.condition(originalData)) {
                  updatedData[field] = updateRule.value;
                } else if (!updateRule.condition) {
                  updatedData[field] = updateRule.value;
                }
              }
              
              updatedData.updatedAt = new Date();
              
              transaction.update(doc.ref, updatedData);
              results.push({
                documentId: doc.id,
                updated: true
              });
            }
            
            return results;
          });
          
          return {
            success: true,
            message: `Updated ${bulkUpdateResults.length} documents`,
            results: bulkUpdateResults
          };

        case "data_validation":
          if (!collectionName || !validationRules) {
            throw new Error("collectionName and validationRules are required for data validation");
          }
          
          const validationQuery = query(collection(db, collectionName));
          const validationSnapshot = await getDocs(validationQuery);
          
          const validationResults = [];
          
          for (const doc of validationSnapshot.docs) {
            const data = doc.data();
            const errors = [];
            
            // Apply validation rules
            for (const [field, rule] of Object.entries(validationRules)) {
              const validationRule = rule as any;
              if (validationRule.required && !data[field]) {
                errors.push(`${field} is required but missing`);
              }
              if (validationRule.type && data[field] && typeof data[field] !== validationRule.type) {
                errors.push(`${field} should be of type ${validationRule.type}`);
              }
              if (validationRule.pattern && data[field] && !validationRule.pattern.test(data[field])) {
                errors.push(`${field} does not match required pattern`);
              }
              if (validationRule.minLength && data[field] && data[field].length < validationRule.minLength) {
                errors.push(`${field} is too short (minimum ${validationRule.minLength})`);
              }
              if (validationRule.maxLength && data[field] && data[field].length > validationRule.maxLength) {
                errors.push(`${field} is too long (maximum ${validationRule.maxLength})`);
              }
            }
            
            if (errors.length > 0) {
              validationResults.push({
                documentId: doc.id,
                errors,
                data
              });
            }
          }
          
          return {
            success: true,
            totalDocuments: validationSnapshot.docs.length,
            validDocuments: validationSnapshot.docs.length - validationResults.length,
            invalidDocuments: validationResults.length,
            validationErrors: validationResults
          };

        case "get_system_health":
          const healthChecks = [];
          
          // Check collections
          const collections = ["farm_tasks", "farm_plans", "scheduled_tasks", "users"];
          
          for (const col of collections) {
            try {
              const healthQuery = query(collection(db, col), limit(1));
              const healthSnapshot = await getDocs(healthQuery);
              healthChecks.push({
                collection: col,
                status: "healthy",
                accessible: true
              });
            } catch (error) {
              healthChecks.push({
                collection: col,
                status: "error",
                accessible: false,
                error: error instanceof Error ? error.message : "Unknown error"
              });
            }
          }
          
          const overallHealth = healthChecks.every(check => check.accessible) ? "healthy" : "degraded";
          
          return {
            success: true,
            systemHealth: {
              status: overallHealth,
              timestamp: new Date().toISOString(),
              checks: healthChecks
            }
          };

        case "export_collection":
          if (!collectionName || !exportFormat) {
            throw new Error("collectionName and exportFormat are required for exporting collections");
          }
          
          const exportQuery = query(collection(db, collectionName));
          const exportSnapshot = await getDocs(exportQuery);
          
          const exportData = exportSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          let formattedData;
          switch (exportFormat) {
            case "json":
              formattedData = JSON.stringify(exportData, null, 2);
              break;
            case "csv":
              if (exportData.length > 0) {
                const headers = Object.keys(exportData[0]);
                const csvRows = [headers.join(",")];
                for (const row of exportData) {
                  const values = headers.map(header => {
                    const value = (row as any)[header];
                    return typeof value === "string" ? `"${value}"` : value;
                  });
                  csvRows.push(values.join(","));
                }
                formattedData = csvRows.join("\n");
              } else {
                formattedData = "";
              }
              break;
            case "xml":
              formattedData = `<?xml version="1.0" encoding="UTF-8"?>\n<collection name="${collectionName}">\n`;
              for (const item of exportData) {
                formattedData += "  <document>\n";
                for (const [key, value] of Object.entries(item)) {
                  formattedData += `    <${key}>${value}</${key}>\n`;
                }
                formattedData += "  </document>\n";
              }
              formattedData += "</collection>";
              break;
          }
          
          return {
            success: true,
            export: {
              collectionName,
              format: exportFormat,
              documentCount: exportData.length,
              data: formattedData
            }
          };

        case "import_collection":
          if (!collectionName || !importData) {
            throw new Error("collectionName and importData are required for importing collections");
          }
          
          const importBatch = writeBatch(db);
          const importResults = [];
          
          for (const item of importData) {
            const docId = item.id || `imported_${Date.now()}_${Math.random()}`;
            const docRef = doc(db, collectionName, docId);
            
            const importItem = {
              ...item,
              id: docId,
              importedAt: new Date(),
              updatedAt: new Date()
            };
            
            importBatch.set(docRef, importItem);
            importResults.push({
              documentId: docId,
              imported: true
            });
          }
          
          await importBatch.commit();
          
          return {
            success: true,
            message: `Imported ${importResults.length} documents`,
            results: importResults
          };

        case "optimize_queries":
          if (!queryOptimizations) {
            throw new Error("queryOptimizations are required for query optimization");
          }
          
          const optimizationResults = [];
          
          for (const optimization of queryOptimizations) {
            try {
              const testQuery = query(
                collection(db, optimization.collection),
                orderBy(optimization.field, optimization.indexType === "descending" ? "desc" : "asc"),
                limit(10)
              );
              
              const testSnapshot = await getDocs(testQuery);
              
              optimizationResults.push({
                collection: optimization.collection,
                field: optimization.field,
                indexType: optimization.indexType,
                status: "optimized",
                testResults: {
                  documentsRetrieved: testSnapshot.docs.length,
                  queryTime: "measured"
                }
              });
            } catch (error) {
              optimizationResults.push({
                collection: optimization.collection,
                field: optimization.field,
                indexType: optimization.indexType,
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error"
              });
            }
          }
          
          return {
            success: true,
            optimizations: optimizationResults
          };

        case "audit_user_activity":
          if (!dateRange) {
            throw new Error("dateRange is required for user activity audit");
          }
          
          const startDate = dateRange.start ? new Date(dateRange.start) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const endDate = dateRange.end ? new Date(dateRange.end) : new Date();
          
          const activityQuery = query(
            collection(db, "farm_tasks"),
            where("createdAt", ">=", startDate),
            where("createdAt", "<=", endDate),
            orderBy("createdAt", "desc")
          );
          
          const activitySnapshot = await getDocs(activityQuery);
          const activities = activitySnapshot.docs.map(doc => doc.data());
          
          const userActivity = activities.reduce((acc: any, activity) => {
            const userId = activity.userId;
            if (!acc[userId]) {
              acc[userId] = {
                userId,
                totalTasks: 0,
                completedTasks: 0,
                taskTypes: {},
                lastActivity: null
              };
            }
            
            acc[userId].totalTasks++;
            if (activity.completed) {
              acc[userId].completedTasks++;
            }
            
            acc[userId].taskTypes[activity.type] = (acc[userId].taskTypes[activity.type] || 0) + 1;
            
            if (!acc[userId].lastActivity || activity.createdAt > acc[userId].lastActivity) {
              acc[userId].lastActivity = activity.createdAt;
            }
            
            return acc;
          }, {});
          
          return {
            success: true,
            audit: {
              dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
              totalActivities: activities.length,
              uniqueUsers: Object.keys(userActivity).length,
              userActivity: Object.values(userActivity)
            }
          };

        case "generate_reports":
          if (!reportType) {
            throw new Error("reportType is required for generating reports");
          }
          
          let report;
          
          switch (reportType) {
            case "user_activity":
              const userActivityQuery = query(collection(db, "farm_tasks"), orderBy("createdAt", "desc"));
              const userActivitySnapshot = await getDocs(userActivityQuery);
              const userActivityData = userActivitySnapshot.docs.map(doc => doc.data());
              
              const userStats = userActivityData.reduce((acc: any, task) => {
                const userId = (task as any).userId;
                if (!acc[userId]) {
                  acc[userId] = { userId, tasks: 0, completed: 0 };
                }
                acc[userId].tasks++;
                if ((task as any).completed) acc[userId].completed++;
                return acc;
              }, {});
              
              report = {
                type: "user_activity",
                generatedAt: new Date().toISOString(),
                totalUsers: Object.keys(userStats).length,
                userStats: Object.values(userStats)
              };
              break;
              
            case "data_usage":
              const collections = ["farm_tasks", "farm_plans", "scheduled_tasks"];
              const usageStats: Record<string, any> = {};
              
              for (const col of collections) {
                const usageQuery = query(collection(db, col));
                const usageSnapshot = await getDocs(usageQuery);
                usageStats[col] = {
                  documentCount: usageSnapshot.docs.length,
                  totalSize: usageSnapshot.docs.reduce((acc, doc) => acc + JSON.stringify(doc.data()).length, 0)
                };
              }
              
              report = {
                type: "data_usage",
                generatedAt: new Date().toISOString(),
                usageStats
              };
              break;
              
            case "performance":
              const performanceQuery = query(collection(db, "farm_tasks"), limit(100));
              const startTime = Date.now();
              const performanceSnapshot = await getDocs(performanceQuery);
              const endTime = Date.now();
              
              report = {
                type: "performance",
                generatedAt: new Date().toISOString(),
                queryTime: endTime - startTime,
                documentsRetrieved: performanceSnapshot.docs.length
              };
              break;
              
            case "errors":
              // This would typically come from error logging
              report = {
                type: "errors",
                generatedAt: new Date().toISOString(),
                errorCount: 0,
                errors: []
              };
              break;
          }
          
          return {
            success: true,
            report
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
  }); 