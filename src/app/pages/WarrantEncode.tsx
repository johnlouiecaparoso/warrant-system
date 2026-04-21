import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '../context/SystemContext';

interface WarrantFormData {
  name: string;
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

export function WarrantEncode() {
  const navigate = useNavigate();
  const { addWarrant, users, currentUser, backendMessage, isBackendReady } = useSystem();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<WarrantFormData>();
  const [selectedOfficer, setSelectedOfficer] = useState('');

  const officers = users.filter(u => u.role === 'Warrant Officer' && u.status === 'Active');

  const onSubmit = async (data: WarrantFormData) => {
    const result = await addWarrant({
      ...data,
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
    setSelectedOfficer('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Warrant Encoding</h1>
        <p className="text-gray-600">
          {currentUser?.role === 'Admin'
            ? 'Add new warrant information to the system'
            : 'Submit new warrant information for admin approval'}
        </p>
      </div>

      {backendMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {backendMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Warrant Information Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Accused Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Accused Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name of Accused *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Full name"
                    className="mt-1"
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="alias">Alias</Label>
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
              <h3 className="font-semibold text-gray-900 mb-4">Case Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="caseNumber">Case Number *</Label>
                  <Input
                    id="caseNumber"
                    {...register('caseNumber', { required: 'Case number is required' })}
                    placeholder="CR-YYYY-XXX"
                    className="mt-1"
                  />
                  {errors.caseNumber && <p className="text-sm text-red-600 mt-1">{errors.caseNumber.message}</p>}
                </div>
                <div>
                  <Label htmlFor="offense">Offense *</Label>
                  <Input
                    id="offense"
                    {...register('offense', { required: 'Offense is required' })}
                    placeholder="Type of offense"
                    className="mt-1"
                  />
                  {errors.offense && <p className="text-sm text-red-600 mt-1">{errors.offense.message}</p>}
                </div>
                <div>
                  <Label htmlFor="court">Court *</Label>
                  <Input
                    id="court"
                    {...register('court', { required: 'Court is required' })}
                    placeholder="RTC Branch X / MTC"
                    className="mt-1"
                  />
                  {errors.court && <p className="text-sm text-red-600 mt-1">{errors.court.message}</p>}
                </div>
                <div>
                  <Label htmlFor="judge">Judge *</Label>
                  <Input
                    id="judge"
                    {...register('judge', { required: 'Judge is required' })}
                    placeholder="Hon. Judge Name"
                    className="mt-1"
                  />
                  {errors.judge && <p className="text-sm text-red-600 mt-1">{errors.judge.message}</p>}
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
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="barangay">Barangay *</Label>
                  <Input
                    id="barangay"
                    {...register('barangay', { required: 'Barangay is required' })}
                    placeholder="Barangay name"
                    className="mt-1"
                  />
                  {errors.barangay && <p className="text-sm text-red-600 mt-1">{errors.barangay.message}</p>}
                </div>
                <div>
                  <Label htmlFor="address">Complete Address *</Label>
                  <Input
                    id="address"
                    {...register('address', { required: 'Address is required' })}
                    placeholder="Street, City"
                    className="mt-1"
                  />
                  {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>}
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignedOfficer">Assigned Officer</Label>
                  <Select
                    value={selectedOfficer}
                    onValueChange={(value) => {
                      setSelectedOfficer(value);
                      setValue('assignedOfficer', value);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select officer" />
                    </SelectTrigger>
                    <SelectContent>
                      {officers.map((officer) => (
                        <SelectItem key={officer.id} value={officer.fullName}>
                          {officer.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                {...register('remarks')}
                placeholder="Additional notes or remarks"
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={!isBackendReady}>
                Save Warrant
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                reset();
                setSelectedOfficer('');
              }}>
                Clear
              </Button>
              <Button
                type="button"
                variant="outline"
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
