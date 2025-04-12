import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const [currentTab, setCurrentTab] = useState("general");

  return (
    <MainLayout>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="general" value={currentTab} onValueChange={setCurrentTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
        </div>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your account and application preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Account Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Username</Label>
                    <div className="mt-1 text-sm text-gray-700">{user?.username}</div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="mt-1 text-sm text-gray-700">{user?.email}</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Application Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="darkMode">Dark Mode</Label>
                      <p className="text-sm text-gray-500">Enable dark theme for the application</p>
                    </div>
                    <Switch id="darkMode" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="compactView">Compact View</Label>
                      <p className="text-sm text-gray-500">Reduce spacing in lists and tables</p>
                    </div>
                    <Switch id="compactView" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="newAppointment">New Appointments</Label>
                    <p className="text-sm text-gray-500">Receive emails when a new appointment is scheduled</p>
                  </div>
                  <Switch id="newAppointment" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="newReview">New Reviews</Label>
                    <p className="text-sm text-gray-500">Receive emails when a customer leaves a review</p>
                  </div>
                  <Switch id="newReview" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="invoiceReminders">Invoice Reminders</Label>
                    <p className="text-sm text-gray-500">Receive emails about overdue invoices</p>
                  </div>
                  <Switch id="invoiceReminders" defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">In-App Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="jobUpdates">Job Updates</Label>
                    <p className="text-sm text-gray-500">Receive notifications when jobs are updated</p>
                  </div>
                  <Switch id="jobUpdates" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="newMessages">New Messages</Label>
                    <p className="text-sm text-gray-500">Receive notifications for new messages</p>
                  </div>
                  <Switch id="newMessages" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your account security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <input 
                      type="password" 
                      id="currentPassword" 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <input 
                      type="password" 
                      id="newPassword" 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <input 
                      type="password" 
                      id="confirmPassword" 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                  <Button>Update Password</Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactor">Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Switch id="twoFactor" />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Sessions</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    You're currently signed in on this device. Sign out of all sessions if you think your account has been compromised.
                  </p>
                  <Button variant="destructive" onClick={() => logoutMutation.mutate()}>
                    Sign Out of All Sessions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}