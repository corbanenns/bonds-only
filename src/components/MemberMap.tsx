"use client"

import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"

// US state coordinates (approximate center of each state)
const stateCoordinates: Record<string, [number, number]> = {
  AL: [-86.9023, 32.8067],
  AK: [-152.4044, 61.3707],
  AZ: [-111.4312, 33.7298],
  AR: [-92.3731, 34.9697],
  CA: [-119.6816, 36.1162],
  CO: [-105.3111, 39.0598],
  CT: [-72.7554, 41.5978],
  DE: [-75.5071, 39.3185],
  FL: [-81.5158, 27.7663],
  GA: [-83.6431, 33.0406],
  HI: [-157.4983, 21.0943],
  ID: [-114.7420, 44.2405],
  IL: [-89.3985, 40.3495],
  IN: [-86.2816, 39.8494],
  IA: [-93.0977, 42.0115],
  KS: [-96.7265, 38.5266],
  KY: [-84.6701, 37.6681],
  LA: [-91.8749, 31.1695],
  ME: [-69.3819, 44.6939],
  MD: [-76.6413, 39.0639],
  MA: [-71.5301, 42.2302],
  MI: [-84.5361, 43.3266],
  MN: [-93.9196, 45.6945],
  MS: [-89.6787, 32.7416],
  MO: [-92.2896, 38.4561],
  MT: [-110.4544, 46.9219],
  NE: [-98.2681, 41.1254],
  NV: [-117.0554, 38.3135],
  NH: [-71.5639, 43.4525],
  NJ: [-74.5210, 40.2989],
  NM: [-106.2371, 34.8405],
  NY: [-74.9481, 42.1657],
  NC: [-79.8064, 35.6301],
  ND: [-99.7840, 47.5289],
  OH: [-82.7937, 40.3888],
  OK: [-96.9289, 35.5653],
  OR: [-122.0709, 44.5720],
  PA: [-77.2098, 40.5908],
  RI: [-71.5118, 41.6809],
  SC: [-80.9066, 33.8569],
  SD: [-99.4380, 44.2998],
  TN: [-86.6923, 35.7478],
  TX: [-97.5631, 31.0545],
  UT: [-111.8910, 40.1500],
  VT: [-72.7107, 44.0459],
  VA: [-78.1694, 37.7693],
  WA: [-121.4906, 47.4009],
  WV: [-80.9545, 38.4912],
  WI: [-89.6165, 44.2685],
  WY: [-107.3025, 42.7559],
}

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"

interface Agency {
  id: string
  name: string
  address: string | null
}

interface Member {
  id: string
  name: string
  address: string | null
  agencyName: string | null
  agency: Agency | null
}

interface MemberMapProps {
  members: Member[]
}

// Extract state from address (assumes format like "City, State" or "City, ST")
function extractState(address: string | null): string | null {
  if (!address) return null

  console.log("extractState input:", address)

  // Try to extract 2-letter state code
  const stateMatch = address.match(/,\s*([A-Z]{2})(?:\s|$)/i)
  console.log("State code match:", stateMatch)
  if (stateMatch) {
    const stateCode = stateMatch[1].toUpperCase()
    console.log("Extracted state code:", stateCode)
    return stateCode
  }

  // Try full state names
  const stateNames: Record<string, string> = {
    alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR",
    california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
    florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
    illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
    kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
    massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
    missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
    oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
    vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV",
    wisconsin: "WI", wyoming: "WY"
  }

  const lowerAddress = address.toLowerCase()
  for (const [stateName, stateCode] of Object.entries(stateNames)) {
    if (lowerAddress.includes(stateName)) {
      return stateCode
    }
  }

  return null
}

export function MemberMap({ members }: MemberMapProps) {
  // Group members by state
  const membersByState: Record<string, Member[]> = {}

  console.log("MemberMap - Total members:", members.length)

  members.forEach((member) => {
    // Check agency address first, then member address
    const address = member.agency?.address || member.address
    const state = extractState(address)

    console.log("Member:", member.name, {
      agencyAddress: member.agency?.address,
      memberAddress: member.address,
      finalAddress: address,
      extractedState: state,
      hasCoords: state ? !!stateCoordinates[state] : false
    })

    if (state && stateCoordinates[state]) {
      if (!membersByState[state]) {
        membersByState[state] = []
      }
      membersByState[state].push(member)
    }
  })

  console.log("MemberMap - Members by state:", membersByState)

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Locations</h2>
      <ComposableMap projection="geoAlbersUsa" className="w-full h-auto">
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#E5E7EB"
                stroke="#9CA3AF"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "#D1D5DB" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {Object.entries(membersByState).map(([state, stateMembers]) => {
          const coords = stateCoordinates[state]
          if (!coords) return null

          return (
            <Marker key={state} coordinates={coords}>
              <g>
                <circle
                  r={6}
                  fill="#1E40AF"
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ cursor: "pointer" }}
                />
                <text
                  textAnchor="middle"
                  y={-12}
                  style={{
                    fontFamily: "system-ui",
                    fontSize: "10px",
                    fill: "#1F2937",
                    fontWeight: "600",
                  }}
                >
                  {stateMembers.length}
                </text>
              </g>
              <title>
                {state}: {stateMembers.map((m) => m.name).join(", ")}
              </title>
            </Marker>
          )
        })}
      </ComposableMap>

      {Object.keys(membersByState).length === 0 && (
        <p className="text-center text-gray-500 text-sm mt-4">
          No member locations available. Add addresses to see them on the map.
        </p>
      )}
    </div>
  )
}
