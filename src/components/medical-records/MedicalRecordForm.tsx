"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMedicalRecords } from '@/contexts/MedicalRecordsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Loader2, 
  Save,
  Pill,
  Activity
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { MedicalRecord, MedicalRecordFormData, Medication, Vitals } from '@/types';

interface MedicalRecordFormProps {
  record?: MedicalRecord | null;
  onClose: () => void;
}

export default function MedicalRecordForm({ record, onClose }: MedicalRecordFormProps) {
  const { user } = useAuth();
  const { createMedicalRecord, updateMedicalRecord, isCreatingRecord, isUpdatingRecord } = useMedicalRecords();
  const { toast } = useToast();

  // Initialize form data
  const [formData, setFormData] = useState<MedicalRecordFormData>({
    patientName: record?.patientName || user?.displayName || '',
    patientEmail: record?.patientEmail || user?.email || '',
    doctorName: record?.doctorName || '',
    visitDate: record?.visitDate || new Date(),
    diagnosis: record?.diagnosis || '',
    symptoms: record?.symptoms || '',
    treatment: record?.treatment || '',
    medications: record?.medications || [],
    vitals: record?.vitals || {},
    notes: record?.notes || '',
    followUpDate: record?.followUpDate,
  });

  const [showVisitDatePicker, setShowVisitDatePicker] = useState(false);
  const [showFollowUpDatePicker, setShowFollowUpDatePicker] = useState(false);

  const isEditing = !!record;
  const isLoading = isCreatingRecord || isUpdatingRecord;

  const handleInputChange = (field: keyof MedicalRecordFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVitalsChange = (field: keyof Vitals, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [field]: value
      }
    }));
  };

  const addMedication = () => {
    const newMedication: Medication = {
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, newMedication]
    }));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientName || !formData.diagnosis || !formData.symptoms || !formData.treatment) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    let success = false;

    if (isEditing && record) {
      success = await updateMedicalRecord(record.id, formData);
    } else {
      const recordId = await createMedicalRecord(formData);
      success = !!recordId;
    }

    if (success) {
      toast({
        title: "Success",
        description: `Medical record ${isEditing ? 'updated' : 'created'} successfully.`,
      });
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Edit Medical Record' : 'Add Medical Record'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientEmail">Patient Email *</Label>
              <Input
                id="patientEmail"
                type="email"
                value={formData.patientEmail}
                onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctorName">Doctor Name</Label>
                <Input
                  id="doctorName"
                  value={formData.doctorName}
                  onChange={(e) => handleInputChange('doctorName', e.target.value)}
                  placeholder="Dr. Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Visit Date *</Label>
                <Popover open={showVisitDatePicker} onOpenChange={setShowVisitDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.visitDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.visitDate ? format(formData.visitDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.visitDate}
                      onSelect={(date) => {
                        if (date) {
                          handleInputChange('visitDate', date);
                          setShowVisitDatePicker(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis *</Label>
              <Input
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                required
                placeholder="Primary diagnosis"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms *</Label>
              <Textarea
                id="symptoms"
                value={formData.symptoms}
                onChange={(e) => handleInputChange('symptoms', e.target.value)}
                required
                placeholder="Describe the symptoms presented"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment">Treatment *</Label>
              <Textarea
                id="treatment"
                value={formData.treatment}
                onChange={(e) => handleInputChange('treatment', e.target.value)}
                required
                placeholder="Treatment provided and recommendations"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.medications.map((medication, index) => (
              <div key={index} className="grid gap-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Medication {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMedication(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Medication Name</Label>
                    <Input
                      value={medication.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      placeholder="Medicine name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Input
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      placeholder="e.g., Twice daily"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      value={medication.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      placeholder="e.g., 7 days"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Input
                    value={medication.instructions || ''}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    placeholder="Special instructions (optional)"
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addMedication}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Medication
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Blood Pressure</Label>
              <Input
                value={formData.vitals.bloodPressure || ''}
                onChange={(e) => handleVitalsChange('bloodPressure', e.target.value)}
                placeholder="120/80"
              />
            </div>
            <div className="space-y-2">
              <Label>Heart Rate (bpm)</Label>
              <Input
                type="number"
                value={formData.vitals.heartRate || ''}
                onChange={(e) => handleVitalsChange('heartRate', parseInt(e.target.value) || 0)}
                placeholder="72"
              />
            </div>
            <div className="space-y-2">
              <Label>Temperature (°F)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.vitals.temperature || ''}
                onChange={(e) => handleVitalsChange('temperature', parseFloat(e.target.value) || 0)}
                placeholder="98.6"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight (lbs)</Label>
              <Input
                type="number"
                value={formData.vitals.weight || ''}
                onChange={(e) => handleVitalsChange('weight', parseInt(e.target.value) || 0)}
                placeholder="150"
              />
            </div>
            <div className="space-y-2">
              <Label>Height (inches)</Label>
              <Input
                type="number"
                value={formData.vitals.height || ''}
                onChange={(e) => handleVitalsChange('height', parseInt(e.target.value) || 0)}
                placeholder="70"
              />
            </div>
            <div className="space-y-2">
              <Label>Respiratory Rate</Label>
              <Input
                type="number"
                value={formData.vitals.respiratoryRate || ''}
                onChange={(e) => handleVitalsChange('respiratoryRate', parseInt(e.target.value) || 0)}
                placeholder="16"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes or observations"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Follow-up Date (Optional)</Label>
              <Popover open={showFollowUpDatePicker} onOpenChange={setShowFollowUpDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.followUpDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.followUpDate ? format(formData.followUpDate, "PPP") : "Select follow-up date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.followUpDate}
                    onSelect={(date) => {
                      handleInputChange('followUpDate', date);
                      setShowFollowUpDatePicker(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {formData.followUpDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInputChange('followUpDate', undefined)}
                  className="text-muted-foreground"
                >
                  Clear follow-up date
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditing ? 'Update Record' : 'Save Record'}
          </Button>
        </div>
      </form>
    </div>
  );
}