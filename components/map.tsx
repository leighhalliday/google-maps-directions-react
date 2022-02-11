import { useState, useMemo, useCallback, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Circle,
  MarkerClusterer,
} from "@react-google-maps/api";
import Places from "./places";
import Distance from "./distance";

type LatLngLiteral = google.maps.LatLngLiteral;
type DirectionsResult = google.maps.DirectionsResult;

export default function Map() {
  const mapRef = useRef<GoogleMap>();
  const [selected, setSelected] = useState<LatLngLiteral>();
  const [directions, setDirections] = useState<DirectionsResult>();
  const onLoad = useCallback((map) => (mapRef.current = map), []);
  const center = useMemo<LatLngLiteral>(
    () => ({ lat: 43.45, lng: -80.49 }),
    []
  );
  const houses = useMemo(() => generateHouses(center), [center]);

  const fetchDirections = (house: LatLngLiteral) => {
    if (!selected) return;

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: selected,
        destination: house,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
        }
      }
    );
  };

  return (
    <div className="container">
      <div className="controls">
        <h1>Commute?</h1>
        <Places
          setSelected={(position) => {
            setSelected(position);
            mapRef!.current!.panTo(position);
          }}
        />
        {directions && <Distance leg={directions.routes[0].legs[0]} />}
        {!selected && <p>Enter the address of your office.</p>}
      </div>

      <div className="map">
        <GoogleMap
          zoom={10}
          center={center}
          mapContainerClassName="map-container"
          options={{ disableDefaultUI: true, clickableIcons: false }}
          onLoad={onLoad}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: {
                  zIndex: 50,
                  strokeColor: "#1976D2",
                  strokeWeight: 5,
                },
              }}
            />
          )}

          {selected && (
            <>
              <MarkerClusterer
                options={{
                  imagePath:
                    "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
                }}
              >
                {(clusterer) =>
                  houses.map((house) => (
                    <Marker
                      key={house.lat}
                      position={house}
                      clusterer={clusterer}
                      onClick={() => {
                        fetchDirections(house);
                      }}
                    />
                  ))
                }
              </MarkerClusterer>

              <Marker
                position={selected}
                icon="https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png"
              />

              <Circle center={selected} radius={15000} options={closeOptions} />
              <Circle
                center={selected}
                radius={30000}
                options={middleOptions}
              />
              <Circle center={selected} radius={45000} options={farOptions} />
            </>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

const defaultOptions = {
  strokeOpacity: 0.8,
  strokeWeight: 2,
  clickable: false,
  draggable: false,
  editable: false,
  visible: true,
};
const closeOptions = {
  ...defaultOptions,
  zIndex: 3,
  fillOpacity: 0.1,
  strokeColor: "#8BC34A",
  fillColor: "#8BC34A",
};
const middleOptions = {
  ...defaultOptions,
  zIndex: 2,
  fillOpacity: 0.1,
  strokeColor: "#FBC02D",
  fillColor: "#FBC02D",
};
const farOptions = {
  ...defaultOptions,
  zIndex: 1,
  fillOpacity: 0.1,
  strokeColor: "#FF5252",
  fillColor: "#FF5252",
};

const generateHouses = (position: LatLngLiteral) => {
  const _houses: Array<LatLngLiteral> = [];
  for (let i = 0; i < 100; i++) {
    const direction = Math.random() < 0.5 ? -2 : 2;
    _houses.push({
      lat: position.lat + Math.random() / direction,
      lng: position.lng + Math.random() / direction,
    });
  }
  return _houses;
};
