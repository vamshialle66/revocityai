import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Complaint {
  id: string;
  complaint_id: string;
  latitude: number;
  longitude: number;
  status: string;
  priority: string;
  complaint_status: string;
  area_name: string | null;
  created_at: string;
  fill_level: number;
}

interface CityMapProps {
  onComplaintSelect?: (complaint: Complaint) => void;
}

const CityMap = ({ onComplaintSelect }: CityMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complaints`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "list", limit: 200 }),
        }
      );
      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  }, []);

  // Get marker color based on priority
  const getMarkerColor = (priority: string, complaintStatus: string) => {
    if (complaintStatus === "resolved") return "#22c55e"; // green
    switch (priority) {
      case "critical":
        return "#ef4444"; // red
      case "high":
        return "#f97316"; // orange
      case "medium":
        return "#eab308"; // yellow
      default:
        return "#22c55e"; // green
    }
  };

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        // Fetch API key
        const keyResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-maps-key`
        );
        const keyData = await keyResponse.json();

        if (!keyData.apiKey) {
          setMapError("Google Maps API key not configured");
          setIsLoading(false);
          return;
        }

        // Load Google Maps
        if (!window.google) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${keyData.apiKey}`;
          script.async = true;
          script.defer = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (!mapRef.current) return;

        // Create map centered on India (or user's location)
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: 20.5937, lng: 78.9629 },
          zoom: 5,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8b8b8b" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d44" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e4d64" }] },
          ],
        });

        await fetchComplaints();
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError("Failed to load map");
        setIsLoading(false);
      }
    };

    initMap();
  }, [fetchComplaints]);

  // Update markers when complaints change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // Add new markers
    complaints.forEach((complaint) => {
      const color = getMarkerColor(complaint.priority, complaint.complaint_status);

      // Create SVG marker icon
      const svgMarker = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: "#ffffff",
        scale: 10,
      };

      const marker = new google.maps.Marker({
        position: { lat: complaint.latitude, lng: complaint.longitude },
        map: mapInstanceRef.current!,
        icon: svgMarker,
        title: complaint.complaint_id,
      });

      marker.addListener("click", () => {
        onComplaintSelect?.(complaint);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if there are complaints
    if (complaints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      complaints.forEach((c) => bounds.extend({ lat: c.latitude, lng: c.longitude }));
      mapInstanceRef.current?.fitBounds(bounds, 50);
    }
  }, [complaints, onComplaintSelect]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  if (mapError) {
    return (
      <div className="w-full h-[500px] bg-muted/30 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">{mapError}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Priority Legend</p>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs">Critical</Badge>
          <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-xs">High</Badge>
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs">Medium</Badge>
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">Resolved</Badge>
        </div>
      </div>
      
      {/* Stats */}
      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3">
        <p className="text-xs text-muted-foreground">Total Reports</p>
        <p className="text-2xl font-bold text-foreground">{complaints.length}</p>
      </div>
    </div>
  );
};

export default CityMap;
