import { useState, useCallback, useEffect } from "react";
import { MapPin, Navigation, Loader2, CheckCircle2, MessageSquare, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import ImageUpload from "./ImageUpload";
import AnalysisResultPanel, { ComprehensiveAnalysis } from "./AnalysisResultPanel";

interface ImageValidationResult {
  is_valid: boolean;
  is_garbage_bin_related: boolean;
  authenticity_score: number;
  manipulation_detected: boolean;
  is_stock_image: boolean;
  is_ai_generated: boolean;
  content_type: string;
  trust_impact: number;
  flags: string[];
  confidence: number;
  reason: string;
}

interface ComplaintFormProps {
  onSubmitSuccess?: (complaintId: string) => void;
}

const ComplaintForm = ({ onSubmitSuccess }: ComplaintFormProps) => {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ComprehensiveAnalysis | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState<string | null>(null);
  
  // Image validation state
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageValidation, setImageValidation] = useState<ImageValidationResult | null>(null);
  
  // Location state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [areaName, setAreaName] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [reporterNotes, setReporterNotes] = useState("");

  // Check for pending analysis from Index page
  useEffect(() => {
    const pendingData = sessionStorage.getItem('pendingAnalysis');
    if (pendingData) {
      try {
        const { analysis, image } = JSON.parse(pendingData);
        setAnalysisResult(analysis);
        setSelectedImage(image);
        sessionStorage.removeItem('pendingAnalysis');
        toast.success("Analysis loaded! Now add your location to submit.");
      } catch (error) {
        console.error("Failed to load pending analysis:", error);
      }
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        // Try to reverse geocode
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          if (data.display_name) {
            setAddress(data.display_name);
          }
          if (data.address) {
            setAreaName(
              data.address.suburb ||
                data.address.neighbourhood ||
                data.address.city_district ||
                data.address.city ||
                ""
            );
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
        }

        setIsGettingLocation(false);
        toast.success("Location captured successfully!");
      },
      (error) => {
        setLocationError(error.message);
        setIsGettingLocation(false);
        toast.error("Failed to get location: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Handle image selection - validate first
  const handleImageSelect = useCallback(async (file: File, preview: string) => {
    setSelectedImage(preview);
    setAnalysisResult(null);
    setSubmitted(false);
    setImageValidation(null);
    
    // Auto-validate image
    setIsValidatingImage(true);
    try {
      const base64Data = preview.split(",")[1];
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-image`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Data }),
        }
      );

      if (!response.ok) {
        throw new Error("Validation failed");
      }

      const result: ImageValidationResult = await response.json();
      setImageValidation(result);
      
      if (!result.is_valid || !result.is_garbage_bin_related) {
        toast.error(result.reason || "Image may not be valid for a waste complaint");
      } else if (result.authenticity_score >= 70) {
        toast.success("Image validated successfully!");
      } else {
        toast.warning("Image quality is low, but you can proceed");
      }
    } catch (error) {
      console.error("Validation error:", error);
      // Don't block on validation errors - allow to proceed
      setImageValidation({
        is_valid: true,
        is_garbage_bin_related: true,
        authenticity_score: 70,
        manipulation_detected: false,
        is_stock_image: false,
        is_ai_generated: false,
        content_type: "unclear",
        trust_impact: 0,
        flags: ["Validation service unavailable"],
        confidence: 50,
        reason: "Could not validate, proceeding with caution"
      });
    } finally {
      setIsValidatingImage(false);
    }
  }, []);

  // Clear image
  const handleClearImage = useCallback(() => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setImageValidation(null);
  }, []);

  // Analyze bin image
  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const base64Data = selectedImage.split(",")[1];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-bin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Data }),
        }
      );

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      
      // Check if we got the new comprehensive format
      if (data.bin_status) {
        setAnalysisResult(data as ComprehensiveAnalysis);
      } else {
        // Fallback for old format - convert to new format
        const priority = data.priority || (data.status === "overflowing" 
          ? (data.percentage >= 90 ? "critical" : "high")
          : data.status === "half-filled" 
            ? "medium" 
            : "low");

        const fallbackAnalysis: ComprehensiveAnalysis = {
          bin_status: {
            status: data.status || "partial",
            fill_percentage: data.percentage || 50,
            condition_clarity: "clear"
          },
          hygiene_assessment: {
            odor_risk: data.health_risks?.odor_risk || "low",
            pest_risk: data.health_risks?.mosquito_risk || "low",
            public_health_threat: data.health_risks?.disease_risk || "low",
            surrounding_cleanliness: "clean"
          },
          environmental_impact: {
            pollution_chance: "low",
            litter_spread_risk: data.status === "overflowing" ? "high" : "low",
            impact_level: data.status === "overflowing" ? "concerning" : "minor"
          },
          priority_urgency: {
            priority_level: priority,
            urgency_hours: priority === "critical" ? 2 : priority === "high" ? 12 : 48,
            urgency_message: priority === "critical" ? "Immediate action required" : 
                            priority === "high" ? "Should be cleaned within 12 hours" : 
                            "Can be monitored"
          },
          suggested_actions: [data.recommendation || "Schedule regular pickup"],
          confidence: { score: 85 },
          smart_insights: [],
          recommendation: data.recommendation || "Monitor bin status",
          details: data.details || ""
        };
        setAnalysisResult(fallbackAnalysis);
      }
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Failed to analyze image");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit complaint
  const submitComplaint = async () => {
    if (!user || !latitude || !longitude || !analysisResult) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Map comprehensive analysis to complaint format
      const status = analysisResult.bin_status.status === "empty" ? "empty" :
                     analysisResult.bin_status.status === "partial" ? "half-filled" : "overflowing";
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complaints`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submit",
            firebaseUid: user.uid,
            email: user.email,
            latitude,
            longitude,
            address,
            areaName,
            imageUrl: selectedImage,
            status,
            fillLevel: analysisResult.bin_status.fill_percentage,
            priority: analysisResult.priority_urgency.priority_level,
            hygieneRisk: analysisResult.hygiene_assessment.public_health_threat,
            recommendations: analysisResult.suggested_actions,
            confidence: analysisResult.confidence.score,
            healthRisks: {
              mosquito_risk: analysisResult.hygiene_assessment.pest_risk,
              odor_risk: analysisResult.hygiene_assessment.odor_risk,
              disease_risk: analysisResult.hygiene_assessment.public_health_threat,
              public_hygiene_impact: analysisResult.environmental_impact.impact_level
            },
            reporterNotes: reporterNotes.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit complaint");
      }

      const data = await response.json();
      setSubmitted(true);
      setComplaintId(data.complaint.complaint_id);
      
      // Show points earned
      if (data.pointsAwarded) {
        toast.success(`Complaint submitted! You earned ${data.pointsAwarded} points! 🎉`);
      } else {
        toast.success(`Complaint submitted! ID: ${data.complaint.complaint_id}`);
      }
      onSubmitSuccess?.(data.complaint.complaint_id);
    } catch (error) {
      toast.error("Failed to submit complaint");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted && complaintId) {
    return (
      <Card className="glass-card border-neon-green/50 animate-fade-in">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="w-16 h-16 text-neon-green mx-auto mb-4" />
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            Complaint Submitted!
          </h3>
          <p className="text-muted-foreground mb-4">
            Your complaint has been registered and authorities have been notified.
          </p>
          <Badge className="text-lg px-4 py-2 bg-primary/20 text-primary border-primary/30">
            {complaintId}
          </Badge>
          <Button
            onClick={() => {
              setSubmitted(false);
              setSelectedImage(null);
              setAnalysisResult(null);
              setLatitude(null);
              setLongitude(null);
              setAddress("");
              setAreaName("");
            }}
            className="mt-6 w-full"
            variant="outline"
          >
            Submit Another Report
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Report Waste Issue
        </CardTitle>
        <CardDescription>
          Upload a photo and capture location to report overflowing bins
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Capture Location */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              1
            </span>
            Capture Location
          </Label>
          
          <Button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            variant={latitude ? "outline" : "default"}
            className="w-full"
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : latitude ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-neon-green" />
                Location Captured
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Get My Location
              </>
            )}
          </Button>

          {latitude && longitude && (
            <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coordinates:</span>
                <span className="font-mono">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              </div>
              {address && (
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p className="text-sm mt-1">{address}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="area" className="text-xs text-muted-foreground">Area Name</Label>
              <Input
                id="area"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="e.g., Downtown, Sector 5"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="manual-coords" className="text-xs text-muted-foreground">Manual Entry (optional)</Label>
              <Input
                id="manual-coords"
                placeholder="lat, lng"
                className="mt-1"
                onChange={(e) => {
                  const [lat, lng] = e.target.value.split(",").map(Number);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    setLatitude(lat);
                    setLongitude(lng);
                  }
                }}
              />
            </div>
          </div>

          {locationError && (
            <p className="text-destructive text-sm">{locationError}</p>
          )}
        </div>

        {/* Step 2: Upload Image */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              2
            </span>
            Upload Bin Photo
          </Label>
          
          <ImageUpload 
            onImageSelect={handleImageSelect} 
            selectedImage={selectedImage}
            onClear={handleClearImage}
          />
          
          {/* Image Validation Result */}
          {isValidatingImage && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">Validating image...</p>
                <p className="text-xs text-muted-foreground">Checking authenticity and relevance</p>
              </div>
            </div>
          )}

          {imageValidation && !isValidatingImage && (
            <div className={`p-3 rounded-lg border ${
              imageValidation.is_valid && imageValidation.is_garbage_bin_related && imageValidation.authenticity_score >= 70
                ? 'bg-green-500/10 border-green-500/30'
                : imageValidation.is_valid && imageValidation.is_garbage_bin_related
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {imageValidation.is_valid && imageValidation.is_garbage_bin_related && imageValidation.authenticity_score >= 70 ? (
                  <ShieldCheck className="w-5 h-5 text-green-500 mt-0.5" />
                ) : imageValidation.is_valid && imageValidation.is_garbage_bin_related ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${
                      imageValidation.is_valid && imageValidation.is_garbage_bin_related && imageValidation.authenticity_score >= 70
                        ? 'text-green-500'
                        : imageValidation.is_valid && imageValidation.is_garbage_bin_related
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}>
                      {imageValidation.is_valid && imageValidation.is_garbage_bin_related && imageValidation.authenticity_score >= 70
                        ? 'Image Verified'
                        : imageValidation.is_valid && imageValidation.is_garbage_bin_related
                        ? 'Low Quality Image'
                        : 'Invalid Image'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {imageValidation.authenticity_score}% authentic
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{imageValidation.reason}</p>
                  
                  {imageValidation.flags && imageValidation.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {imageValidation.flags.map((flag, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-background/50">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {imageValidation.manipulation_detected && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Possible image manipulation detected</p>
                  )}
                  {imageValidation.is_ai_generated && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Image appears to be AI-generated</p>
                  )}
                  {imageValidation.is_stock_image && (
                    <p className="text-xs text-orange-500 mt-1">⚠️ This may be a stock image</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {selectedImage && !analysisResult && imageValidation && (
            <Button
              onClick={analyzeImage}
              disabled={isAnalyzing || !imageValidation.is_valid || !imageValidation.is_garbage_bin_related}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : !imageValidation.is_valid || !imageValidation.is_garbage_bin_related ? (
                "Upload a valid garbage bin image"
              ) : (
                "Analyze Bin Condition"
              )}
            </Button>
          )}
        </div>

        {/* Step 3: Analysis Result */}
        {analysisResult && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                3
              </span>
              AI Analysis Result
            </Label>
            
            <AnalysisResultPanel data={analysisResult} isAnalyzing={false} showReportButton={false} />
          </div>
        )}

        {/* Step 4: Additional Notes (Optional) */}
        {analysisResult && latitude && longitude && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                4
              </span>
              Additional Notes (Optional)
            </Label>
            
            <div className="p-4 rounded-xl bg-card/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add any additional information</span>
              </div>
              <Textarea
                value={reporterNotes}
                onChange={(e) => setReporterNotes(e.target.value)}
                placeholder="Describe any additional details about the issue, e.g., how long it has been there, any hazards, or special concerns..."
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {reporterNotes.length}/500 characters
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {analysisResult && latitude && longitude && (
          <Button
            onClick={submitComplaint}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
            variant="neon"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting Report...
              </>
            ) : (
              "Submit Complaint Report"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ComplaintForm;
