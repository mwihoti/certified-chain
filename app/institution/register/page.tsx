"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Mail, ArrowRight, CheckCircle, Upload, FileSpreadsheet, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { getFromLocalStorage, setToLocalStorage } from '@/lib/localStorage';

export default function InstitutionRegister() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    email: '',
    contactName: '',
    phone: '',
    numberOfCerts: '',
    organizationImage: null as File | null,
    certTemplate: null as File | null,
    recipientsExcel: null as File | null,
  });

  const [orgImagePreview, setOrgImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, organizationImage: file });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrgImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCertTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, certTemplate: file });
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, recipientsExcel: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required files
    if (!formData.organizationImage) {
      toast({
        title: 'Missing Organization Image',
        description: 'Please upload your organization logo/image.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.certTemplate) {
      toast({
        title: 'Missing Certificate Template',
        description: 'Please upload your certificate template/e-signature.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.recipientsExcel) {
      toast({
        title: 'Missing Recipients Excel',
        description: 'Please upload the Excel file with recipient names.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    // Simulate registration process and store data in localStorage for demo
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Store registration data for admin to process
    const registrationData = {
      id: `org-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      email: formData.email,
      contactName: formData.contactName,
      phone: formData.phone,
      numberOfCerts: parseInt(formData.numberOfCerts),
      organizationImageName: formData.organizationImage.name,
      certTemplateName: formData.certTemplate.name,
      recipientsExcelName: formData.recipientsExcel.name,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    // Save to localStorage for demo purposes
    const pendingOrgs = getFromLocalStorage('pendingOrganizations', []);
    pendingOrgs.push(registrationData);
    setToLocalStorage('pendingOrganizations', pendingOrgs);

    toast({
      title: 'Registration Submitted',
      description: 'Your institution registration is pending admin approval. Check your email for next steps.',
    });

    setIsSubmitting(false);
    router.push('/institution');
  };

  return (
    <Layout>
      <div className="container py-12 md:py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Register Institution</h1>
            <p className="text-muted-foreground">
              Create an account to start issuing blockchain-verified certificates.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Institution Details</CardTitle>
              <CardDescription>
                Fill in your organization's information below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Institution Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., State University"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Institution Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="university">University / College</SelectItem>
                      <SelectItem value="hospital">Hospital / Healthcare</SelectItem>
                      <SelectItem value="certification_body">Certification Body</SelectItem>
                      <SelectItem value="government">Government Agency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Official Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="registrar@institution.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Person</Label>
                  <Input
                    id="contactName"
                    placeholder="Full name"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfCerts">Number of Certificates Needed</Label>
                  <Input
                    id="numberOfCerts"
                    type="number"
                    min="1"
                    placeholder="e.g., 50"
                    value={formData.numberOfCerts}
                    onChange={(e) => setFormData({ ...formData, numberOfCerts: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    How many certificates do you need to generate?
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationImage">Organization Logo/Image</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="organizationImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      required
                      className="cursor-pointer"
                    />
                    <Image className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {orgImagePreview && (
                    <div className="mt-2 border rounded-lg p-2">
                      <img 
                        src={orgImagePreview} 
                        alt="Organization logo preview" 
                        className="h-24 w-24 object-contain mx-auto"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    This image will be displayed on your certificates
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certTemplate">Certificate Template (E-Signature Copy)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="certTemplate"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleCertTemplateUpload}
                      required
                      className="cursor-pointer"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {formData.certTemplate && (
                    <p className="text-sm text-success">
                      ✓ {formData.certTemplate.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload your certificate template with e-signature
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientsExcel">Recipients List (Excel File)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="recipientsExcel"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      required
                      className="cursor-pointer"
                    />
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {formData.recipientsExcel && (
                    <p className="text-sm text-success">
                      ✓ {formData.recipientsExcel.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Excel file with recipient names (will be updated with transaction hashes)
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      Submit Registration
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already registered?{' '}
                <Link href="/institution" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-col gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Verification within 24-48 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Secure data encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Cardano blockchain integration</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
