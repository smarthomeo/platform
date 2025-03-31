import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldIcon, Bell, Users, Eye, Lock, AlertTriangle } from "lucide-react";

const Safety = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="space-y-2 text-center mb-12">
          <div className="flex justify-center mb-4">
            <ShieldIcon className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Safety Center</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your safety is our top priority. Learn about the tools and resources we provide
            to help keep you safe while using our platform.
          </p>
        </div>

        <Tabs defaultValue="overview" className="mb-12">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="reporting">Reporting</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    Account Security
                  </CardTitle>
                  <CardDescription>
                    Tools to protect your account and personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Badge variant="outline" className="mr-2 mt-1">Tip</Badge>
                      <span>Use a strong, unique password for your account</span>
                    </li>
                    <li className="flex items-start">
                      <Badge variant="outline" className="mr-2 mt-1">Tip</Badge>
                      <span>Enable two-factor authentication for added security</span>
                    </li>
                    <li className="flex items-start">
                      <Badge variant="outline" className="mr-2 mt-1">Tip</Badge>
                      <span>Regularly review your account activity for suspicious actions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Community Guidelines
                  </CardTitle>
                  <CardDescription>
                    Standards that help keep our community safe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Badge variant="outline" className="mr-2 mt-1">Rule</Badge>
                      <span>Be respectful and considerate in all interactions</span>
                    </li>
                    <li className="flex items-start">
                      <Badge variant="outline" className="mr-2 mt-1">Rule</Badge>
                      <span>Do not share personal information of others without consent</span>
                    </li>
                    <li className="flex items-start">
                      <Badge variant="outline" className="mr-2 mt-1">Rule</Badge>
                      <span>Report harmful content or behavior immediately</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control who can see your content and information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Profile Privacy</h3>
                    <p className="text-muted-foreground mb-4">
                      You can control who can view your profile, posts, and personal information.
                      Adjust these settings in your account preferences.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Content Visibility</h3>
                    <p className="text-muted-foreground mb-4">
                      Choose whether your content is public, visible to friends only, or private.
                      Different privacy settings can be applied to individual posts.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Data Usage</h3>
                    <p className="text-muted-foreground mb-4">
                      Learn how we use your data and customize your data sharing preferences
                      in the privacy settings section of your account.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline">
                      Review Your Privacy Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reporting">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Reporting Harmful Content
                </CardTitle>
                <CardDescription>
                  How to report content that violates our community guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">How to Report</h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Find the content you want to report</li>
                      <li>Click the three dots (⋯) next to the content</li>
                      <li>Select "Report" from the dropdown menu</li>
                      <li>Choose the reason for your report</li>
                      <li>Add any additional details and submit</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">What Happens Next</h3>
                    <p className="text-muted-foreground mb-4">
                      Our team reviews all reports within 24-48 hours. If we find that the content
                      violates our guidelines, it will be removed and appropriate action will be taken.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Urgent Reports</h3>
                    <p className="text-muted-foreground mb-4">
                      For urgent safety concerns, such as immediate threats or dangerous situations,
                      please contact our safety team directly at safety@platform2025.com.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Safety Resources
                </CardTitle>
                <CardDescription>
                  Additional resources to help you stay safe online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Safety Partners</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>National Cybersecurity Alliance</li>
                      <li>Internet Safety Coalition</li>
                      <li>Digital Citizenship Institute</li>
                      <li>Online Safety Foundation</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Helpful Guides</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>Guide to Digital Privacy</li>
                      <li>Online Safety for Families</li>
                      <li>Recognizing and Avoiding Scams</li>
                      <li>Protecting Personal Information</li>
                    </ul>
                  </div>
                  
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium mb-2">Crisis Support</h3>
                    <p className="text-muted-foreground mb-4">
                      If you're experiencing a personal crisis or need immediate support,
                      please contact one of these national helplines:
                    </p>
                    <div className="bg-muted p-4 rounded-md">
                      <p className="font-medium">Crisis Text Line: Text HOME to 741741</p>
                      <p className="font-medium">National Suicide Prevention Lifeline: 1-800-273-8255</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6">
            Our safety team is here to help you with any questions or concerns.
          </p>
          <Button>Contact Safety Team</Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Safety;