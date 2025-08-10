import { useState } from "react";
import ReactPlayer from 'react-player';
import './Display.css';

const Display = ({ contract, account }) => {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inline SVG fallback for broken images
  const fallbackSVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f5f5f5'/%3E%3Ctext x='50%' y='50%' font-family='Arial' font-size='16' text-anchor='middle' fill='%23666'%3EMedia Loading...%3C/text%3E%3C/svg%3E`;

  // Check if URL is accessible
  const checkUrl = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (e) {
      return false;
    }
  };

  const getdata = async () => {
    setLoading(true);
    setError(null);
    const inputAddress = document.querySelector(".address").value;
    const address = inputAddress || account;

    try {
      const dataArray = await contract.display(address);

      if (!dataArray || dataArray.length === 0) {
        setError("No media files found for this address");
        return;
      }

      const items = await Promise.all(dataArray.map(async (item, index) => {
        let url = item.trim();
        
        // Handle IPFS URLs
        if (url.startsWith("ipfs://")) {
          url = `https://ipfs.io/ipfs/${url.slice(7)}`;
        } else if (url.startsWith("Qm") && !url.includes("/ipfs/")) {
          url = `https://ipfs.io/ipfs/${url}`;
        }

        // Try multiple gateways if first fails
        const gateways = [
          url, // Try original first
          url.replace('gateway.pinata.cloud', 'ipfs.io'),
          url.replace('ipfs.io', 'gateway.pinata.cloud'),
          url.replace('gateway.pinata.cloud', 'dweb.link'),
          url.replace('ipfs.io', 'cloudflare-ipfs.com')
        ];

        let workingUrl = fallbackSVG;
        let isVideo = false;

        // Find first working gateway
        for (const gatewayUrl of gateways) {
          if (await checkUrl(gatewayUrl)) {
            workingUrl = gatewayUrl;
            isVideo = /\.(mp4|webm|ogg|mov)$/i.test(gatewayUrl);
            break;
          }
        }

        return (
          <div key={`media-${index}`} className="media-item">
            <div className="player-wrapper">
              {isVideo ? (
                <ReactPlayer
                  url={workingUrl}
                  className="react-player"
                  width="100%"
                  height="100%"
                  controls
                  light={fallbackSVG}
                  onError={() => console.error("Failed to load video:", workingUrl)}
                />
              ) : (
                <img 
                  src={workingUrl} 
                  alt={`Uploaded content ${index + 1}`}
                  className="media-content"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackSVG;
                  }}
                />
              )}
            </div>
            <div className="media-info">
              <h3>Media #{index + 1}</h3>
              <a href={workingUrl} target="_blank" rel="noopener noreferrer">
                View original
              </a>
              <p className="url-truncate">{workingUrl}</p>
              <p className="status">{workingUrl === fallbackSVG ? "Not available" : "Loaded"}</p>
            </div>
          </div>
        );
      }));

      setMediaItems(items);
    } catch (error) {
      console.error("Error fetching media:", error);
      setError("Failed to load media files. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="display-container">
      <div className="controls">
        <input
          type="text"
          placeholder="Enter Ethereum Address"
          className="address"
        />
        <button onClick={getdata} className="get-data-btn" disabled={loading}>
          {loading ? 'Loading...' : 'Get Media'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loader">Loading media...</div>
      ) : (
        <div className="media-grid">{mediaItems}</div>
      )}
    </div>
  );
};

export default Display;
