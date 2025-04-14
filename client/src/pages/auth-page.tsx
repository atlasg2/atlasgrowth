import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser, loginSchema, LoginData } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest } from "../lib/queryClient";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

// Extended schema for registration with validation
const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  email: z.string().email("Please enter a valid email"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [location] = useLocation();
  const [isProspectLogin, setIsProspectLogin] = useState(false);
  const [prospectName, setProspectName] = useState("");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  // Get slug from URL (it's the part after the domain, e.g., yourdomain.com/their-slug)
  const slug = location.substring(1); // Remove the leading slash

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "contractor",
    },
  });
  
  // Check if the current URL contains a slug that matches a contractor
  useEffect(() => {
    async function checkSlug() {
      // Only proceed if there's a slug in the URL
      if (!slug || slug === 'auth') {
        return;
      }
      
      setIsCheckingSlug(true);
      
      try {
        // Call the API to check if the slug exists and is a prospect
        const response = await apiRequest("GET", `/api/contractor-by-slug/${slug}`);
        const data = await response.json();
        
        if (data.isProspect) {
          // If it's a prospect, set up auto-login
          setIsProspectLogin(true);
          setProspectName(data.name);
          
          // Populate the form with the slug as both username and password
          loginForm.setValue("username", slug);
          loginForm.setValue("password", slug);
        }
      } catch (error) {
        console.error("Error checking slug:", error);
      } finally {
        setIsCheckingSlug(false);
      }
    }
    
    checkSlug();
  }, [slug, loginForm]);

  function onLoginSubmit(data: LoginData) {
    loginMutation.mutate(data);
  }

  function onRegisterSubmit(data: RegisterFormValues) {
    // Remove confirmPassword before sending
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  }

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Auth form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded bg-primary flex items-center justify-center text-white mr-2">
                <span className="material-icons text-2xl">ac_unit</span>
              </div>
              <h2 className="text-2xl font-bold">HVAC Pro</h2>
            </div>
            {isProspectLogin ? (
              <>
                <CardTitle className="text-2xl">Welcome {prospectName}!</CardTitle>
                <CardDescription>
                  Your account is ready to explore. Just click the button below to log in.
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">Welcome</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {isCheckingSlug ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : isProspectLogin ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                    This is your first time logging in. Your username and password have been pre-filled.
                    You can change your password after logging in.
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : "Access Your Dashboard"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              {activeTab === "login" ? (
                <>Don't have an account? <Button variant="link" className="p-0" onClick={() => setActiveTab("register")}>Register</Button></>
              ) : (
                <>Already have an account? <Button variant="link" className="p-0" onClick={() => setActiveTab("login")}>Sign in</Button></>
              )}
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Hero section */}
      <div className="w-full md:w-1/2 bg-primary p-8 flex items-center justify-center">
        <div className="max-w-lg text-white">
          <h1 className="text-4xl font-bold mb-4">HVAC Pro</h1>
          <p className="text-xl mb-6">The all-in-one SaaS platform for HVAC contractors</p>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="material-icons mr-2 text-white text-opacity-80">check_circle</span>
              <span>Manage customer information and job history</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons mr-2 text-white text-opacity-80">check_circle</span>
              <span>Track jobs, create estimates, and schedule work orders</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons mr-2 text-white text-opacity-80">check_circle</span>
              <span>Generate invoices and process payments</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons mr-2 text-white text-opacity-80">check_circle</span>
              <span>Collect and display customer reviews</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons mr-2 text-white text-opacity-80">check_circle</span>
              <span>Real-time customer communication</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
