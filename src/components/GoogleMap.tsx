/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, MapPin } from 'lucide-react';

interface BinLocation {
  id: string;
  lat: number;
  lng: number;
  status: 'empty' | 'half-filled' | 'overflowing';
  address?: string;
}

interface GoogleMapProps {
  bins?: BinLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onBinClick?: (bin: BinLocation) => void;
}

// Default center for India
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const DEFAULT_ZOOM = 5;

const GoogleMap = ({ 
  bins = [], 
  center,
  zoom,
  onBinClick 
}: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const scriptLoadedRef = useRef(false);

  // Stable center and zoom values
  const mapCenter = center || DEFAULT_CENTER;
  const mapZoom = zoom ?? DEFAULT_ZOOM;

  // Load Google Maps script - only once
  useEffect(() => {
    if (scriptLoadedRef.current) return;
    
    const loadGoogleMaps = async () => {
      // Check if already loaded
      if (window.google?.maps) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch API key from edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-maps-key`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load map configuration');
        }

        const { apiKey } = await response.json();

        if (!apiKey) {
          throw new Error('Google Maps API key not configured');
        }

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          setIsLoading(false);
          return;
        }

        scriptLoadedRef.current = true;

        // Create and load the script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          setIsLoading(false);
        };

        script.onerror = () => {
          setError('Failed to load Google Maps');
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setIsLoading(false);
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize map - only once when ready
  useEffect(() => {
    if (isLoading || error || !mapRef.current || !window.google?.maps || mapInstanceRef.current) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry',
          stylers: [{ color: '#1a1a2e' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#1a1a2e' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#8892b0' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#0f3460' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#16213e' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#0f3460' }]
        },
        {
          featureType: 'poi',
          elementType: 'geometry',
          stylers: [{ color: '#16213e' }]
        }
      ],
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapInstanceRef.current = mapInstance;
    setIsMapReady(true);
  }, [isLoading, error, mapCenter, mapZoom]);

  // Add markers for bins
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps || !isMapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Status colors
    const statusColors: Record<string, string> = {
      empty: '#22c55e',
      'half-filled': '#f59e0b',
      overflowing: '#ef4444'
    };

    // Add new markers
    bins.forEach(bin => {
      const marker = new window.google.maps.Marker({
        position: { lat: bin.lat, lng: bin.lng },
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: statusColors[bin.status],
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: `Bin ${bin.id} - ${bin.status}`,
      });

      // Add click listener
      if (onBinClick) {
        marker.addListener('click', () => {
          onBinClick(bin);
        });
      }

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; color: #1a1a2e;">
            <h3 style="margin: 0 0 4px; font-weight: 600;">Bin #${bin.id}</h3>
            <p style="margin: 0; color: ${statusColors[bin.status]}; font-weight: 500;">
              Status: ${bin.status.replace('-', ' ')}
            </p>
            ${bin.address ? `<p style="margin: 4px 0 0; font-size: 12px;">${bin.address}</p>` : ''}
          </div>
        `,
      });

      marker.addListener('mouseover', () => {
        infoWindow.open(map, marker);
      });

      marker.addListener('mouseout', () => {
        infoWindow.close();
      });

      markersRef.current.push(marker);
    });
  }, [isMapReady, bins, onBinClick]);

  if (error) {
    return (
      <div className="w-full h-full min-h-[400px] bg-card/60 backdrop-blur-xl border border-destructive/30 rounded-xl flex items-center justify-center">
        <div className="text-center p-8">
          <MapPin className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-muted-foreground text-sm mt-2">
            Please check your Google Maps API key configuration
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[400px] bg-card/60 backdrop-blur-xl border border-primary/20 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-primary/20">
      <div ref={mapRef} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-primary/20 rounded-lg p-3">
        <p className="text-xs font-medium text-foreground mb-2">Bin Status</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Empty</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-muted-foreground">Half-filled</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Overflowing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMap;
