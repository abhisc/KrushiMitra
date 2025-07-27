import { z } from "zod";
import { ai } from "@/ai/genkit";
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
  startAfter,
  endBefore,
  startAt,
  endAt,
  writeBatch,
  runTransaction,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Timestamp,
  FieldValue,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { 
  FirestoreService, 
  DBCollectionKeys,
  BaseDocument 
} from "@/firebaseStore/firestore-service";

export const firestoreTool = ai.defineTool({
  name: "firestore_tool",
  description: "Firestore database operations tool for CRUD operations, queries, and batch operations",
  inputSchema: z.object({
    action: z.enum([
      "create_document",
      "get_document", 
      "update_document",
      "delete_document",
      "get_collection",
      "query_documents",
      "batch_write",
      "transaction",
      "listen_to_document",
      "listen_to_collection",
      "get_or_create",
      "upsert_document",
      "increment_field",
      "array_operations"
    ]),
    collectionName: z.string().optional(),
    documentId: z.string().optional(),
    data: z.record(z.any()).optional(),
    queryConstraints: z.array(z.object({
      type: z.enum(["where", "orderBy", "limit", "startAfter", "endBefore", "startAt", "endAt"]),
      field: z.string().optional(),
      operator: z.string().optional(),
      value: z.any().optional(),
      direction: z.enum(["asc", "desc"]).optional(),
      limitCount: z.number().optional()
    })).optional(),
    batchOperations: z.array(z.object({
      operation: z.enum(["create", "update", "delete"]),
      collectionName: z.string(),
      documentId: z.string(),
      data: z.record(z.any()).optional()
    })).optional(),
    transactionOperations: z.array(z.object({
      operation: z.enum(["get", "set", "update", "delete"]),
      collectionName: z.string(),
      documentId: z.string(),
      data: z.record(z.any()).optional()
    })).optional(),
    fieldPath: z.string().optional(),
    incrementValue: z.number().optional(),
    arrayOperation: z.enum(["union", "remove"]).optional(),
    arrayValues: z.array(z.any()).optional()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z.any().optional(),
    documentId: z.string().optional()
  })
}, async ({ 
    action, 
    collectionName, 
    documentId, 
    data, 
    queryConstraints, 
    batchOperations, 
    transactionOperations,
    fieldPath,
    incrementValue,
    arrayOperation,
    arrayValues
  }) => {
    try {
      switch (action) {
        case "create_document":
          if (!collectionName || !documentId || !data) {
            throw new Error("collectionName, documentId, and data are required for creating documents");
          }
          
          const docRef = doc(db, collectionName, documentId);
          const now = new Date();
          const documentData = {
            ...data,
            id: documentId,
            createdAt: now,
            updatedAt: now
          };
          
          await setDoc(docRef, documentData);
          return { success: true, documentId, message: "Document created successfully" };

        case "get_document":
          if (!collectionName || !documentId) {
            throw new Error("collectionName and documentId are required for getting documents");
          }
          
          const getDocRef = doc(db, collectionName, documentId);
          const docSnap = await getDoc(getDocRef);
          
          if (docSnap.exists()) {
            return { 
              success: true, 
              data: { id: docSnap.id, ...docSnap.data() }
            };
          } else {
            return { success: false, message: "Document not found" };
          }

        case "update_document":
          if (!collectionName || !documentId || !data) {
            throw new Error("collectionName, documentId, and data are required for updating documents");
          }
          
          const updateDocRef = doc(db, collectionName, documentId);
          const updateData = {
            ...data,
            updatedAt: new Date()
          };
          
          await updateDoc(updateDocRef, updateData);
          return { success: true, message: "Document updated successfully" };

        case "delete_document":
          if (!collectionName || !documentId) {
            throw new Error("collectionName and documentId are required for deleting documents");
          }
          
          const deleteDocRef = doc(db, collectionName, documentId);
          await deleteDoc(deleteDocRef);
          return { success: true, message: "Document deleted successfully" };

        case "get_collection":
          if (!collectionName) {
            throw new Error("collectionName is required for getting collections");
          }
          
          const collectionRef = collection(db, collectionName);
          const querySnapshot = await getDocs(collectionRef);
          
          const documents = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          return { success: true, documents, count: documents.length };

        case "query_documents":
          if (!collectionName) {
            throw new Error("collectionName is required for querying documents");
          }
          
          let q = query(collection(db, collectionName));
          
          if (queryConstraints) {
            for (const constraint of queryConstraints) {
              switch (constraint.type) {
                case "where":
                  if (constraint.field && constraint.operator && constraint.value !== undefined) {
                    q = query(q, where(constraint.field, constraint.operator as any, constraint.value));
                  }
                  break;
                case "orderBy":
                  if (constraint.field && constraint.direction) {
                    q = query(q, orderBy(constraint.field, constraint.direction));
                  }
                  break;
                case "limit":
                  if (constraint.limitCount) {
                    q = query(q, limit(constraint.limitCount));
                  }
                  break;
                case "startAfter":
                  if (constraint.value) {
                    q = query(q, startAfter(constraint.value));
                  }
                  break;
                case "endBefore":
                  if (constraint.value) {
                    q = query(q, endBefore(constraint.value));
                  }
                  break;
                case "startAt":
                  if (constraint.value) {
                    q = query(q, startAt(constraint.value));
                  }
                  break;
                case "endAt":
                  if (constraint.value) {
                    q = query(q, endAt(constraint.value));
                  }
                  break;
              }
            }
          }
          
          const queryResult = await getDocs(q);
          const queryDocuments = queryResult.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          return { success: true, documents: queryDocuments, count: queryDocuments.length };

        case "batch_write":
          if (!batchOperations || batchOperations.length === 0) {
            throw new Error("batchOperations are required for batch writes");
          }
          
          const batch = writeBatch(db);
          
          for (const operation of batchOperations) {
            const batchDocRef = doc(db, operation.collectionName, operation.documentId);
            
            switch (operation.operation) {
              case "create":
                if (!operation.data) {
                  throw new Error("Data is required for create operations");
                }
                batch.set(batchDocRef, {
                  ...operation.data,
                  id: operation.documentId,
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
                break;
              case "update":
                if (!operation.data) {
                  throw new Error("Data is required for update operations");
                }
                batch.update(batchDocRef, {
                  ...operation.data,
                  updatedAt: new Date()
                });
                break;
              case "delete":
                batch.delete(batchDocRef);
                break;
            }
          }
          
          await batch.commit();
          return { 
            success: true, 
            message: `Batch write completed successfully with ${batchOperations.length} operations` 
          };

        case "transaction":
          if (!transactionOperations || transactionOperations.length === 0) {
            throw new Error("transactionOperations are required for transactions");
          }
          
          const result = await runTransaction(db, async (transaction) => {
            const results = [];
            
            for (const operation of transactionOperations) {
              const transactionDocRef = doc(db, operation.collectionName, operation.documentId);
              
              switch (operation.operation) {
                case "get":
                  const getResult = await transaction.get(transactionDocRef);
                  results.push({
                    operation: "get",
                    documentId: operation.documentId,
                    exists: getResult.exists(),
                    data: getResult.exists() ? getResult.data() : null
                  });
                  break;
                case "set":
                  if (!operation.data) {
                    throw new Error("Data is required for set operations");
                  }
                  transaction.set(transactionDocRef, {
                    ...operation.data,
                    id: operation.documentId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  });
                  results.push({
                    operation: "set",
                    documentId: operation.documentId,
                    success: true
                  });
                  break;
                case "update":
                  if (!operation.data) {
                    throw new Error("Data is required for update operations");
                  }
                  transaction.update(transactionDocRef, {
                    ...operation.data,
                    updatedAt: new Date()
                  });
                  results.push({
                    operation: "update",
                    documentId: operation.documentId,
                    success: true
                  });
                  break;
                case "delete":
                  transaction.delete(transactionDocRef);
                  results.push({
                    operation: "delete",
                    documentId: operation.documentId,
                    success: true
                  });
                  break;
              }
            }
            
            return results;
          });
          
          return { success: true, results: result };

        case "get_or_create":
          if (!collectionName || !documentId) {
            throw new Error("collectionName and documentId are required for get_or_create");
          }
          
          const getOrCreateRef = doc(db, collectionName, documentId);
          const getOrCreateSnap = await getDoc(getOrCreateRef);
          
          if (getOrCreateSnap.exists()) {
            return { 
              success: true, 
              action: "retrieved",
              data: { id: getOrCreateSnap.id, ...getOrCreateSnap.data() }
            };
          } else {
            if (!data) {
              throw new Error("data is required when document doesn't exist");
            }
            
            const now = new Date();
            const createData = {
              ...data,
              id: documentId,
              createdAt: now,
              updatedAt: now
            };
            
            await setDoc(getOrCreateRef, createData);
            return { 
              success: true, 
              action: "created",
              data: createData
            };
          }

        case "upsert_document":
          if (!collectionName || !documentId || !data) {
            throw new Error("collectionName, documentId, and data are required for upsert operations");
          }
          
          const upsertRef = doc(db, collectionName, documentId);
          const upsertData = {
            ...data,
            id: documentId,
            updatedAt: new Date()
          };
          
          await setDoc(upsertRef, upsertData, { merge: true });
          return { success: true, message: "Document upserted successfully" };

        case "increment_field":
          if (!collectionName || !documentId || !fieldPath || incrementValue === undefined) {
            throw new Error("collectionName, documentId, fieldPath, and incrementValue are required for increment operations");
          }
          
          const incrementRef = doc(db, collectionName, documentId);
          await updateDoc(incrementRef, {
            [fieldPath]: increment(incrementValue),
            updatedAt: new Date()
          });
          
          return { success: true, message: `Field ${fieldPath} incremented by ${incrementValue}` };

        case "array_operations":
          if (!collectionName || !documentId || !fieldPath || !arrayOperation || !arrayValues) {
            throw new Error("collectionName, documentId, fieldPath, arrayOperation, and arrayValues are required for array operations");
          }
          
          const arrayRef = doc(db, collectionName, documentId);
          const arrayUpdateData: any = {
            updatedAt: new Date()
          };
          
          if (arrayOperation === "union") {
            arrayUpdateData[fieldPath] = arrayUnion(...arrayValues);
          } else if (arrayOperation === "remove") {
            arrayUpdateData[fieldPath] = arrayRemove(...arrayValues);
          }
          
          await updateDoc(arrayRef, arrayUpdateData);
          return { 
            success: true, 
            message: `Array operation ${arrayOperation} completed successfully` 
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