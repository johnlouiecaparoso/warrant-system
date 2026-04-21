import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { useSystem } from '../context/SystemContext';

export function Settings() {
  const { settings, saveSettings, backendMessage, isBackendReady } = useSystem();
  const [officeName, setOfficeName] = useState(settings.officeName);
  const [notifyOverdue, setNotifyOverdue] = useState(settings.notifyOverdue);
  const [notifyPending, setNotifyPending] = useState(settings.notifyPending);

  useEffect(() => {
    setOfficeName(settings.officeName);
    setNotifyOverdue(settings.notifyOverdue);
    setNotifyPending(settings.notifyPending);
  }, [settings]);

  const handleSave = async () => {
    const result = await saveSettings({
      officeName,
      notifyOverdue,
      notifyPending,
    });

    if (!result.ok) {
      toast.error(result.message || 'Unable to save settings.');
      return;
    }

    toast.success(result.message || 'Settings saved successfully.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure office and notification preferences</p>
      </div>

      {backendMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {backendMessage}
        </div>
      )}

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
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">Overdue warrant alerts</p>
              <p className="text-sm text-gray-600">Notify when pending warrants are older than 30 days.</p>
            </div>
            <Switch checked={notifyOverdue} onCheckedChange={setNotifyOverdue} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">Pending task badge</p>
              <p className="text-sm text-gray-600">Show pending and approval alerts in the top navigation bar.</p>
            </div>
            <Switch checked={notifyPending} onCheckedChange={setNotifyPending} />
          </div>
          <Button onClick={handleSave} disabled={!isBackendReady || !officeName.trim()}>
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
