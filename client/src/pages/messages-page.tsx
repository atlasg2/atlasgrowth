import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message, InsertMessage, insertMessageSchema, Contact } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistanceToNow } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  SearchIcon, 
  UserIcon,
  SendIcon,
  PaperclipIcon,
  PhoneIcon,
  MailIcon,
  CheckIcon,
  MoreHorizontalIcon,
  ArrowLeftIcon,
} from "lucide-react";

// Message form schema
const messageFormSchema = insertMessageSchema.extend({
  content: z.string().min(1, "Message cannot be empty"),
}).omit({ userId: true, timestamp: true, isRead: true, type: true });

type MessageFormValues = z.infer<typeof messageFormSchema>;

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showContactList, setShowContactList] = useState(true);

  // Fetch messages
  const { data: messages, isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: !!user?.contractorId,
    refetchInterval: 10000, // Poll for new messages every 10 seconds
  });

  // Fetch contacts
  const { data: contacts, isLoading: isContactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    enabled: !!user?.contractorId,
  });

  // Message form
  const messageForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      contactId: undefined,
      content: "",
    },
  });

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: async (data: MessageFormValues) => {
      const response = await apiRequest("POST", "/api/messages", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      messageForm.reset({ content: "", contactId: selectedContactId });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await apiRequest("PATCH", `/api/messages/${id}`, { isRead: true });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  // When a contact is selected, update the form and mark messages as read
  useEffect(() => {
    if (selectedContactId) {
      messageForm.setValue("contactId", selectedContactId);
      
      // Mark unread messages from this contact as read
      messages?.filter(
        m => m.contactId === selectedContactId && !m.isRead && m.userId !== user?.id
      ).forEach(message => {
        markAsReadMutation.mutate({ id: message.id });
      });
      
      // For mobile view, hide contact list when a contact is selected
      if (isMobileView) {
        setShowContactList(false);
      }
    }
  }, [selectedContactId, messages, messageForm, user?.id]);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedContactId]);

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    
    return () => {
      window.removeEventListener("resize", checkMobileView);
    };
  }, []);

  // Handle message submission
  function onMessageSubmit(data: MessageFormValues) {
    if (!user?.contractorId) return;
    
    createMessageMutation.mutate({
      ...data,
      contractorId: user.contractorId,
    });
  }

  // Group contacts with messages
  const contactsWithMessages = contacts?.map(contact => {
    const contactMessages = messages?.filter(m => m.contactId === contact.id) || [];
    const lastMessage = contactMessages.length > 0 
      ? contactMessages.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0] 
      : null;
    const unreadCount = contactMessages.filter(m => !m.isRead && m.userId !== user?.id).length;
    
    return {
      contact,
      lastMessage,
      unreadCount,
      messageCount: contactMessages.length,
    };
  }).filter(item => 
    // Show contacts with messages or matching search
    item.messageCount > 0 || 
    (searchQuery && (
      item.contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.contact.companyName && item.contact.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
    ))
  ).sort((a, b) => {
    // Sort by unread messages first, then by most recent message
    if (a.unreadCount !== b.unreadCount) {
      return b.unreadCount - a.unreadCount;
    }
    
    if (a.lastMessage && b.lastMessage) {
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
    }
    
    return 0;
  }) || [];

  // Get messages for selected contact
  const selectedContactMessages = selectedContactId 
    ? messages?.filter(m => m.contactId === selectedContactId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];
  
  // Get selected contact details
  const selectedContact = contacts?.find(c => c.id === selectedContactId);

  // Group messages by date
  const groupedMessages: { [key: string]: Message[] } = {};
  selectedContactMessages?.forEach(message => {
    const dateStr = format(new Date(message.timestamp), "yyyy-MM-dd");
    if (!groupedMessages[dateStr]) {
      groupedMessages[dateStr] = [];
    }
    groupedMessages[dateStr].push(message);
  });

  return (
    <MainLayout>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      {/* Messages interface */}
      <Card className="h-[calc(100vh-12rem)] overflow-hidden">
        <div className="flex h-full">
          {/* Contact list - left column */}
          {(!isMobileView || (isMobileView && showContactList)) && (
            <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {isContactsLoading || isMessagesLoading ? (
                  <div className="text-center p-4">Loading contacts...</div>
                ) : contactsWithMessages.length === 0 ? (
                  <div className="text-center p-4 text-gray-500">
                    {searchQuery 
                      ? "No contacts match your search." 
                      : "No messages yet. Start a conversation with a contact."}
                  </div>
                ) : (
                  <div>
                    {contactsWithMessages.map(({ contact, lastMessage, unreadCount }) => (
                      <div 
                        key={contact.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedContactId === contact.id ? 'bg-gray-50' : ''}`}
                        onClick={() => setSelectedContactId(contact.id)}
                      >
                        <div className="flex items-start">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0">
                            {contact.type === 'commercial' ? (
                              <span className="material-icons text-sm">business</span>
                            ) : (
                              <span>{contact.firstName[0]}{contact.lastName[0]}</span>
                            )}
                          </div>
                          
                          <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex justify-between">
                              <div className="font-medium truncate">
                                {contact.type === 'commercial' && contact.companyName 
                                  ? contact.companyName 
                                  : `${contact.firstName} ${contact.lastName}`}
                              </div>
                              {lastMessage && (
                                <div className="text-xs text-gray-500 ml-1 whitespace-nowrap">
                                  {format(new Date(lastMessage.timestamp), "h:mm a")}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center mt-1">
                              {lastMessage ? (
                                <div className={`text-sm truncate mr-2 ${unreadCount > 0 && lastMessage.userId !== user?.id ? 'font-semibold' : 'text-gray-500'}`}>
                                  {lastMessage.userId === user?.id ? 'You: ' : ''}
                                  {lastMessage.content}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 italic">No messages yet</div>
                              )}
                              
                              {unreadCount > 0 && (
                                <div className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                  {unreadCount}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Messages - right column */}
          <div className={`w-full ${(!isMobileView || (isMobileView && !showContactList)) ? 'md:w-2/3' : 'hidden'} flex flex-col`}>
            {selectedContactId && selectedContact ? (
              <>
                {/* Contact header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    {isMobileView && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mr-2" 
                        onClick={() => setShowContactList(true)}
                      >
                        <ArrowLeftIcon className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                      {selectedContact.type === 'commercial' ? (
                        <span className="material-icons text-sm">business</span>
                      ) : (
                        <span>{selectedContact.firstName[0]}{selectedContact.lastName[0]}</span>
                      )}
                    </div>
                    
                    <div className="ml-3">
                      <div className="font-medium">
                        {selectedContact.type === 'commercial' && selectedContact.companyName 
                          ? selectedContact.companyName 
                          : `${selectedContact.firstName} ${selectedContact.lastName}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedContact.email || selectedContact.phone || ''}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex">
                    {selectedContact.phone && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`tel:${selectedContact.phone}`}>
                          <PhoneIcon className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    
                    {selectedContact.email && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`mailto:${selectedContact.email}`}>
                          <MailIcon className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    
                    <Button variant="ghost" size="sm">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {Object.keys(groupedMessages).length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="mb-2">👋</div>
                        <p>No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                      </div>
                    </div>
                  ) : (
                    Object.entries(groupedMessages).map(([date, dayMessages]) => (
                      <div key={date} className="space-y-3">
                        <div className="flex justify-center">
                          <div className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                            {new Date(date).toDateString() === new Date().toDateString()
                              ? 'Today'
                              : format(new Date(date), 'MMM d, yyyy')}
                          </div>
                        </div>
                        
                        {dayMessages.map(message => (
                          <div 
                            key={message.id} 
                            className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[75%] px-4 py-2 rounded-lg ${
                                message.userId === user?.id 
                                  ? 'bg-primary text-white rounded-br-none' 
                                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
                              }`}
                            >
                              <div className="text-sm">{message.content}</div>
                              <div className={`text-xs mt-1 flex items-center justify-end ${
                                message.userId === user?.id ? 'text-primary-foreground/70' : 'text-gray-500'
                              }`}>
                                {format(new Date(message.timestamp), 'h:mm a')}
                                {message.userId === user?.id && (
                                  <CheckIcon className={`h-3 w-3 ml-1 ${message.isRead ? 'text-green-400' : ''}`} />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Message input */}
                <div className="p-4 border-t border-gray-200">
                  <form 
                    onSubmit={messageForm.handleSubmit(onMessageSubmit)}
                    className="flex items-center"
                  >
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 rounded-full"
                    >
                      <PaperclipIcon className="h-5 w-5" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      className="flex-1 mx-2"
                      {...messageForm.register("content")}
                    />
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="rounded-full p-2" 
                      disabled={createMessageMutation.isPending || !messageForm.watch("content")}
                    >
                      <SendIcon className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="material-icons text-6xl mb-2">chat</div>
                  <p className="text-lg">Select a contact to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </MainLayout>
  );
}
