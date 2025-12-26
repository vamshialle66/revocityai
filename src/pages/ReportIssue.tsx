import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ComplaintForm from "@/components/ComplaintForm";
import { AlertTriangle, MapPin, Camera, Send } from "lucide-react";

const ReportIssue = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-28 pb-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Report Waste Issue
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Help keep your city clean! Report overflowing bins, illegal dumping, or unhygienic waste conditions. 
            Our AI will analyze the issue and alert the authorities immediately.
          </p>
        </div>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">1. Take Photo</h3>
            <p className="text-sm text-muted-foreground">
              Capture a clear photo of the waste issue
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">2. Add Location</h3>
            <p className="text-sm text-muted-foreground">
              We'll automatically detect your GPS location
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">3. Submit Report</h3>
            <p className="text-sm text-muted-foreground">
              AI analyzes & alerts authorities instantly
            </p>
          </div>
        </div>

        {/* Complaint Form */}
        <div className="max-w-2xl mx-auto">
          <ComplaintForm 
            onSubmitSuccess={() => {
              // Could add additional success handling here
            }} 
          />
        </div>
      </main>
    </div>
  );
};

export default ReportIssue;
