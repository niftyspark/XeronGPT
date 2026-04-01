import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, getDocs, serverTimestamp, Timestamp, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { AppMessage } from './types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type Conversation = {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type DbMessage = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Timestamp;
  userId: string;
};

export type Memory = {
  userId: string;
  content: string;
  updatedAt: Timestamp;
};

export type CanvasState = {
  userId: string;
  messages: AppMessage[];
  code: string;
  updatedAt: Timestamp;
};

export type Task = {
  id: string;
  userId: string;
  title: string;
  date: string;
  time: string;
  description: string;
  status: 'pending' | 'completed';
  createdAt: Timestamp;
};

export function subscribeToTasks(userId: string, callback: (tasks: Task[]) => void) {
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];
    callback(tasks);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'tasks');
  });
}

export async function createTask(userId: string, taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'status'>) {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      userId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'tasks');
    throw error;
  }
}

export async function updateTaskStatus(taskId: string, status: 'pending' | 'completed') {
  try {
    await updateDoc(doc(db, 'tasks', taskId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
  }
}

export async function deleteTask(taskId: string) {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
  }
}

export function subscribeToConversations(userId: string, callback: (conversations: Conversation[]) => void) {
  const q = query(
    collection(db, 'conversations'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const convos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Conversation[];
    callback(convos);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'conversations');
  });
}

export function subscribeToMessages(conversationId: string, userId: string, callback: (messages: DbMessage[]) => void) {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    where('userId', '==', userId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DbMessage[];
    
    // Sort on client to avoid composite index requirement
    msgs.sort((a, b) => {
      const timeA = a.createdAt?.toMillis() || 0;
      const timeB = b.createdAt?.toMillis() || 0;
      return timeA - timeB;
    });
    
    callback(msgs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'messages');
  });
}

export async function createConversation(userId: string, title: string): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'conversations'), {
      userId,
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'conversations');
    throw error;
  }
}

export async function updateConversationTimestamp(conversationId: string) {
  try {
    await updateDoc(doc(db, 'conversations', conversationId), {
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `conversations/${conversationId}`);
  }
}

export async function saveMessage(conversationId: string, userId: string, role: string, content: string) {
  try {
    await addDoc(collection(db, 'messages'), {
      conversationId,
      userId,
      role,
      content,
      createdAt: serverTimestamp()
    });
    await updateConversationTimestamp(conversationId);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'messages');
  }
}

export async function deleteConversation(conversationId: string) {
  try {
    // Delete all messages in the conversation
    const q = query(collection(db, 'messages'), where('conversationId', '==', conversationId));
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    
    // Delete the conversation itself
    await deleteDoc(doc(db, 'conversations', conversationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `conversations/${conversationId}`);
  }
}

export function subscribeToMemory(userId: string, callback: (memory: Memory | null) => void) {
  return onSnapshot(doc(db, 'memories', userId), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Memory);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `memories/${userId}`);
  });
}

export async function updateMemory(userId: string, content: string) {
  try {
    await setDoc(doc(db, 'memories', userId), {
      userId,
      content,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `memories/${userId}`);
  }
}

export function subscribeToCanvasState(userId: string, callback: (state: CanvasState | null) => void) {
  return onSnapshot(doc(db, 'canvas_states', userId), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as CanvasState);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `canvas_states/${userId}`);
  });
}

export async function updateCanvasState(userId: string, messages: AppMessage[], code: string) {
  try {
    await setDoc(doc(db, 'canvas_states', userId), {
      userId,
      messages,
      code,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `canvas_states/${userId}`);
  }
}
