/**
 * Indirizzo in formato normale con link per Google Maps e Waze
 */

import googleMapsIcon from '../assets/google_maps.png';
import wazeIcon from '../assets/waze.png';

interface AddressLinkProps {
  address: string;
  className?: string;
}

function encodeForUrl(text: string): string {
  return encodeURIComponent(text);
}

export function AddressLink({ address, className = '' }: AddressLinkProps) {
  if (!address?.trim()) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeForUrl(address)}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeForUrl(address)}&navigate=yes`;

  return (
    <div className={`block mt-1 ${className}`}>
      <span className="text-slate-600">{address}</span>
      <div className="flex items-center gap-3 mt-1.5">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-primary-600 text-sm"
          title="Apri in Google Maps"
        >
          <img src={googleMapsIcon} alt="" className="w-5 h-5" />
          Google Maps
        </a>
        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-primary-600 text-sm"
          title="Apri in Waze"
        >
          <img src={wazeIcon} alt="" className="w-5 h-5" />
          Waze
        </a>
      </div>
    </div>
  );
}
