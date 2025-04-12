import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Contractor } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateSlug } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Upload, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Company form schema
const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, {
    message: "Slug can only contain lowercase letters, numbers, and hyphens",
  }),
  email: z.string().email("Must be a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Must be a valid hex color code",
  }),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function CompanyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("profile");
  const [showEditSlugWarning, setShowEditSlugWarning] = useState(false);

  // Fetch contractor data
  const { data: company, isLoading } = useQuery<Contractor>({
    queryKey: ["/api/user/contractor"],
    enabled: !!user?.contractorId,
  });

  // Company form
  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      website: "",
      description: "",
      primaryColor: "#2563EB",
    },
  });

  // Watch name and update slug when name changes
  const companyName = companyForm.watch("name");
  
  // Set default values when company data is loaded
  React.useEffect(() => {
    if (company) {
      companyForm.reset({
        name: company.name || "",
        slug: company.slug || "",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        zip: company.zip || "",
        website: company.website || "",
        description: company.description || "",
        primaryColor: company.primaryColor || "#2563EB",
      });
    }
  }, [company, companyForm]);

  // Update slug when name changes (only if slug hasn't been manually edited)
  React.useEffect(() => {
    const slug = companyForm.getValues("slug");
    if (companyName && (!slug || !showEditSlugWarning)) {
      companyForm.setValue("slug", generateSlug(companyName));
    }
  }, [companyName, companyForm, showEditSlugWarning]);

  // Update company mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      const response = await apiRequest("PATCH", `/api/contractors/${user!.contractorId!}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/contractor"] });
      toast({
        title: "Company details updated",
        description: "Your company information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update company details",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit form
  function onSubmit(data: CompanyFormValues) {
    updateMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading company information...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Company</h1>
      </div>

      <Tabs defaultValue="profile" value={currentTab} onValueChange={setCurrentTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="profile">Company Profile</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="website">Public Website</TabsTrigger>
          </TabsList>
        </div>

        <Form {...companyForm}>
          <form onSubmit={companyForm.handleSubmit(onSubmit)}>
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    Update your company details and contact information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Company Name & Slug */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={companyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="HVAC Solutions Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Slug</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Input 
                                placeholder="company-name" 
                                {...field} 
                                onFocus={() => setShowEditSlugWarning(true)}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            {showEditSlugWarning ? (
                              <span className="text-amber-600 flex items-center text-xs mt-1">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Changing the slug will update your public URL!
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                hvacpro.com/{field.value || "company-name"}
                              </span>
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Website */}
                  <FormField
                    control={companyForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={companyForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell customers about your HVAC business..." 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                    onClick={() => companyForm.handleSubmit(onSubmit)()}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>
                    Customize your brand's appearance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo upload */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Company Logo</h3>
                    <div className="flex items-center space-x-4">
                      <div className="w-24 h-24 border border-gray-200 rounded-md flex items-center justify-center relative">
                        {company?.logo ? (
                          <>
                            <img 
                              src={company.logo} 
                              alt="Company logo" 
                              className="max-w-full max-h-full p-2"
                            />
                            <button 
                              type="button"
                              className="absolute -top-2 -right-2 bg-white rounded-full border border-gray-200 p-1"
                              onClick={() => toast({
                                title: "This is a demo",
                                description: "Logo removal functionality would be implemented here"
                              })}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <span className="text-2xl text-gray-300">Logo</span>
                        )}
                      </div>
                      <div>
                        <Button variant="outline" type="button">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended size: 200x200px. PNG or SVG format.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Brand colors */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Brand Colors</h3>
                    <FormField
                      control={companyForm.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <div 
                              className="w-10 h-10 rounded-md border border-gray-200" 
                              style={{ backgroundColor: field.value }}
                            />
                          </div>
                          <FormDescription>
                            This color will be used for buttons, links, and accents throughout your portal.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                    onClick={() => companyForm.handleSubmit(onSubmit)()}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="website">
              <Card>
                <CardHeader>
                  <CardTitle>Public Website</CardTitle>
                  <CardDescription>
                    Manage your customer-facing website.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-600">Website Preview</AlertTitle>
                    <AlertDescription>
                      Your public website is automatically generated based on your company information. 
                      It includes your company details, services, and a contact form.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                    <h3 className="font-medium mb-2">Website URL</h3>
                    <div className="flex items-center">
                      <Input 
                        value={`https://hvacpro.com/${companyForm.getValues("slug") || "your-company"}`} 
                        readOnly 
                        className="bg-gray-50"
                      />
                      <Button variant="outline" className="ml-2" onClick={() => {
                        navigator.clipboard.writeText(`https://hvacpro.com/${companyForm.getValues("slug") || "your-company"}`);
                        toast({
                          title: "URL copied",
                          description: "Website URL copied to clipboard",
                        });
                      }}>
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Share this URL with your customers to let them schedule appointments and contact you.
                    </p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-medium">Website Preview</h3>
                    </div>
                    <div className="p-4">
                      <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="text-center p-6">
                          <h4 className="text-xl font-bold mb-2">{companyForm.getValues("name") || "Your Company Name"}</h4>
                          <p className="text-gray-500 mb-4">{companyForm.getValues("description") || "Your company description will appear here."}</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-center text-sm">
                              <span className="material-icons text-sm mr-1">phone</span>
                              <span>{companyForm.getValues("phone") || "(555) 123-4567"}</span>
                            </div>
                            <div className="flex items-center justify-center text-sm">
                              <span className="material-icons text-sm mr-1">email</span>
                              <span>{companyForm.getValues("email") || "contact@company.com"}</span>
                            </div>
                            <div className="flex items-center justify-center text-sm">
                              <span className="material-icons text-sm mr-1">location_on</span>
                              <span>
                                {companyForm.getValues("address") || "123 Main St"}, {companyForm.getValues("city") || "City"}, {companyForm.getValues("state") || "State"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        This is a simplified preview. The actual website includes services, testimonials, and a contact form.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                    <div>
                      <h3 className="font-medium">Customer Chat Widget</h3>
                      <p className="text-sm text-gray-500">
                        Allow customers to chat with you directly from your website.
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-green-600 mr-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Enabled
                      </span>
                      <Button variant="outline">Configure</Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                    onClick={() => companyForm.handleSubmit(onSubmit)()}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </MainLayout>
  );
}
