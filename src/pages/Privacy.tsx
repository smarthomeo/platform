import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Privacy = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="space-y-2 text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Overview</h2>
            <p className="text-muted-foreground mb-4">
              Your privacy is important to us. This policy outlines what data we collect,
              how we use it, and the control you have over your information.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">Personal Information</h3>
                <p className="text-muted-foreground">
                  We collect information that you provide directly to us, such as when you create an account, 
                  update your profile, use interactive features, or contact support.
                  This may include your name, email, profile picture, and demographic information.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Usage Information</h3>
                <p className="text-muted-foreground">
                  We collect information about your usage of our platform, including pages visited,
                  features used, and interactions with content and other users.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Device Information</h3>
                <p className="text-muted-foreground">
                  We collect information about the devices you use to access our services,
                  including hardware models, operating systems, unique device identifiers, and mobile network information.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">Providing and Improving Services</h3>
                <p className="text-muted-foreground">
                  We use your information to deliver, maintain, and improve our platform and services,
                  develop new features, and provide customer support.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Personalization</h3>
                <p className="text-muted-foreground">
                  We use your information to personalize your experience, including recommending content
                  that may be of interest to you.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Communication</h3>
                <p className="text-muted-foreground">
                  We use your information to communicate with you about our services, respond to your inquiries,
                  and send you updates and promotional messages.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">Access and Update</h3>
                <p className="text-muted-foreground">
                  You can access and update certain information about yourself from within your account settings.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Data Deletion</h3>
                <p className="text-muted-foreground">
                  You can request deletion of your personal information by contacting us.
                  We will respond to your request within a reasonable timeframe.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Communication Preferences</h3>
                <p className="text-muted-foreground">
                  You can opt out of receiving promotional emails by following the instructions in those emails
                  or by adjusting your notification settings.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <Separator className="mb-4" />
            <p className="text-muted-foreground">
              If you have any questions or concerns about our Privacy Policy,
              please contact us at privacy@platform2025.com.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default Privacy;