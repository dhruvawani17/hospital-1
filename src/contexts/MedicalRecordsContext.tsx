"use client";

import type { MedicalRecord, MedicalRecordFormData } from "@/types";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MedicalRecordsContextType {
  medicalRecords: MedicalRecord[];
  isLoadingRecords: boolean;
  isCreatingRecord: boolean;
  isUpdatingRecord: boolean;
  createMedicalRecord: (data: MedicalRecordFormData) => Promise<string | null>;
  updateMedicalRecord: (id: string, data: Partial<MedicalRecordFormData>) => Promise<boolean>;
  deleteMedicalRecord: (id: string) => Promise<boolean>;
  getMedicalRecordById: (id: string) => MedicalRecord | null;
  refreshMedicalRecords: () => Promise<void>;
}

const MedicalRecordsContext = createContext<MedicalRecordsContextType | undefined>(undefined);

export function MedicalRecordsProvider({ children }: { children: React.ReactNode }) {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [isUpdatingRecord, setIsUpdatingRecord] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Convert Firestore timestamp to Date
  const convertTimestampToDate = (timestamp: any): Date => {
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    return new Date(timestamp);
  };

  // Convert Firestore document to MedicalRecord
  const convertFirestoreDocToMedicalRecord = (doc: any): MedicalRecord => {
    const data = doc.data();
    return {
      id: doc.id,
      patientId: data.patientId,
      patientName: data.patientName,
      patientEmail: data.patientEmail,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      visitDate: convertTimestampToDate(data.visitDate),
      diagnosis: data.diagnosis,
      symptoms: data.symptoms,
      treatment: data.treatment,
      medications: data.medications || [],
      vitals: data.vitals || {},
      notes: data.notes,
      followUpDate: data.followUpDate ? convertTimestampToDate(data.followUpDate) : undefined,
      createdAt: convertTimestampToDate(data.createdAt),
      updatedAt: convertTimestampToDate(data.updatedAt),
    };
  };

  // Fetch medical records for the current user
  const fetchMedicalRecords = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoadingRecords(true);
    try {
      const recordsRef = collection(db, "medicalRecords");
      const q = query(
        recordsRef,
        where("patientId", "==", user.uid),
        orderBy("visitDate", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(convertFirestoreDocToMedicalRecord);
      
      setMedicalRecords(records);
    } catch (error) {
      console.error("Error fetching medical records:", error);
      toast({
        title: "Error",
        description: "Failed to load medical records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecords(false);
    }
  }, [user?.uid, toast]);

  // Create a new medical record
  const createMedicalRecord = useCallback(async (data: MedicalRecordFormData): Promise<string | null> => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to create medical records.",
        variant: "destructive",
      });
      return null;
    }

    setIsCreatingRecord(true);
    try {
      const recordsRef = collection(db, "medicalRecords");
      const newRecord = {
        patientId: user.uid,
        patientName: data.patientName,
        patientEmail: data.patientEmail,
        doctorName: data.doctorName,
        visitDate: Timestamp.fromDate(data.visitDate),
        diagnosis: data.diagnosis,
        symptoms: data.symptoms,
        treatment: data.treatment,
        medications: data.medications,
        vitals: data.vitals,
        notes: data.notes || "",
        followUpDate: data.followUpDate ? Timestamp.fromDate(data.followUpDate) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(recordsRef, newRecord);
      
      toast({
        title: "Success",
        description: "Medical record created successfully.",
      });
      
      // Refresh the records list
      await fetchMedicalRecords();
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating medical record:", error);
      toast({
        title: "Error",
        description: "Failed to create medical record. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreatingRecord(false);
    }
  }, [user?.uid, toast, fetchMedicalRecords]);

  // Update an existing medical record
  const updateMedicalRecord = useCallback(async (id: string, data: Partial<MedicalRecordFormData>): Promise<boolean> => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to update medical records.",
        variant: "destructive",
      });
      return false;
    }

    setIsUpdatingRecord(true);
    try {
      const recordRef = doc(db, "medicalRecords", id);
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      // Convert dates to Timestamps if present
      if (data.visitDate) {
        updateData.visitDate = Timestamp.fromDate(data.visitDate);
      }
      if (data.followUpDate) {
        updateData.followUpDate = Timestamp.fromDate(data.followUpDate);
      }

      await updateDoc(recordRef, updateData);
      
      toast({
        title: "Success",
        description: "Medical record updated successfully.",
      });
      
      // Refresh the records list
      await fetchMedicalRecords();
      
      return true;
    } catch (error) {
      console.error("Error updating medical record:", error);
      toast({
        title: "Error",
        description: "Failed to update medical record. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdatingRecord(false);
    }
  }, [user?.uid, toast, fetchMedicalRecords]);

  // Delete a medical record
  const deleteMedicalRecord = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to delete medical records.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const recordRef = doc(db, "medicalRecords", id);
      await deleteDoc(recordRef);
      
      toast({
        title: "Success",
        description: "Medical record deleted successfully.",
      });
      
      // Refresh the records list
      await fetchMedicalRecords();
      
      return true;
    } catch (error) {
      console.error("Error deleting medical record:", error);
      toast({
        title: "Error",
        description: "Failed to delete medical record. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [user?.uid, toast, fetchMedicalRecords]);

  // Get a specific medical record by ID
  const getMedicalRecordById = useCallback((id: string): MedicalRecord | null => {
    return medicalRecords.find(record => record.id === id) || null;
  }, [medicalRecords]);

  // Refresh medical records
  const refreshMedicalRecords = useCallback(async () => {
    await fetchMedicalRecords();
  }, [fetchMedicalRecords]);

  // Load medical records on component mount and when user changes
  useEffect(() => {
    if (user?.uid) {
      fetchMedicalRecords();
    } else {
      setMedicalRecords([]);
    }
  }, [user?.uid, fetchMedicalRecords]);

  const value: MedicalRecordsContextType = {
    medicalRecords,
    isLoadingRecords,
    isCreatingRecord,
    isUpdatingRecord,
    createMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
    getMedicalRecordById,
    refreshMedicalRecords,
  };

  return (
    <MedicalRecordsContext.Provider value={value}>
      {children}
    </MedicalRecordsContext.Provider>
  );
}

export function useMedicalRecords() {
  const context = useContext(MedicalRecordsContext);
  if (context === undefined) {
    throw new Error("useMedicalRecords must be used within a MedicalRecordsProvider");
  }
  return context;
}