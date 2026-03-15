import React, { useState, useRef, useEffect } from 'react';
import { useMap, useMapEvent } from 'react-leaflet';
import { useFlightStore } from '../../store/flightStore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { sortAircraft, filterByBounds } from '../../lib/tableUtils';
import { formatAltitude, formatSpeed, formatHeading } from '../../lib/formatters';
import { AIRCRAFT_CATEGORY_COLORS } from '../../lib/constants';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function AircraftTable() {
    const map = useMap();
    const [bounds, setBounds] = useState(() => map.getBounds());
    
    useMapEvent('moveend', () => {
        setBounds(map.getBounds());
    });

    const filteredAircraft = useFlightStore(state => state.filteredAircraft);
    const selectedAircraftId = useFlightStore(state => state.selectedAircraftId);
    const setSelectedAircraft = useFlightStore(state => state.setSelectedAircraft);

    const [sortConfig, setSortConfig] = useState({ column: 'riskScore', direction: 'desc' });

    // 1. Filter by bounds
    const boundsFiltered = filterByBounds(filteredAircraft, bounds);

    // 2. Sort
    const sortedAircraft = sortAircraft(boundsFiltered, sortConfig.column, sortConfig.direction);

    // Virtualization
    const parentRef = useRef(null);
    const rowVirtualizer = useVirtualizer({
        count: sortedAircraft.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 48,
        overscan: 10
    });

    // Handle sort click
    const handleSort = (column) => {
        if (sortConfig.column === column) {
            setSortConfig({ column, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
        } else {
            setSortConfig({ column, direction: 'asc' });
        }
    };

    // Scroll to selected
    useEffect(() => {
        if (selectedAircraftId) {
            const index = sortedAircraft.findIndex(ac => ac.id === selectedAircraftId);
            if (index !== -1) {
                rowVirtualizer.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAircraftId, sortedAircraft.length]);

    const handleRowClick = (ac) => {
        setSelectedAircraft(ac.id);
        map.flyTo([ac.lat, ac.lng], 10, { animate: true });
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.column !== column) return <div className="w-3 h-3 opacity-0" />;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp className="w-3 h-3 text-atc-green" /> 
            : <ArrowDown className="w-3 h-3 text-atc-green" />;
    };

    const columns = [
        { key: 'callsign', label: 'Callsign', align: 'left', width: '15%' },
        { key: 'id', label: 'ICAO24', align: 'left', width: '15%' },
        { key: 'category', label: 'Cat', align: 'center', width: '10%' },
        { key: 'altitude', label: 'Alt', align: 'right', width: '15%' },
        { key: 'speed', label: 'Spd', align: 'right', width: '15%' },
        { key: 'heading', label: 'Hdg', align: 'right', width: '10%' },
        { key: 'squawk', label: 'Squawk', align: 'right', width: '10%' },
        { key: 'riskScore', label: 'Risk', align: 'right', width: '10%' },
    ];

    return (
        <div className="absolute inset-0 z-[1000] bg-[#050A15]/95 backdrop-blur font-ui flex flex-col">
            <div className="flex border-b border-[#1A2235] bg-[#0A0F1A] p-2 pr-6 shadow-md text-xs font-bold text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                {columns.map(col => (
                    <div 
                        key={col.key} 
                        className={`flex items-center gap-1 cursor-pointer hover:text-white transition-colors ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}
                        style={{ width: col.width }}
                        onClick={() => handleSort(col.key)}
                    >
                        {col.label}
                        <SortIcon column={col.key} />
                    </div>
                ))}
            </div>

            <div 
                ref={parentRef} 
                className="flex-1 overflow-y-auto custom-scrollbar"
                style={{ contain: 'strict' }}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const ac = sortedAircraft[virtualRow.index];
                        const isSelected = selectedAircraftId === ac.id;
                        
                        return (
                            <div
                                key={ac.id}
                                onClick={() => handleRowClick(ac)}
                                className={`absolute top-0 left-0 w-full flex items-center p-2 border-b border-[#1A2235]/50 transition-colors cursor-pointer text-sm font-data
                                    ${isSelected ? 'bg-atc-green/10 text-atc-green' : 'text-slate-300 hover:bg-[#1A2235]/40'}
                                `}
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <div style={{ width: columns[0].width }} className="font-bold">{ac.callsign || 'N/A'}</div>
                                <div style={{ width: columns[1].width }} className="text-slate-400 text-xs">{ac.id}</div>
                                <div style={{ width: columns[2].width }} className="flex justify-center">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: AIRCRAFT_CATEGORY_COLORS[ac.category] || AIRCRAFT_CATEGORY_COLORS['unknown'] }} />
                                </div>
                                <div style={{ width: columns[3].width }} className="text-right text-atc-green">{ac.altitude ? formatAltitude(ac.altitude) : '--'}</div>
                                <div style={{ width: columns[4].width }} className="text-right text-atc-green">{ac.speed ? formatSpeed(ac.speed) : '--'}</div>
                                <div style={{ width: columns[5].width }} className="text-right text-atc-green">{ac.heading ? formatHeading(ac.heading) : '--'}</div>
                                <div style={{ width: columns[6].width }} className={`text-right font-mono ${ac.squawk ? 'text-orange-400' : 'text-slate-500'}`}>{ac.squawk || 'None'}</div>
                                <div style={{ width: columns[7].width }} className="text-right font-bold text-slate-100">{ac.riskScore || 0}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {sortedAircraft.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-500 text-sm">
                    No aircraft within current bounds or filters
                </div>
            )}
        </div>
    );
}
