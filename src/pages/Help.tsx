import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, HelpCircle, Search, MessageCircle, BookOpen, Settings, FileText, UserCircle, CreditCard, LifeBuoy } from "lucide-react";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: <UserCircle className="h-6 w-6 text-primary" />,
      title: "Account",
      description: "Managing your profile and account settings",
      faqs: [
        { 
          question: "How do I change my password?", 
          answer: "Go to Settings > Security, then click on 'Change Password'. You'll need to enter your current password and your new password." 
        },
        { 
          question: "How do I update my profile information?", 
          answer: "Navigate to your profile page, click the 'Edit Profile' button, make your changes, and click 'Save'." 
        },
        { 
          question: "Can I change my username?", 
          answer: "Yes, you can change your username once every 30 days. Go to Settings > Account, then update your username and click 'Save'." 
        }
      ]
    },
    {
      icon: <CreditCard className="h-6 w-6 text-primary" />,
      title: "Billing",
      description: "Subscription, payments, and invoices",
      faqs: [
        { 
          question: "How do I update my payment method?", 
          answer: "Go to Settings > Billing, click on 'Payment Methods', then 'Add New Method' or edit an existing one." 
        },
        { 
          question: "Can I get a refund?", 
          answer: "Refunds are processed according to our refund policy. For subscription cancellations within 14 days, contact our support team." 
        },
        { 
          question: "Where can I find my invoices?", 
          answer: "All your invoices can be found under Settings > Billing > Invoice History." 
        }
      ]
    },
    {
      icon: <Settings className="h-6 w-6 text-primary" />,
      title: "Features",
      description: "How to use platform features",
      faqs: [
        { 
          question: "How do I create a new project?", 
          answer: "From your dashboard, click 'New Project', fill in the project details, and click 'Create'." 
        },
        { 
          question: "Can I collaborate with others?", 
          answer: "Yes! Go to your project, click 'Share', enter the email addresses of your collaborators, select their permissions, and click 'Invite'." 
        },
        { 
          question: "How do I export my data?", 
          answer: "Navigate to Settings > Data, click on 'Export Data', select the data you want to export, and click 'Download'." 
        }
      ]
    },
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: "Policies",
      description: "Terms, privacy, and guidelines",
      faqs: [
        { 
          question: "What is your privacy policy?", 
          answer: "Our privacy policy details how we collect, use, and protect your data. You can view it in full on our Privacy page." 
        },
        { 
          question: "What are the community guidelines?", 
          answer: "Our community guidelines outline acceptable behavior on our platform. They help ensure a positive experience for all users." 
        },
        { 
          question: "How do you handle copyright claims?", 
          answer: "We take copyright seriously. If you believe your work has been used without permission, please submit a copyright claim through our support portal." 
        }
      ]
    },
    {
      icon: <LifeBuoy className="h-6 w-6 text-primary" />,
      title: "Troubleshooting",
      description: "Common issues and solutions",
      faqs: [
        { 
          question: "The app is running slowly. What can I do?", 
          answer: "Try clearing your browser cache, ensure you're using a supported browser, and check your internet connection. If problems persist, contact support." 
        },
        { 
          question: "I can't log in to my account", 
          answer: "Try resetting your password, ensure you're using the correct email address, and check if your account is verified. If you're still having trouble, contact support." 
        },
        { 
          question: "How do I report a bug?", 
          answer: "Go to Settings > Help > Report a Bug, describe the issue in detail, include any relevant screenshots, and submit the report." 
        }
      ]
    },
    {
      icon: <MessageCircle className="h-6 w-6 text-primary" />,
      title: "Contact Support",
      description: "Get help from our support team",
      faqs: [
        { 
          question: "What are your support hours?", 
          answer: "Our support team is available 24/7 to assist you with any questions or issues you may have." 
        },
        { 
          question: "What's the typical response time?", 
          answer: "We aim to respond to all inquiries within 24 hours, but often respond much faster." 
        },
        { 
          question: "How do I contact support?", 
          answer: "You can contact our support team through the chat widget in the bottom right corner, by emailing support@platform2025.com, or by submitting a ticket through the support portal." 
        }
      ]
    }
  ];

  const filteredCategories = searchQuery 
    ? categories.map(category => ({
        ...category,
        faqs: category.faqs.filter(faq => 
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.faqs.length > 0)
    : categories;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="space-y-2 text-center mb-12">
          <div className="flex justify-center mb-4">
            <HelpCircle className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Help Center</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions and learn how to get the most out of our platform.
          </p>
        </div>

        <div className="relative max-w-lg mx-auto mb-12">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for help topics..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setSearchQuery("")}
            >
              ×
            </Button>
          )}
        </div>

        <Tabs defaultValue="categories" className="mb-12">
          <TabsList className="mx-auto w-fit mb-8">
            <TabsTrigger value="categories">Help Categories</TabsTrigger>
            <TabsTrigger value="popular">Popular Questions</TabsTrigger>
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category, index) => (
                <Card key={index} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      {category.icon}
                      <CardTitle>{category.title}</CardTitle>
                    </div>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-4">
                      {category.faqs.slice(0, 3).map((faq, faqIndex) => (
                        <Collapsible key={faqIndex}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full text-left font-medium">
                            {faq.question}
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2 text-muted-foreground">
                            {faq.answer}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" className="w-full justify-start pl-0">
                      View all {category.title} articles
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="popular">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Most Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Quick answers to our most common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">How do I reset my password?</h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Forgot Password" on the login page, enter your email address, 
                      and follow the instructions sent to your email to create a new password.
                    </p>
                    <Separator />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">How do I cancel my subscription?</h3>
                    <p className="text-muted-foreground mb-4">
                      Go to Settings &gt; Billing &gt; Subscription, click "Cancel Subscription", 
                      and follow the prompts. Your subscription will remain active until the end of your current billing period.
                    </p>
                    <Separator />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Can I change my username?</h3>
                    <p className="text-muted-foreground mb-4">
                      Yes, you can change your username once every 30 days. Go to Settings &gt; Account, 
                      update your username, and click "Save Changes".
                    </p>
                    <Separator />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">How do I download my data?</h3>
                    <p className="text-muted-foreground mb-4">
                      Go to Settings &gt; Privacy &gt; Download Data, select what data you want to download, 
                      and click "Request Download". You'll receive an email when your data is ready to download.
                    </p>
                    <Separator />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">How do I report inappropriate content?</h3>
                    <p className="text-muted-foreground">
                      Click the "..." menu next to the content, select "Report", choose the reason for reporting, 
                      and submit. Our team will review your report as soon as possible.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contact Our Support Team
                </CardTitle>
                <CardDescription>
                  We're here to help you with any questions or issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-muted p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Email Support</h3>
                      <p className="text-muted-foreground mb-4">
                        Send us an email and we'll get back to you as soon as possible.
                      </p>
                      <Button variant="outline" className="w-full">
                        Email support@platform2025.com
                      </Button>
                    </div>
                    
                    <div className="bg-muted p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Live Chat</h3>
                      <p className="text-muted-foreground mb-4">
                        Chat with a member of our support team in real-time.
                      </p>
                      <Button className="w-full">
                        Start a Chat
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Support Hours</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Weekdays</h4>
                        <p className="text-muted-foreground">
                          Monday - Friday<br />
                          9am - 8pm EST
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Weekends</h4>
                        <p className="text-muted-foreground">
                          Saturday - Sunday<br />
                          10am - 6pm EST
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Check our <a href="/docs" className="text-primary hover:underline">documentation</a> or <a href="/community" className="text-primary hover:underline">community forums</a>.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Help;