import { MapPin, Navigation, Layers } from "lucide-react";

/**
 * MapPlaceholder Component
 * Placeholder for Google Maps integration showing smart bin locations
 */
const MapPlaceholder = () => {
  // Mock bin locations for display
  const mockLocations = [
    { id: 1, name: "Central Park", status: "empty" },
    { id: 2, name: "Main Street", status: "half-filled" },
    { id: 3, name: "City Hall", status: "overflowing" },
  ];

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Smart Bin Locations
            </h3>
            <p className="text-muted-foreground text-xs">Real-time monitoring</p>
          </div>
        </div>
        
        {/* Map controls placeholder */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <Layers className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <Navigation className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Map area */}
      <div className="relative h-80 bg-muted/20">
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Center message */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-card/80 p-6 rounded-full border border-primary/30">
                <MapPin className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h4 className="font-display text-lg font-semibold text-foreground mb-2">
              Google Maps Integration
            </h4>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Connect your Google Maps API to view real-time bin locations and collection routes
            </p>
          </div>
        </div>

        {/* Mock location pins */}
        <div className="absolute top-1/4 left-1/4">
          <div className="relative">
            <div className="absolute inset-0 bg-neon-green rounded-full blur-md animate-pulse" />
            <div className="relative w-4 h-4 bg-neon-green rounded-full border-2 border-background" />
          </div>
        </div>
        <div className="absolute top-1/2 right-1/3">
          <div className="relative">
            <div className="absolute inset-0 bg-warning rounded-full blur-md animate-pulse" />
            <div className="relative w-4 h-4 bg-warning rounded-full border-2 border-background" />
          </div>
        </div>
        <div className="absolute bottom-1/3 right-1/4">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive rounded-full blur-md animate-pulse" />
            <div className="relative w-4 h-4 bg-destructive rounded-full border-2 border-background" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-muted/20 border-t border-border">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-neon-green" />
            <span className="text-muted-foreground">Empty</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Half Filled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Overflowing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPlaceholder;
