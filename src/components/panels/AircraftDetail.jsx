// src/components/panels/AircraftDetail.jsx
import React, { useEffect, useState } from 'react';
import { useFlightStore } from '../../store/flightStore';
import { X, Copy, ExternalLink, Image as ImageIcon } from 'lucide-react';

export default function AircraftDetail() {
  const selectedAircraftId = useFlightStore(state => state.selectedAircraftId);
  const aircraft = useFlightStore(state => state.aircraft);
  const clearSelectedAircraft = useFlightStore(state => state.clearSelectedAircraft);
  
  const [photo, setPhoto] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  useEffect(() => {
    if (!selectedAircraftId) {
      setPhoto(null);
      return;
    }

    let isMounted = true;
    const fetchPhoto = async () => {
      setLoadingPhoto(true);
      setPhoto(null);
      try {
        const res = await fetch(`https://api.planespotters.net/pub/photos/hex/${selectedAircraftId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.photos && data.photos.length > 0) {
            setPhoto(data.photos[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch photo", err);
      } finally {
        if (isMounted) setLoadingPhoto(false);
      }
    };

    fetchPhoto();

    return () => { isMounted = false; };
  }, [selectedAircraftId]);

  if (!selectedAircraftId) return null;

  const ac = aircraft[selectedAircraftId];
  if (!ac) return null;

  const timeAgoSecs = Math.floor((Date.now() / 1000) - ac.lastSeen);

  const SectionHeader = ({ title }) => (
    <div className="bg-[#0f4c5c]/80 text-[#e0fbfc] text-[10px] font-bold px-2 py-0.5 mt-2 uppercase flex justify-between tracking-wide">
      <span>{title}</span>
    </div>
  );

  const DataRow = ({ label, value, valueClass = "text-white" }) => (
    <div className="flex justify-between items-center text-[11px] leading-tight px-2 py-0.5">
      <span className="text-gray-400">{label}:</span>
      <span className={`font-data ${valueClass}`}>{value}</span>
    </div>
  );

  return (
    <div className="absolute right-4 top-20 w-72 bg-[#1c222b]/95 backdrop-blur-md border border-gray-700 shadow-2xl z-[1000] text-gray-200 font-ui overflow-hidden flex flex-col h-[calc(100vh-100px)]">
      
      {/* Header */}
      <div className="p-2 border-b border-gray-700 flex flex-col gap-1 relative">
        <button 
          onClick={clearSelectedAircraft}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="text-lg text-gray-100 uppercase translate-y-[-2px] tracking-wide">
          {ac.callsign || 'UNKNOWN'}
        </div>
        
        <div className="flex items-center gap-2 text-xs font-data">
          <span className="font-bold text-gray-300">Hex: {ac.id.toUpperCase()}</span>
          <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1 underline text-[10px] ml-2">
            Copy Link
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        {/* Photo Section */}
        <div className="w-full bg-black min-h-[140px] flex items-center justify-center relative border-b border-gray-700">
          {loadingPhoto ? (
            <div className="text-xs text-gray-500 flex flex-col items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              Loading photo...
            </div>
          ) : photo ? (
            <div className="w-full h-full relative group">
              <img src={photo.thumbnail_large?.src || photo.thumbnail?.src} alt="Aircraft" className="w-full h-auto object-cover max-h-[200px]" />
              <div className="absolute bottom-0 left-0 w-full bg-black/60 px-2 py-1 flex justify-between items-center">
                <span className="text-[9px] text-gray-300">Image © {photo.photographer}</span>
                <a href={photo.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
             <div className="text-xs text-gray-600 flex flex-col items-center gap-2 py-8">
               <ImageIcon className="w-8 h-8 opacity-50" />
               No photo available
             </div>
          )}
        </div>

        {/* Basic Aircraft Metadata Matrix */}
        <div className="flex flex-col gap-0.5 pt-2">
          <DataRow label="Country" value={ac.country || 'n/a'} />
          <DataRow label="Type" value="n/a (OpenSky Free)" />
          <DataRow label="Squawk" value={ac.squawk || 'n/a'} />
          <DataRow label="Route" value="n/a" />
        </div>

        {/* Spatial */}
        <SectionHeader title="SPATIAL" />
        <div className="flex flex-col gap-0.5 pt-1">
          <DataRow label="Groundspeed" value={`${Math.round(ac.speed)} kt`} />
          <DataRow label="Baro. altitude" value={`${Math.round(ac.altitude || 0)} ft`} />
          <DataRow label="WGS84 altitude" value={`${Math.round(ac.geoAltitude || ac.altitude || 0)} ft`} />
          <DataRow label="Vert. Rate" value={`${Math.round(ac.verticalRate)} ft/min`} />
          <DataRow label="Track" value={`${Math.round(ac.heading)}°`} />
          <DataRow label="Pos." value={ac.lat && ac.lng ? `${ac.lat.toFixed(3)}°, ${ac.lng.toFixed(3)}°` : 'n/a'} />
          <DataRow label="Distance" value="n/a" />
        </div>

        {/* Signal */}
        <SectionHeader title="SIGNAL" />
        <div className="flex flex-col gap-0.5 pt-1">
          <DataRow label="Source" value={ac.source || 'ADS-B'} />
          <DataRow label="Last Pos." value={`${timeAgoSecs} s`} />
          <DataRow label="Last Seen" value={`${timeAgoSecs} s`} />
          <DataRow label="SPI" value={ac.spi ? 'True' : 'False'} valueClass={ac.spi ? 'text-red-400' : 'text-gray-400'} />
          <DataRow label="On Ground" value={ac.onGround ? 'True' : 'False'} />
        </div>

        {/* Emulated FMS/Wind (Not available in free OpenSky) */}
        <SectionHeader title="FMS SEL" />
        <div className="flex flex-col gap-0.5 pt-1">
          <DataRow label="Sel. Alt." value="n/a" />
          <DataRow label="Sel. Head." value="n/a" />
        </div>

        <SectionHeader title="WIND" />
        <div className="flex flex-col gap-0.5 pt-1">
          <DataRow label="Speed" value="n/a" />
          <DataRow label="Direction (from)" value="n/a" />
          <DataRow label="TAT / OAT" value="n/a" />
        </div>
      </div>
    </div>
  );
}
