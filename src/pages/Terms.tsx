import MainLayout from "@/components/layout/MainLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const Terms = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="space-y-2 text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Alert className="mb-8">
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            Please read these terms carefully before using our platform. By accessing or using our services,
            you agree to be bound by these terms and our Privacy Policy.
          </AlertDescription>
        </Alert>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <Separator className="mb-4" />
            <p className="text-muted-foreground mb-4">
              Welcome to Platform 2025. These Terms of Service govern your access to and use of our platform,
              including our website, applications, and other services. By using our platform, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Account Registration</h2>
            <Separator className="mb-4" />
            <p className="text-muted-foreground mb-4">
              To access certain features of our platform, you may need to register for an account.
              You must provide accurate and complete information when creating an account and keep your account information updated.
              You are responsible for safeguarding your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Conduct</h2>
            <Separator className="mb-4" />
            <p className="text-muted-foreground mb-4">
              You agree to use our platform only for lawful purposes and in accordance with these Terms.
              You agree not to engage in any activity that interferes with or disrupts our platform or services.
            </p>
            <div className="pl-4 border-l-2 border-muted mt-4">
              <p className="text-muted-foreground mb-2">You specifically agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Use our platform in any way that violates any applicable law or regulation</li>
                <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with a person or entity</li>
                <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of our platform</li>
                <li>Attempt to gain unauthorized access to our platform, user accounts, or computer systems</li>
                <li>Use our platform to transmit any malware, viruses, or other malicious code</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
            <Separator className="mb-4" />
            <p className="text-muted-foreground mb-4">
              Our platform and its original content, features, and functionality are owned by Platform 2025 and are protected by
              international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Common Questions</h2>
            <Separator className="mb-4" />
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Can I cancel my subscription?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can cancel your subscription at any time through your account settings.
                  Refunds are provided in accordance with our refund policy.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How do I delete my account?</AccordionTrigger>
                <AccordionContent>
                  You can request account deletion by going to your account settings and selecting "Delete Account".
                  Please note that some information may be retained as required by law.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How do you handle disputes?</AccordionTrigger>
                <AccordionContent>
                  Any disputes arising from these terms or your use of our platform will be resolved through
                  binding arbitration in accordance with the rules of the American Arbitration Association.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Changes to Terms</h2>
            <Separator className="mb-4" />
            <p className="text-muted-foreground">
              We may modify these terms at any time. We will provide notice of any material changes by
              posting the updated terms on our platform and updating the "Last updated" date.
              Your continued use of our platform after any such changes constitutes your acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <Separator className="mb-4" />
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at legal@platform2025.com.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default Terms;