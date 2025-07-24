"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMedicalRecords } from '@/contexts/MedicalRecordsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { 
  FileText, 
  Plus, 
  Calendar, 
  User, 
  Stethoscope, 
  Pill, 
  Activity,
  Edit,
  Trash2,
  Loader2,
  ClipboardList
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import MedicalRecordForm from './MedicalRecordForm';
import type { MedicalRecord } from '@/types';

export default function MedicalRecordsClient() {
  const { user } = useAuth();
  const { 
    medicalRecords, 
    isLoadingRecords, 
    deleteMedicalRecord,
    refreshMedicalRecords 
  } = useMedicalRecords();
  const { toast } = useToast();
  
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (record: MedicalRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const success = await deleteMedicalRecord(id);
    if (success) {
      toast({
        title: "Success",
        description: "Medical record deleted successfully.",
      });
    }
    setDeletingId(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRecord(null);
    refreshMedicalRecords();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to view your medical records.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <MedicalRecordForm
          record={editingRecord}
          onClose={handleFormClose}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Medical Records</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your medical history
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Record
          </Button>
        </div>
      </div>

      {isLoadingRecords ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Loading medical records...</p>
          </div>
        </div>
      ) : medicalRecords.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Medical Records</h3>
              <p className="text-muted-foreground mb-4">
                You haven&apos;t added any medical records yet.
              </p>
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Record
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {medicalRecords.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Medical Visit - {format(record.visitDate, 'PPP')}
                    </CardTitle>
                    <CardDescription>
                      {record.doctorName && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          Dr. {record.doctorName}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(record)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Medical Record</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this medical record? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(record.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deletingId === record.id}
                          >
                            {deletingId === record.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">DIAGNOSIS</h4>
                      <p className="text-sm">{record.diagnosis}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">SYMPTOMS</h4>
                      <p className="text-sm">{record.symptoms}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">TREATMENT</h4>
                      <p className="text-sm">{record.treatment}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {record.medications.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                          <Pill className="h-3 w-3" />
                          MEDICATIONS
                        </h4>
                        <div className="space-y-2">
                          {record.medications.map((med, index) => (
                            <div key={index} className="text-sm bg-muted p-2 rounded">
                              <p className="font-medium">{med.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {med.dosage} - {med.frequency} for {med.duration}
                              </p>
                              {med.instructions && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {med.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {Object.keys(record.vitals).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          VITALS
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {record.vitals.bloodPressure && (
                            <div>
                              <span className="text-muted-foreground">BP:</span> {record.vitals.bloodPressure}
                            </div>
                          )}
                          {record.vitals.heartRate && (
                            <div>
                              <span className="text-muted-foreground">HR:</span> {record.vitals.heartRate} bpm
                            </div>
                          )}
                          {record.vitals.temperature && (
                            <div>
                              <span className="text-muted-foreground">Temp:</span> {record.vitals.temperature}°F
                            </div>
                          )}
                          {record.vitals.weight && (
                            <div>
                              <span className="text-muted-foreground">Weight:</span> {record.vitals.weight} lbs
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {record.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">NOTES</h4>
                      <p className="text-sm">{record.notes}</p>
                    </div>
                  </>
                )}
                
                {record.followUpDate && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Follow-up:</span>
                      <Badge variant="outline">
                        {format(record.followUpDate, 'PPP')}
                      </Badge>
                    </div>
                  </>
                )}
                
                <Separator />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Created: {format(record.createdAt, 'PPp')}</span>
                  <span>Updated: {format(record.updatedAt, 'PPp')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}