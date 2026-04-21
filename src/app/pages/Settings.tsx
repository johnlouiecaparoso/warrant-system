import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { useState } from 'react';
import { toast } from 'sonner';

export function Settings() {
  const [officeName, setOfficeName] = useState('Butuan City Police Station 1');
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyPending, setNotifyPending] = useState(true);

  const handleSave = () => {
    toast.success('Settings saved successfully.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure office and notification preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="officeName">Office Name</Label>
            <Input
              id="officeName"
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Overdue warrant alerts</p>
              <p className="text-sm text-gray-600">Notify when pending warrants are older than 30 days.</p>
            </div>
            <Switch checked={notifyOverdue} onCheckedChange={setNotifyOverdue} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Pending task badge</p>
              <p className="text-sm text-gray-600">Show badge count in the top navigation bar.</p>
            </div>
            <Switch checked={notifyPending} onCheckedChange={setNotifyPending} />
          </div>
          <Button onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
