import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, Shield, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ImageUpload";
import AnalysisResultPanel from "@/components/AnalysisResultPanel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { saveAnalysis } from "@/lib/firestore";
import { supabase } from "@/integrations/supabase/client";

interface ComprehensiveAnalysis {
  bin_status: {
    status: string;
    fill_percentage: number;
    condition_clarity: string;
  };
  hygiene_assessment: {
    odor_risk: string;
    pest_risk: string;
    public_health_threat: string;
    surrounding_cleanliness: string;
  };
  environmental_impact: {
    pollution_chance: string;
    litter_spread_risk: string;
    impact_level: string;
  };
  priority_urgency: {
    priority_level: string;
    urgency_hours: number;
    urgency_message: string;
  };
  suggested_actions: string[];
  confidence: {
    score: number;
    quality_note: string;
  };
  smart_insights: string[];
  recommendation: string;
  details: string;
}

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ComprehensiveAnalysis | null>(null);

  const handleReportIssue = useCallback(() => {
    if (analysisResult && selectedImage) {
      sessionStorage.setItem('pendingAnalysis', JSON.stringify({
        analysis: analysisResult,
        image: selectedImage
      }));
      navigate('/report');
    }
  }, [analysisResult, selectedImage, navigate]);

  const handleImageSelect = useCallback((file: File, preview: string) => {
    setSelectedImage(preview);
    setAnalysisResult(null);
  }, []);

  const handleClearImage = useCallback(() => {
    setSelectedImage(null);
    setAnalysisResult(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedImage || !user) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-bin`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: selectedImage }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      
      if (data.bin_status) {
        setAnalysisResult(data);

        const statusMap: Record<string, 'empty' | 'half-filled' | 'overflowing'> = {
          'empty': 'empty',
          'partial': 'half-filled',
          'full': 'overflowing',
          'overflowing': 'overflowing',
          'hazardous': 'overflowing'
        };
        
        const firestoreStatus = statusMap[data.bin_status.status] || 'half-filled';
        
        await saveAnalysis(
          user.uid,
          selectedImage.substring(0, 100),
          firestoreStatus,
          data.bin_status.fill_percentage,
          data.suggested_actions || [data.recommendation]
        );

        await supabase.from('scan_history').insert({
          user_firebase_uid: user.uid,
          fill_level: data.bin_status.fill_percentage,
          status: firestoreStatus,
          recommendation: data.recommendation || data.suggested_actions?.[0] || '',
          ai_confidence: data.confidence?.score || 0,
          hygiene_risk: data.hygiene_assessment?.public_health_threat || 'low',
          odor_risk: data.hygiene_assessment?.odor_risk || 'low',
          disease_risk: data.hygiene_assessment?.pest_risk || 'low',
          mosquito_risk: data.hygiene_assessment?.pest_risk || 'low',
        });

        toast({
          title: "Analysis Complete",
          description: `Bin is ${data.bin_status.status} (${data.bin_status.fill_percentage}% full)`,
        });
      } else {
        const legacyData: ComprehensiveAnalysis = {
          bin_status: {
            status: data.status || 'partial',
            fill_percentage: data.percentage || 50,
            condition_clarity: 'clear'
          },
          hygiene_assessment: {
            odor_risk: 'low',
            pest_risk: 'low',
            public_health_threat: 'low',
            surrounding_cleanliness: 'clean'
          },
          environmental_impact: {
            pollution_chance: 'low',
            litter_spread_risk: 'low',
            impact_level: 'minor'
          },
          priority_urgency: {
            priority_level: 'medium',
            urgency_hours: 24,
            urgency_message: 'Schedule regular pickup'
          },
          suggested_actions: [data.recommendation || 'No action needed'],
          confidence: { score: 80, quality_note: '' },
          smart_insights: [],
          recommendation: data.recommendation || 'Monitor bin status',
          details: data.details || ''
        };
        
        setAnalysisResult(legacyData);

        const statusMap: Record<string, 'empty' | 'half-filled' | 'overflowing'> = {
          'empty': 'empty',
          'half-filled': 'half-filled',
          'partial': 'half-filled',
          'full': 'overflowing',
          'overflowing': 'overflowing'
        };
        
        const legacyStatus = statusMap[data.status] || 'half-filled';
        
        await saveAnalysis(
          user.uid,
          selectedImage.substring(0, 100),
          legacyStatus,
          data.percentage || 50,
          [data.recommendation]
        );

        await supabase.from('scan_history').insert({
          user_firebase_uid: user.uid,
          fill_level: data.percentage || 50,
          status: legacyStatus,
          recommendation: data.recommendation || '',
          ai_confidence: 80,
        });

        toast({
          title: "Analysis Complete",
          description: `Bin is ${data.status} (${data.percentage}% full)`,
        });
      }

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'Please try again',
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedImage, toast, user]);

  const features = [
    {
      icon: Zap,
      title: "Instant Analysis",
      description: "AI-powered detection in seconds",
    },
    {
      icon: Shield,
      title: "99.5% Accuracy",
      description: "Advanced computer vision",
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Track patterns and insights",
    },
  ];


  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4">
        {/* Subtle gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">
              AI-Powered Smart City Platform
            </span>
          </div>

          {/* Main heading */}
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <span className="text-foreground">Revo</span>
            <span className="text-primary">City</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in leading-relaxed" style={{ animationDelay: "200ms" }}>
            Revolutionary Smart City Solutions
            <span className="block text-lg mt-2 text-muted-foreground/80">Powered by Artificial Intelligence</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Button size="lg" className="px-8 h-12 text-base" onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 h-12 text-base" onClick={() => navigate('/transparency')}>
              View City Stats
            </Button>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "500ms" }}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/40 hover:bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section id="upload-section" className="py-16 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">AI Analysis</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-3">
              Analyze Your Bin
            </h2>
            <p className="text-muted-foreground">
              Upload an image for instant AI-powered waste analysis
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <ImageUpload
              onImageSelect={handleImageSelect}
              selectedImage={selectedImage}
              onClear={handleClearImage}
            />

            {selectedImage && !isAnalyzing && !analysisResult && (
              <div className="flex justify-center mt-6 animate-fade-in">
                <Button onClick={handleAnalyze} size="lg" className="px-8">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze with AI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <AnalysisResultPanel 
            data={analysisResult} 
            isAnalyzing={isAnalyzing} 
            onReportIssue={handleReportIssue}
            showReportButton={true}
          />
        </div>
      </section>
    </div>
  );
};

export default Index;
