import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Appointment, InsertAppointment, insertAppointmentSchema, Contact, Job } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, getDay, addDays, differenceInDays } from "date-fns";
import StatusBadge from "@/components/ui/status-badge";

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusIcon, 
  CalendarIcon, 
  ClockIcon,
  UserIcon,
  BuildingIcon,
  MapPinIcon,
  EditIcon, 
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

// Extend appointment schema for form validation
const appointmentFormSchema = insertAppointmentSchema.extend({
  contactId: z.number({ required_error: "Please select a customer" }),
  title: z.string().min(1, "Title is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
}).refine(data => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export default function SchedulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<string>("day");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [currentDay, setCurrentDay] = useState<Date>(new Date());

  // Fetch appointments
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    enabled: !!user?.contractorId,
  });

  // Fetch contacts for appointment form
  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    enabled: !!user?.contractorId,
  });
  
  // Fetch jobs for appointment form
  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: !!user?.contractorId,
  });

  // Create form
  const createForm = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      title: "",
      contactId: undefined,
      jobId: undefined,
      description: "",
      status: "pending",
      location: "",
      notes: "",
      startTime: "",
      endTime: "",
    },
  });

  // Edit form
  const editForm = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      title: "",
      contactId: undefined,
      jobId: undefined,
      description: "",
      status: "pending",
      location: "",
      notes: "",
      startTime: "",
      endTime: "",
    },
  });

  // Update form date values when selected date changes
  useEffect(() => {
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    
    // For create form
    createForm.setValue("startTime", `${selectedDateStr}T09:00`);
    createForm.setValue("endTime", `${selectedDateStr}T10:00`);
  }, [selectedDate, createForm]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      const response = await apiRequest("POST", "/api/appointments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment created",
        description: "The appointment has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AppointmentFormValues }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment updated",
        description: "The appointment has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment deleted",
        description: "The appointment has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onCreateSubmit(data: AppointmentFormValues) {
    createMutation.mutate({
      ...data,
      contractorId: user!.contractorId!,
    });
  }

  function onEditSubmit(data: AppointmentFormValues) {
    if (!selectedAppointment) return;
    
    updateMutation.mutate({
      id: selectedAppointment.id,
      data: {
        ...data,
        contractorId: user!.contractorId!,
      },
    });
  }

  function handleEditAppointment(appointment: Appointment) {
    setSelectedAppointment(appointment);
    editForm.reset({
      title: appointment.title,
      contactId: appointment.contactId,
      jobId: appointment.jobId,
      description: appointment.description || "",
      status: appointment.status || "pending",
      location: appointment.location || "",
      notes: appointment.notes || "",
      startTime: format(new Date(appointment.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(appointment.endTime), "yyyy-MM-dd'T'HH:mm"),
    });
    setIsEditDialogOpen(true);
  }

  function handleDeleteAppointment(appointment: Appointment) {
    setSelectedAppointment(appointment);
    setIsDeleteDialogOpen(true);
  }

  // Filter appointments for the selected date
  const filteredAppointments = appointments?.filter(appointment => {
    const appointmentDate = new Date(appointment.startTime);
    
    if (currentView === "day") {
      // Filter for day view
      return (
        appointmentDate.getDate() === currentDay.getDate() &&
        appointmentDate.getMonth() === currentDay.getMonth() &&
        appointmentDate.getFullYear() === currentDay.getFullYear()
      );
    } else if (currentView === "week") {
      // Filter for week view
      const startOfWeek = startOfDay(currentDay);
      let dayOfWeek = getDay(startOfWeek);
      if (dayOfWeek === 0) dayOfWeek = 7; // Make Sunday the last day of the week
      const weekStart = addDays(startOfWeek, -dayOfWeek + 1); // Start from Monday
      const weekEnd = addDays(weekStart, 6); // End on Sunday
      
      return (
        appointmentDate >= weekStart &&
        appointmentDate <= endOfDay(weekEnd)
      );
    } else {
      // Filter for month view
      return (
        appointmentDate.getMonth() === currentMonth.getMonth() &&
        appointmentDate.getFullYear() === currentMonth.getFullYear()
      );
    }
  })?.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];

  // Generate day cells for month view
  const generateMonthView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = monthStart;
    const endDate = monthEnd;
    
    let day = startDate;
    const days = [];
    
    // Adjust start date to begin with Monday
    let dayOfWeek = getDay(startDate);
    if (dayOfWeek === 0) dayOfWeek = 7; // Make Sunday the last day of the week
    day = addDays(startDate, -dayOfWeek + 1);
    
    // Generate 6 weeks of days
    for (let i = 0; i < 42; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    return days;
  };
  
  // Get customer name by contact ID
  const getCustomerName = (contactId: number) => {
    const contact = contacts?.find(c => c.id === contactId);
    return contact 
      ? contact.type === "commercial" && contact.companyName
        ? contact.companyName
        : `${contact.firstName} ${contact.lastName}`
      : `Contact #${contactId}`;
  };

  // Get appointments for a specific day in month view
  const getAppointmentsForDay = (day: Date) => {
    return appointments?.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return (
        appointmentDate.getDate() === day.getDate() &&
        appointmentDate.getMonth() === day.getMonth() &&
        appointmentDate.getFullYear() === day.getFullYear()
      );
    }) || [];
  };

  return (
    <MainLayout>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <Button onClick={() => {
          setSelectedDate(new Date());
          setIsCreateDialogOpen(true);
        }}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Calendar navigation */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={() => {
                if (currentView === "day") {
                  setCurrentDay(addDays(currentDay, -1));
                } else if (currentView === "week") {
                  setCurrentDay(addDays(currentDay, -7));
                } else {
                  const prevMonth = new Date(currentMonth);
                  prevMonth.setMonth(prevMonth.getMonth() - 1);
                  setCurrentMonth(prevMonth);
                }
              }}>
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {currentView === "day" && format(currentDay, "MMMM d, yyyy")}
                    {currentView === "week" && `Week of ${format(currentDay, "MMMM d, yyyy")}`}
                    {currentView === "month" && format(currentMonth, "MMMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={currentView === "day" ? currentDay : currentMonth}
                    onSelect={(date) => {
                      if (date) {
                        setCurrentDay(date);
                        setCurrentMonth(date);
                        setSelectedDate(date);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Button variant="outline" size="icon" onClick={() => {
                if (currentView === "day") {
                  setCurrentDay(addDays(currentDay, 1));
                } else if (currentView === "week") {
                  setCurrentDay(addDays(currentDay, 7));
                } else {
                  const nextMonth = new Date(currentMonth);
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setCurrentMonth(nextMonth);
                }
              }}>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" onClick={() => {
                const today = new Date();
                setCurrentDay(today);
                setCurrentMonth(today);
                setSelectedDate(today);
              }}>
                Today
              </Button>
            </div>
            
            <Tabs value={currentView} onValueChange={setCurrentView}>
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Calendar content */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center p-8">Loading schedule...</div>
          ) : (
            <>
              {/* Day view */}
              {currentView === "day" && (
                <div className="divide-y divide-gray-200">
                  <div className="p-4 bg-gray-50">
                    <h2 className="text-lg font-semibold">
                      {format(currentDay, "EEEE, MMMM d, yyyy")}
                    </h2>
                  </div>
                  
                  {filteredAppointments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments</h3>
                      <p>There are no appointments scheduled for this day.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setSelectedDate(currentDay);
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        Schedule Appointment
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {filteredAppointments.map((appointment) => (
                        <div key={appointment.id} className="flex flex-col md:flex-row border rounded-md p-4 hover:border-primary transition-colors">
                          <div className="md:w-32 text-sm font-medium">
                            <div className="flex items-center text-gray-600">
                              <ClockIcon className="h-4 w-4 text-amber-500 mr-1" />
                              <div>
                                <div>{format(new Date(appointment.startTime), "h:mm a")}</div>
                                <div>{format(new Date(appointment.endTime), "h:mm a")}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex-1 mt-2 md:mt-0 md:ml-4">
                            <h3 className="font-medium">{appointment.title}</h3>
                            <div className="mt-1 text-sm text-gray-600 flex flex-wrap items-center gap-2">
                              {appointment.contactId && (
                                <div className="flex items-center">
                                  <UserIcon className="h-4 w-4 text-gray-500 mr-1" />
                                  <span>{getCustomerName(appointment.contactId)}</span>
                                </div>
                              )}
                              
                              {appointment.location && (
                                <div className="flex items-center">
                                  <MapPinIcon className="h-4 w-4 text-gray-500 mr-1" />
                                  <span>{appointment.location}</span>
                                </div>
                              )}
                            </div>
                            
                            {appointment.description && (
                              <p className="mt-2 text-sm text-gray-600">{appointment.description}</p>
                            )}
                          </div>
                          
                          <div className="mt-3 md:mt-0 flex items-center">
                            <StatusBadge status={appointment.status} entity="appointment" />
                            <div className="ml-2 flex">
                              <Button variant="ghost" size="sm" onClick={() => handleEditAppointment(appointment)}>
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteAppointment(appointment)}>
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Week view */}
              {currentView === "week" && (
                <div>
                  {/* Week header */}
                  <div className="bg-gray-50 border-b">
                    <div className="grid grid-cols-7 divide-x divide-gray-200">
                      {Array.from({ length: 7 }).map((_, index) => {
                        const day = addDays(
                          (() => {
                            const startOfWeek = startOfDay(currentDay);
                            let dayOfWeek = getDay(startOfWeek);
                            if (dayOfWeek === 0) dayOfWeek = 7; // Make Sunday the last day of the week
                            return addDays(startOfWeek, -dayOfWeek + 1); // Start from Monday
                          })(),
                          index
                        );
                        
                        const isToday = 
                          day.getDate() === new Date().getDate() &&
                          day.getMonth() === new Date().getMonth() &&
                          day.getFullYear() === new Date().getFullYear();
                        
                        return (
                          <div
                            key={index}
                            className={`p-2 text-center ${isToday ? "bg-blue-50" : ""}`}
                          >
                            <div className="font-medium text-sm">{format(day, "EEE")}</div>
                            <div className={`text-xl ${isToday ? "font-semibold text-primary" : ""}`}>
                              {format(day, "d")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Week content */}
                  <div className="min-h-[600px] grid grid-cols-7 divide-x divide-gray-200">
                    {Array.from({ length: 7 }).map((_, index) => {
                      const day = addDays(
                        (() => {
                          const startOfWeek = startOfDay(currentDay);
                          let dayOfWeek = getDay(startOfWeek);
                          if (dayOfWeek === 0) dayOfWeek = 7;
                          return addDays(startOfWeek, -dayOfWeek + 1);
                        })(),
                        index
                      );
                      
                      const dayAppointments = appointments?.filter(appointment => {
                        const appointmentDate = new Date(appointment.startTime);
                        return (
                          appointmentDate.getDate() === day.getDate() &&
                          appointmentDate.getMonth() === day.getMonth() &&
                          appointmentDate.getFullYear() === day.getFullYear()
                        );
                      }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];
                      
                      return (
                        <div key={index} className="p-1">
                          {dayAppointments.length === 0 ? (
                            <div 
                              className="h-full min-h-[100px] flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
                              onClick={() => {
                                setSelectedDate(day);
                                setIsCreateDialogOpen(true);
                              }}
                            >
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Add
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {dayAppointments.map((appointment) => (
                                <div 
                                  key={appointment.id}
                                  className="text-xs p-1 rounded-md bg-primary-light text-white cursor-pointer hover:bg-primary"
                                  onClick={() => handleEditAppointment(appointment)}
                                >
                                  <div className="font-semibold truncate">{appointment.title}</div>
                                  <div>{format(new Date(appointment.startTime), "h:mm a")}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Month view */}
              {currentView === "month" && (
                <div>
                  {/* Month header */}
                  <div className="bg-gray-50 border-b">
                    <div className="grid grid-cols-7 divide-x divide-gray-200">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                        <div key={day} className="p-2 text-center font-medium text-sm">
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Month grid */}
                  <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
                    {generateMonthView().map((day, index) => {
                      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                      const isToday = 
                        day.getDate() === new Date().getDate() &&
                        day.getMonth() === new Date().getMonth() &&
                        day.getFullYear() === new Date().getFullYear();
                      
                      const dayAppointments = getAppointmentsForDay(day);
                      
                      return (
                        <div 
                          key={index}
                          className={`min-h-[100px] p-1 ${isCurrentMonth ? "" : "bg-gray-50"}`}
                          onClick={() => {
                            setCurrentDay(day);
                            setSelectedDate(day);
                            setCurrentView("day");
                          }}
                        >
                          <div className={`text-right p-1 ${isToday ? "font-bold text-primary" : isCurrentMonth ? "" : "text-gray-400"}`}>
                            {format(day, "d")}
                          </div>
                          
                          <div className="space-y-1">
                            {dayAppointments.slice(0, 3).map((appointment) => (
                              <div 
                                key={appointment.id}
                                className="text-xs p-1 rounded-md bg-primary-light text-white truncate"
                              >
                                {format(new Date(appointment.startTime), "h:mm")} {appointment.title}
                              </div>
                            ))}
                            
                            {dayAppointments.length > 3 && (
                              <div className="text-xs text-gray-500 p-1">
                                + {dayAppointments.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create appointment dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for {format(selectedDate, "MMMM d, yyyy")}.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter appointment title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
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
                  control={createForm.control}
                  name="jobId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Job (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any additional notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Appointment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit appointment dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Update appointment details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter appointment title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any additional notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedAppointment && deleteMutation.mutate(selectedAppointment.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
