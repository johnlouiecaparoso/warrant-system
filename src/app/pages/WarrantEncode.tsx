import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '../context/SystemContext';

interface WarrantFormData {
  name: string;
  photoDataUrl?: string;
  alias: string;
  caseNumber: string;
  offense: string;
  court: string;
  judge: string;
  dateIssued: string;
  barangay: string;
  address: string;
  assignedOfficer: string;
  remarks: string;
}

async function fileToResizedDataUrl(file: File): Promise<string> {
  const sourceDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to process the selected image.'));
    img.src = sourceDataUrl;
  });

  const maxDimension = 960;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to prepare the selected image.');
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

export function WarrantEncode() {
  const navigate = useNavigate();
  const { addWarrant, currentUser, backendMessage, isBackendReady } = useSystem();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<WarrantFormData>();
  const [photoPreview, setPhotoPreview] = useState('');
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);

  const onSubmit = async (data: WarrantFormData) => {
    const result = await addWarrant({
      ...data,
      photoDataUrl: photoPreview || undefined,
      dateAssigned: new Date().toISOString().slice(0, 10),
      assignmentNotes: data.remarks,
    });
    if (!result.ok) {
      toast.error(result.message || 'Unable to save warrant.');
      return;
    }
    toast.success(
      result.message ||
        (currentUser?.role === 'Admin'
          ? 'Warrant successfully encoded and approved.'
          : 'Warrant submitted successfully and is waiting for admin approval.'),
    );
    reset();
    setPhotoPreview('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Spot Report</h1>
        <p className="text-gray-600">Submit Spot Report on Arrest of Wanted Person</p>
      </div>

      {backendMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {backendMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-bold">SPOT REPORT INFORMATION FORM</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Full name"
                    className="mt-1"
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="alias">Alias (Optional)</Label>
                  <Input
                    id="alias"
                    {...register('alias')}
                    placeholder="Alias or nickname"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Case Information */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Case Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="offense">Law Violated/Offense *</Label>
                  <Input
                    id="offense"
                    {...register('offense', { required: 'Law violated/offense is required' })}
                    placeholder="Type of offense"
                    className="mt-1"
                  />
                  {errors.offense && <p className="text-sm text-red-600 mt-1">{errors.offense.message}</p>}
                </div>
                <div>
                  <Label htmlFor="caseNumber">Criminal Case Number *</Label>
                  <Input
                    id="caseNumber"
                    {...register('caseNumber', { required: 'Criminal case number is required' })}
                    placeholder="CR-YYYY-XXX"
                    className="mt-1"
                  />
                  {errors.caseNumber && <p className="text-sm text-red-600 mt-1">{errors.caseNumber.message}</p>}
                </div>
                <div>
                  <Label htmlFor="court">Issuing Court *</Label>
                  <Input
                    id="court"
                    {...register('court', { required: 'Issuing court is required' })}
                    placeholder="RTC Branch X / MTC"
                    className="mt-1"
                  />
                  {errors.court && <p className="text-sm text-red-600 mt-1">{errors.court.message}</p>}
                </div>
                <div>
                  <Label htmlFor="dateIssued">Date Issued *</Label>
                  <Input
                    id="dateIssued"
                    type="date"
                    {...register('dateIssued', { required: 'Date issued is required' })}
                    className="mt-1"
                  />
                  {errors.dateIssued && <p className="text-sm text-red-600 mt-1">{errors.dateIssued.message}</p>}
                </div>
                <div>
                  <Label htmlFor="dateReceived">Date Received (Optional)</Label>
                  <Input
                    id="dateReceived"
                    type="date"
                    {...register('judge')}
                    placeholder="Date received"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    {...register('address', { required: 'Address is required' })}
                    placeholder="Complete address of arrested person"
                    className="mt-1"
                  />
                  {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>}
                </div>
              </div>
            </div>

            {/* Arrest Information */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Arrest Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="remarks">Remarks *</Label>
                  <Textarea
                    id="remarks"
                    {...register('remarks', { required: 'Remarks are required' })}
                    placeholder="Additional notes or remarks"
                    className="mt-1"
                    rows={3}
                  />
                  {errors.remarks && <p className="text-sm text-red-600 mt-1">{errors.remarks.message}</p>}
                </div>
                <div>
                  <Label htmlFor="dateOfArrest">Date of Arrest *</Label>
                  <Input
                    id="dateOfArrest"
                    type="date"
                    {...register('barangay', { required: 'Date of arrest is required' })}
                    placeholder="Date of arrest"
                    className="mt-1"
                  />
                  {errors.barangay && <p className="text-sm text-red-600 mt-1">{errors.barangay.message}</p>}
                </div>
                <div>
                  <Label htmlFor="placeOfArrest">Place of Arrest *</Label>
                  <Input
                    id="placeOfArrest"
                    {...register('address', { required: 'Place of arrest is required' })}
                    placeholder="Location of arrest"
                    className="mt-1"
                  />
                  {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="arrestingUnit">Arresting Unit *</Label>
                  <Input
                    id="arrestingUnit"
                    {...register('assignedOfficer', { required: 'Arresting unit is required' })}
                    placeholder="Enter arresting unit name"
                    className="mt-1"
                  />
                  {errors.assignedOfficer && <p className="text-sm text-red-600 mt-1">{errors.assignedOfficer.message}</p>}
                </div>
              </div>
            </div>

            {/* Mugshot - Last Section */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Mugshot of Arrested Person</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="photo">Upload Mugshot</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    className="mt-1"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        setPhotoPreview('');
                        return;
                      }

                      setIsPreparingPhoto(true);
                      try {
                        const dataUrl = await fileToResizedDataUrl(file);
                        setPhotoPreview(dataUrl);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Unable to attach the selected image.');
                        event.target.value = '';
                        setPhotoPreview('');
                      } finally {
                        setIsPreparingPhoto(false);
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload a clear mugshot so admins and officers can identify the arrested person faster.
                  </p>
                  {photoPreview && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <img src={photoPreview} alt="Mugshot preview" className="h-40 w-full rounded-lg object-cover sm:w-56" />
                    </div>
                  )}
                  {isPreparingPhoto && <p className="mt-2 text-sm text-blue-600">Preparing image...</p>}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" disabled={!isBackendReady || isPreparingPhoto}>
                Save Report
              </Button>
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => {
                reset();
                setPhotoPreview('');
              }}>
                Clear
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate('/warrants')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
