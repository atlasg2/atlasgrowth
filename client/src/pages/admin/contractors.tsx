import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Loader2, Building2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, "Contractor name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminContractorsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const {
    data: contractors = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/contractors"],
    enabled: !!user && user.role === "admin",
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      website: "",
    },
  });

  const createContractorMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest(
        "POST",
        "/api/contractors",
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contractor created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create contractor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createContractorMutation.mutate(data);
  };

  if (user?.role !== "admin") {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Contractors</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Contractor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Contractor</DialogTitle>
                <DialogDescription>
                  Add a new contractor company to the platform
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="ACME HVAC Services" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="acme-hvac" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL-friendly identifier (e.g., acme-hvac). Only lowercase letters, numbers, and hyphens.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="555-123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createContractorMutation.isPending}>
                    {createContractorMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Contractor
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contractors</CardTitle>
            <CardDescription>
              Manage contractor companies in your system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">
                Error loading contractors: {error.message}
              </div>
            ) : (
              <Table>
                <TableCaption>A list of all contractors in the system</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Website</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        <Building2 className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                        <p className="text-muted-foreground">No contractors found</p>
                        <p className="text-xs text-muted-foreground">
                          Add your first contractor using the button above
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    contractors.map((contractor) => (
                      <TableRow key={contractor.id}>
                        <TableCell>{contractor.id}</TableCell>
                        <TableCell className="font-medium">{contractor.name}</TableCell>
                        <TableCell>{contractor.slug}</TableCell>
                        <TableCell>
                          {contractor.email && (
                            <div className="text-sm">{contractor.email}</div>
                          )}
                          {contractor.phone && (
                            <div className="text-sm text-muted-foreground">
                              {contractor.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {contractor.city && contractor.state ? (
                            `${contractor.city}, ${contractor.state}`
                          ) : (
                            contractor.city || contractor.state || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {contractor.website ? (
                            <a
                              href={contractor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              Visit Site
                            </a>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}