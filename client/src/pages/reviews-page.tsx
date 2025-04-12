import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Review, InsertReview, insertReviewSchema, Contact, Job } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistanceToNow } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlusIcon, 
  SearchIcon, 
  UserIcon,
  StarIcon,
  BuildingIcon,
  EditIcon, 
  TrashIcon,
  CheckIcon,
  ReplyIcon,
  QuoteIcon,
  BadgeCheckIcon
} from "lucide-react";

// Extend review schema for form validation
const reviewFormSchema = insertReviewSchema.extend({
  contactId: z.number({ required_error: "Please select a customer" }),
  rating: z.number().min(1, "Rating is required").max(5, "Rating cannot be more than 5"),
  serviceType: z.string().min(1, "Service type is required"),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

// Response form schema
const responseFormSchema = z.object({
  response: z.string().min(1, "Response is required"),
});

type ResponseFormValues = z.infer<typeof responseFormSchema>;

export default function ReviewsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const [starFilter, setStarFilter] = useState<number | null>(null);

  // Fetch reviews
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
    enabled: !!user?.contractorId,
  });

  // Fetch contacts for review form
  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    enabled: !!user?.contractorId,
  });
  
  // Fetch jobs for review form
  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: !!user?.contractorId,
  });

  // Create form
  const addForm = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      contactId: undefined,
      jobId: undefined,
      rating: undefined,
      comment: "",
      serviceType: "",
      verified: false,
      response: "",
    },
  });

  // Response form
  const responseForm = useForm<ResponseFormValues>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      response: "",
    },
  });

  // Add review mutation
  const addMutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({
        title: "Review added",
        description: "The review has been added successfully.",
      });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update review mutation (for response and verification)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertReview> }) => {
      const response = await apiRequest("PATCH", `/api/reviews/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({
        title: "Review updated",
        description: "The review has been updated successfully.",
      });
      setIsResponseDialogOpen(false);
      setIsVerifyDialogOpen(false);
      setSelectedReview(null);
      responseForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({
        title: "Review deleted",
        description: "The review has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedReview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onAddSubmit(data: ReviewFormValues) {
    addMutation.mutate({
      ...data,
      contractorId: user!.contractorId!,
    });
  }

  function onResponseSubmit(data: ResponseFormValues) {
    if (!selectedReview) return;
    
    updateMutation.mutate({
      id: selectedReview.id,
      data: {
        response: data.response,
      },
    });
  }

  function handleRespondToReview(review: Review) {
    setSelectedReview(review);
    responseForm.reset({
      response: review.response || "",
    });
    setIsResponseDialogOpen(true);
  }

  function handleVerifyReview(review: Review) {
    setSelectedReview(review);
    setIsVerifyDialogOpen(true);
  }

  function handleDeleteReview(review: Review) {
    setSelectedReview(review);
    setIsDeleteDialogOpen(true);
  }

  // Filter reviews based on search query, star filter, and tab
  const filteredReviews = reviews?.filter(review => {
    // Search query filter
    const matchesSearch = !searchQuery || 
      (review.comment && review.comment.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Star filter
    const matchesStarFilter = starFilter === null || review.rating === starFilter;
    
    // Tab filter
    const matchesTab = 
      (currentTab === "all") ||
      (currentTab === "verified" && review.verified) ||
      (currentTab === "unverified" && !review.verified) ||
      (currentTab === "responded" && review.response) ||
      (currentTab === "unresponded" && !review.response);
    
    return matchesSearch && matchesStarFilter && matchesTab;
  }) || [];

  // Get customer name by contact ID
  const getCustomerName = (contactId: number) => {
    const contact = contacts?.find(c => c.id === contactId);
    return contact 
      ? contact.type === "commercial" && contact.companyName
        ? contact.companyName
        : `${contact.firstName} ${contact.lastName}`
      : `Contact #${contactId}`;
  };

  // Calculate review statistics
  const getStats = () => {
    if (!reviews || reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        verifiedCount: 0,
        starDistribution: [0, 0, 0, 0, 0],
      };
    }

    const totalReviews = reviews.length;
    const totalStars = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalStars / totalReviews;
    const verifiedCount = reviews.filter(review => review.verified).length;
    
    // Calculate star distribution
    const starDistribution = Array(5).fill(0);
    reviews.forEach(review => {
      starDistribution[review.rating - 1]++;
    });
    
    // Convert to percentages
    const starPercentages = starDistribution.map(count => 
      totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
    );
    
    return {
      totalReviews,
      averageRating,
      verifiedCount,
      starDistribution: starPercentages,
    };
  };

  const stats = getStats();
  
  // Service type options
  const serviceTypeOptions = [
    "ac_repair",
    "ac_maintenance",
    "ac_installation",
    "heating_repair",
    "heating_maintenance",
    "heating_installation",
    "duct_cleaning",
    "duct_repair",
    "thermostat_installation",
    "air_quality",
    "other"
  ];

  return (
    <MainLayout>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Review
        </Button>
      </div>

      {/* Review statistics */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Rating summary */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</span>
                <span className="text-lg text-gray-500 ml-1">/5</span>
              </div>
              <div className="flex mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon 
                    key={star} 
                    className={`h-5 w-5 ${star <= Math.round(stats.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
              {stats.verifiedCount > 0 && (
                <div className="flex items-center mt-2 text-green-600 text-sm">
                  <BadgeCheckIcon className="h-4 w-4 mr-1" />
                  <span>{stats.verifiedCount} verified</span>
                </div>
              )}
            </div>
            
            {/* Star breakdown */}
            <div className="col-span-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center mb-2">
                  <div className="w-12 flex justify-end mr-2 text-sm">
                    {star} <StarIcon className="h-3 w-3 ml-1 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary rounded-full h-2.5" 
                      style={{ width: `${stats.starDistribution[star - 1]}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-xs text-gray-500 ml-2">
                    {stats.starDistribution[star - 1]}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex space-x-1">
              {[null, 5, 4, 3, 2, 1].map((stars) => (
                <Button
                  key={stars === null ? 'all' : stars}
                  variant={starFilter === stars ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStarFilter(stars)}
                  className={stars === null ? "px-3" : "px-2"}
                >
                  {stars === null ? (
                    "All"
                  ) : (
                    <>
                      {stars} <StarIcon className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and reviews list */}
      <Card>
        <CardHeader>
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList>
              <TabsTrigger value="all">All Reviews</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="unverified">Unverified</TabsTrigger>
              <TabsTrigger value="responded">Responded</TabsTrigger>
              <TabsTrigger value="unresponded">Unresponded</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-4">Loading reviews...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-10">
              <StarIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || starFilter !== null || currentTab !== "all" 
                  ? "No reviews match your search criteria." 
                  : "You haven't received any reviews yet."}
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setStarFilter(null);
                setCurrentTab("all");
              }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-5 relative">
                  {/* Header - Customer info and rating */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium">{getCustomerName(review.contactId)}</div>
                        <div className="text-xs text-gray-500">
                          {review.date ? formatDistanceToNow(new Date(review.date), { addSuffix: true }) : 'Unknown date'}
                        </div>
                      </div>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon 
                          key={star} 
                          className={`h-5 w-5 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Verification badge */}
                  {review.verified && (
                    <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
                      <BadgeCheckIcon className="h-3 w-3 mr-1" />
                      Verified
                    </div>
                  )}
                  
                  {/* Review content */}
                  <div className="mb-3">
                    <p className="text-gray-700">
                      {review.comment || <span className="text-gray-400 italic">No comment provided</span>}
                    </p>
                  </div>
                  
                  {/* Service info */}
                  {review.serviceType && (
                    <div className="mb-3 text-xs text-primary font-medium flex items-center">
                      <span className="material-icons text-xs mr-1">thumb_up</span>
                      <span className="capitalize">{review.serviceType.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  
                  {/* Job reference */}
                  {review.jobId && jobs?.find(j => j.id === review.jobId) && (
                    <div className="mb-3 text-xs text-gray-500">
                      Job Reference: #{jobs.find(j => j.id === review.jobId)?.jobNumber}
                    </div>
                  )}
                  
                  {/* Response */}
                  {review.response && (
                    <div className="mt-4 bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center mb-1 text-gray-700">
                        <QuoteIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Your Response</span>
                      </div>
                      <p className="text-sm text-gray-600">{review.response}</p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="mt-4 flex justify-end space-x-2">
                    {!review.verified && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleVerifyReview(review)}
                      >
                        <BadgeCheckIcon className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRespondToReview(review)}
                    >
                      <ReplyIcon className="h-4 w-4 mr-1" />
                      {review.response ? 'Edit Response' : 'Respond'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteReview(review)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add review dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Customer Review</DialogTitle>
            <DialogDescription>
              Manually add a customer review to your business.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contacts?.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {contact.firstName} {contact.lastName}
                              {contact.companyName && ` (${contact.companyName})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="jobId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Job (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a job (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {jobs?.map((job) => (
                            <SelectItem key={job.id} value={job.id.toString()}>
                              #{job.jobNumber} - {job.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addForm.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => field.onChange(star)}
                        >
                          <StarIcon 
                            className={`h-8 w-8 ${star <= field.value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                          />
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceTypeOptions.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Comment</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter customer's review comment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="verified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Verified Review</FormLabel>
                      <FormDescription>
                        Mark this review as verified if it was collected through an official review process.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Adding..." : "Add Review"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Respond to review dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Your response will be visible to customers.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <>
              {/* Original review */}
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="flex items-center mb-2">
                  <div className="text-sm font-medium">{getCustomerName(selectedReview.contactId)}</div>
                  <div className="flex ml-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon 
                        key={star} 
                        className={`h-3 w-3 ${star <= selectedReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedReview.comment || <span className="italic">No comment provided</span>}
                </p>
              </div>
              
              <Form {...responseForm}>
                <form onSubmit={responseForm.handleSubmit(onResponseSubmit)} className="space-y-4">
                  <FormField
                    control={responseForm.control}
                    name="response"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Response</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write your response to the customer review" 
                            {...field} 
                            rows={5}
                          />
                        </FormControl>
                        <FormDescription>
                          Keep your response professional and address any concerns raised in the review.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsResponseDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? "Saving..." : "Save Response"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify review dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this review as verified? This indicates the review is authentic.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <>
              <div className="flex items-center my-2">
                <div className="font-medium">{getCustomerName(selectedReview.contactId)}</div>
                <div className="flex ml-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon 
                      key={star} 
                      className={`h-3 w-3 ${star <= selectedReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    updateMutation.mutate({
                      id: selectedReview.id,
                      data: { verified: true },
                    });
                  }}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Verifying..." : "Verify Review"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedReview && deleteMutation.mutate(selectedReview.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
