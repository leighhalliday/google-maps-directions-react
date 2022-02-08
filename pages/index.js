import Head from "next/head";
import { useState, useMemo, useCallback, useRef } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  DirectionsRenderer,
  Circle,
  MarkerClusterer,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import styles from "../styles/Home.module.css";
import "@reach/combobox/styles.css";

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const options = { disableDefaultUI: true, clickableIcons: false };

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
  radius: 15000,
  zIndex: 3,
  fillOpacity: 0.1,
  strokeColor: "#0FE036",
  fillColor: "#0FE036",
};
const middleOptions = {
  ...defaultOptions,
  radius: 30000,
  zIndex: 2,
  fillOpacity: 0.1,
  strokeColor: "#FEFF11",
  fillColor: "#FEFF11",
};
const farOptions = {
  ...defaultOptions,
  radius: 45000,
  zIndex: 1,
  fillOpacity: 0.1,
  strokeColor: "#FF0000",
  fillColor: "#FF0000",
};

const clusterOptions = {
  imagePath:
    "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m", // so you must have m1.png, m2.png, m3.png, m4.png, m5.png and m6.png in that folder
};

export default function Home() {
  const mapRef = useRef();
  const [selected, setSelected] = useState(null);
  const [directions, setDirections] = useState(null);
  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);
  const libraries = useMemo(() => ["places"], []);
  const center = useMemo(
    () => ({
      lat: 43.45,
      lng: -80.49,
    }),
    []
  );
  const houses = useMemo(() => {
    const _houses = [];
    for (let i = 0; i < 100; i++) {
      const mult = Math.random() < 0.5 ? -2 : 2;
      _houses.push({
        lat: center.lat + Math.random() / mult,
        lng: center.lng + Math.random() / mult,
      });
    }
    return _houses;
  }, []);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const fetchDirections = (house) => {
    if (!selected) {
      return;
    }

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: selected,
        destination: house,
        travelMode: "DRIVING",
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
        }
      }
    );
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Commute?</title>
      </Head>

      <div className={styles.controls}>
        <h1>Commute?</h1>
        <PlacesAutocomplete
          setSelected={(position) => {
            setSelected(position);
            mapRef.current.panTo(position);
          }}
        />
        {directions && <DistanceDetails leg={directions.routes[0].legs[0]} />}
        {!selected && <p>Enter the address of your office.</p>}
      </div>

      <div className={styles.map}>
        <GoogleMap
          zoom={10}
          center={center}
          mapContainerStyle={mapContainerStyle}
          options={options}
          onLoad={onLoad}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: {
                  zIndex: 50,
                  strokeColor: "blue",
                  strokeWeight: 10,
                },
              }}
            />
          )}

          {selected && (
            <>
              <MarkerClusterer options={clusterOptions}>
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

              <Circle center={selected} options={closeOptions} />
              <Circle center={selected} options={middleOptions} />
              <Circle center={selected} options={farOptions} />
            </>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

const daysWorkedYear = 260;
const litres100km = 10;
const gasLitreCost = 1.5;
const litreCostKm = (litres100km / 100) * gasLitreCost;

const DistanceDetails = ({ leg }) => {
  const days = Math.floor(
    daysWorkedYear * ((leg.duration.value * 2) / 60 / 60 / 24)
  );
  const cost = Math.floor(
    ((daysWorkedYear * leg.distance.value * 2) / 1000) * litreCostKm
  );

  return (
    <>
      <p>
        This home is{" "}
        <span className={styles.highlight}>{leg.distance.text}</span> away from
        your office. That would take{" "}
        <span className={styles.highlight}>{leg.duration.text}</span> each
        direction.
      </p>
      <p>
        That's <span className={styles.highlight}>{days} days</span> in your car
        each year at a cost of{" "}
        <span className={styles.highlight}>
          ${new Intl.NumberFormat().format(cost)}
        </span>
        .
      </p>
    </>
  );
};

const PlacesAutocomplete = ({ setSelected }) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete();

  const handleInput = (e) => {
    setValue(e.target.value);
  };

  const handleSelect = async (val) => {
    setValue(val, false);
    clearSuggestions();

    const results = await getGeocode({ address: val });
    const { lat, lng } = await getLatLng(results[0]);
    setSelected({ lat, lng });
  };

  return (
    <Combobox onSelect={handleSelect} aria-labelledby="demo">
      <ComboboxInput
        value={value}
        onChange={handleInput}
        disabled={!ready}
        style={{ width: "100%", padding: "0.5rem" }}
        placeholder="Office address"
      />
      <ComboboxPopover>
        <ComboboxList>
          {status === "OK" &&
            data.map(({ place_id, description }) => (
              <ComboboxOption key={place_id} value={description} />
            ))}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  );
};
