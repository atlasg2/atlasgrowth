import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import DashboardPage from "@/pages/dashboard-page";

// This component shows a contractor's dashboard view to an admin user
export default function ContractorPreviewPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [contractor, setContractor] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is admin, if not redirect to login
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (user.role !== "admin") {
      navigate("/");
      return;
    }
  }, [user, navigate]);
  
  // Fetch contractor data
  useEffect(() => {
    if (!slug) return;
    
    async function fetchContractor() {
      try {
        setLoading(true);
        const response = await fetch(`/api/contractors?slug=${slug}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch contractor data");
        }
        
        const contractors = await response.json();
        if (contractors.length === 0) {
          throw new Error("Contractor not found");
        }
        
        setContractor(contractors[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    
    fetchContractor();
  }, [slug]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
        <span className="ml-2">Loading contractor preview...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => navigate("/atlas")}
        >
          Return to Atlas Dashboard
        </button>
      </div>
    );
  }
  
  if (!contractor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">Contractor Not Found</p>
          <p>The contractor with slug "{slug}" was not found.</p>
        </div>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => navigate("/atlas")}
        >
          Return to Atlas Dashboard
        </button>
      </div>
    );
  }
  
  // Preview banner to show we're in preview mode
  const PreviewBanner = () => (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-2 flex justify-between items-center z-50">
      <div>
        <span className="font-bold">PREVIEW MODE:</span> Viewing as {contractor.name}
      </div>
      <button 
        className="bg-white text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100"
        onClick={() => navigate("/atlas")}
      >
        Exit Preview
      </button>
    </div>
  );
  
  // Return the dashboard with the preview banner at the top
  return (
    <>
      <PreviewBanner />
      <div className="pt-12"> {/* Add padding to account for the banner */}
        <DashboardPage previewMode={true} previewData={contractor} />
      </div>
    </>
  );
}