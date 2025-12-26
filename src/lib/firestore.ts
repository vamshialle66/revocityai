import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getDbAsync } from "@/lib/firebase";

export interface AnalysisRecord {
  id?: string;
  userId: string;
  imageUrl: string;
  status: "empty" | "half-filled" | "overflowing";
  confidence: number;
  recommendations: string[];
  timestamp: Date;
}

export const saveAnalysis = async (
  userId: string,
  imageUrl: string,
  status: "empty" | "half-filled" | "overflowing",
  confidence: number,
  recommendations: string[]
) => {
  try {
    const db = await getDbAsync();
    const docRef = await addDoc(collection(db, "analyses"), {
      userId,
      imageUrl,
      status,
      confidence,
      recommendations,
      timestamp: serverTimestamp(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error("Error saving analysis:", error);
    return { id: null, error };
  }
};

export const getUserAnalyses = async (userId: string): Promise<AnalysisRecord[]> => {
  try {
    const db = await getDbAsync();
    const q = query(
      collection(db, "analyses"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);
    const analyses: AnalysisRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      analyses.push({
        id: doc.id,
        userId: data.userId,
        imageUrl: data.imageUrl,
        status: data.status,
        confidence: data.confidence,
        recommendations: data.recommendations,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
      });
    });

    return analyses;
  } catch (error) {
    console.error("Error fetching analyses:", error);
    return [];
  }
};

