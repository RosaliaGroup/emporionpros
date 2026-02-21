// EMPORIONPROS — Market Intelligence Report Generator
// Netlify Function: /api/market-report?address=475+Main+St+Orange+NJ+07050
const fetch = require("node-fetch");

// ── GEOCODE ADDRESS TO ZIP/COORDS ──
async function geocode(address) {
  // Try Google Maps first
  if (process.env.GOOGLE_MAPS_API_KEY) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const r = data.results[0];
      const zip = r.address_components.find(c => c.types.includes("postal_code"));
      const city = r.address_components.find(c => c.types.includes("locality"));
      const county = r.address_components.find(c => c.types.includes("administrative_area_level_2"));
      const state = r.address_components.find(c => c.types.includes("administrative_area_level_1"));
      return {
        formatted: r.formatted_address,
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
        zip: zip ? zip.short_name : null,
        city: city ? city.long_name : null,
        county: county ? county.long_name : null,
        state: state ? state.short_name : null,
        fips: null // will fill from Census
      };
    }
  }
  // Fallback: OpenCage
  if (process.env.OPENCAGE_API_KEY) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${process.env.OPENCAGE_API_KEY}&countrycode=us`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const r = data.results[0];
      return {
        formatted: r.formatted,
        lat: r.geometry.lat,
        lng: r.geometry.lng,
        zip: r.components.postcode || null,
        city: r.components.city || r.components.town || null,
        county: r.components.county || null,
        state: r.components.state_code || null,
        fips: null
      };
    }
  }
  // Last fallback: extract ZIP from address string
  const zipMatch = address.match(/\b(\d{5})\b/);
  return {
    formatted: address,
    lat: null, lng: null,
    zip: zipMatch ? zipMatch[1] : null,
    city: null, county: null, state: "NJ", fips: null
  };
}

// ── CENSUS ACS DATA ──
async function getCensusData(zip) {
  const key = process.env.CENSUS_API_KEY;
  if (!key || !zip) return null;
  try {
    // ACS 5-year estimates for ZIP Code Tabulation Areas
    // Variables: population, median income, median age, median rent, vacancy rate, housing units
    const vars = [
      "B01003_001E", // total population
      "B19013_001E", // median household income
      "B01002_001E", // median age
      "B25064_001E", // median gross rent
      "B25002_001E", // total housing units
      "B25002_003E", // vacant housing units
      "B25003_001E", // occupied housing units
      "B25003_002E", // owner occupied
      "B25003_003E", // renter occupied
      "B08303_001E", // total commuters
      "B25077_001E", // median home value
      "B01001_001E", // total pop (backup)
      "B25071_001E", // median gross rent as % of income
    ].join(",");
    const url = `https://api.census.gov/data/2023/acs/acs5?get=${vars}&for=zip%20code%20tabulation%20area:${zip}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 1) {
      const row = data[1];
      const totalHousing = parseInt(row[4]) || 1;
      const vacant = parseInt(row[5]) || 0;
      const occupied = parseInt(row[6]) || totalHousing;
      const ownerOcc = parseInt(row[7]) || 0;
      const renterOcc = parseInt(row[8]) || 0;
      return {
        population: parseInt(row[0]) || null,
        medianIncome: parseInt(row[1]) || null,
        medianAge: parseFloat(row[2]) || null,
        medianRent: parseInt(row[3]) || null,
        totalHousingUnits: totalHousing,
        vacantUnits: vacant,
        occupancyRate: Math.round((occupied / totalHousing) * 1000) / 10,
        ownerOccupied: ownerOcc,
        renterOccupied: renterOcc,
        totalCommuters: parseInt(row[9]) || null,
        medianHomeValue: parseInt(row[10]) || null,
        rentBurden: parseFloat(row[12]) || null,
        source: "US Census ACS 2023 5-Year Estimates"
      };
    }
  } catch (e) { console.error("Census error:", e.message); }
  return null;
}

// ── WALK SCORE ──
async function getWalkScore(lat, lng, address) {
  const key = process.env.WALKSCORE_API_KEY;
  if (!key || !lat || !lng) return null;
  try {
    const url = `https://api.walkscore.com/score?format=json&address=${encodeURIComponent(address)}&lat=${lat}&lon=${lng}&transit=1&bike=1&wsapikey=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    return {
      walkScore: data.walkscore || null,
      walkDesc: data.description || null,
      transitScore: data.transit ? data.transit.score : null,
      transitDesc: data.transit ? data.transit.description : null,
      bikeScore: data.bike ? data.bike.score : null,
      bikeDesc: data.bike ? data.bike.description : null,
      source: "Walk Score API"
    };
  } catch (e) { console.error("Walk Score error:", e.message); }
  return null;
}

// ── RENTCAST (paid - rental comps) ──
async function getRentCastData(zip) {
  const key = process.env.RENTCAST_API_KEY;
  if (!key || !zip) return null;
  try {
    const url = `https://api.rentcast.io/v1/markets?zipCode=${zip}`;
    const res = await fetch(url, { headers: { "X-Api-Key": key, "Accept": "application/json" } });
    const data = await res.json();
    if (data) {
      return {
        rentStudio: data.averageRent?.studio || null,
        rent1BR: data.averageRent?.oneBedroom || null,
        rent2BR: data.averageRent?.twoBedroom || null,
        rent3BR: data.averageRent?.threeBedroom || null,
        rent4BR: data.averageRent?.fourBedroom || null,
        medianRent: data.medianRent || null,
        rentGrowthYoY: data.rentGrowthRate || null,
        avgDaysOnMarket: data.averageDaysOnMarket || null,
        totalListings: data.totalListings || null,
        source: "RentCast API"
      };
    }
  } catch (e) { console.error("RentCast error:", e.message); }
  return null;
}

// ── ATTOM (paid - property/sales data) ──
async function getAttomData(zip) {
  const key = process.env.ATTOM_API_KEY;
  if (!key || !zip) return null;
  try {
    const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/salestrend/snapshot?postalcode=${zip}`;
    const res = await fetch(url, { headers: { "apikey": key, "Accept": "application/json" } });
    const data = await res.json();
    if (data && data.salesTrends) {
      const trends = data.salesTrends[0] || {};
      return {
        medianSalePrice: trends.medianSalePrice || null,
        avgSalePrice: trends.averageSalePrice || null,
        salesCount: trends.homesSold || null,
        pricePerSqFt: trends.medianPricePerSqFt || null,
        appreciationRate: trends.appreciationRate || null,
        source: "ATTOM Data API"
      };
    }
  } catch (e) { console.error("ATTOM error:", e.message); }
  return null;
}

// ── ZONEOMICS (paid - zoning data) ──
async function getZoningData(lat, lng) {
  const key = process.env.ZONEOMICS_API_KEY;
  if (!key || !lat || !lng) return null;
  try {
    const url = `https://api.zoneomics.com/v2/zoning?lat=${lat}&lng=${lng}&api_key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.zone) {
      return {
        zoneCode: data.zone.code || null,
        zoneName: data.zone.name || null,
        zoneDescription: data.zone.description || null,
        allowedUses: data.zone.allowedUses || [],
        maxDensity: data.zone.maxDensity || null,
        maxHeight: data.zone.maxHeight || null,
        minLotSize: data.zone.minLotSize || null,
        source: "Zoneomics API"
      };
    }
  } catch (e) { console.error("Zoneomics error:", e.message); }
  return null;
}

// ── ARIA AI (Claude) — Investment Recommendation ──
async function getAriaRecommendation(reportData) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { recommendation: "Enable Aria AI by adding your Anthropic API key.", source: "Aria AI (disabled)" };
  try {
    const Anthropic = require("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: key });
    const prompt = `You are Aria, an AI real estate investment analyst for EmporionPros. Based on this market data, provide a concise investment recommendation (3-4 sentences max).

Address: ${reportData.address}
ZIP: ${reportData.zip}
${reportData.census ? `Population: ${reportData.census.population}, Median Income: $${reportData.census.medianIncome}, Median Age: ${reportData.census.medianAge}, Occupancy: ${reportData.census.occupancyRate}%, Median Home Value: $${reportData.census.medianHomeValue}, Median Rent: $${reportData.census.medianRent}` : "Census data unavailable."}
${reportData.walkScore ? `Walk Score: ${reportData.walkScore.walkScore}, Transit Score: ${reportData.walkScore.transitScore}` : ""}
${reportData.rentcast ? `Avg 1BR Rent: $${reportData.rentcast.rent1BR}, Rent Growth: ${reportData.rentcast.rentGrowthYoY}%` : ""}
${reportData.attom ? `Median Sale: $${reportData.attom.medianSalePrice}, Price/SqFt: $${reportData.attom.pricePerSqFt}, Appreciation: ${reportData.attom.appreciationRate}%` : ""}
${reportData.zoning ? `Zoning: ${reportData.zoning.zoneName} (${reportData.zoning.zoneCode}), Max Density: ${reportData.zoning.maxDensity}` : ""}

Format: Start with a signal (Strong Buy / Buy / Selective Buy / Hold / Avoid). Then explain the key drivers. End with a specific development recommendation (building type, unit mix, target rents).`;

    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }]
    });
    return {
      recommendation: msg.content[0].text,
      source: "Aria AI (Claude)"
    };
  } catch (e) {
    console.error("Aria AI error:", e.message);
    return { recommendation: "Aria AI temporarily unavailable. Please try again.", source: "Aria AI (error)" };
  }
}

// ── ESTIMATE MISSING DATA ──
// When paid APIs aren't connected, estimate from Census data
function estimateFromCensus(census) {
  if (!census) return {};
  const medRent = census.medianRent || 1500;
  return {
    estStudio: Math.round(medRent * 0.85),
    est1BR: medRent,
    est2BR: Math.round(medRent * 1.3),
    est3BR: Math.round(medRent * 1.55),
    estCapRate: census.medianHomeValue && medRent
      ? Math.round((medRent * 12 * 0.6 / census.medianHomeValue) * 1000) / 10
      : null,
    estPricePerSqFt: census.medianHomeValue
      ? Math.round(census.medianHomeValue / 1200) // assume avg 1200 sqft
      : null,
    source: "Estimated from Census data"
  };
}

// ── MAIN HANDLER ──
exports.handler = async function(event, context) {
  const params = event.queryStringParameters || {};
  const address = params.address;
  const projectSize = params.size || "all"; // small, mid, large, mega, all

  if (!address) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing 'address' parameter. Usage: /api/market-report?address=475+Main+St+Orange+NJ+07050" })
    };
  }

  try {
    // 1. GEOCODE
    const geo = await geocode(address);
    if (!geo.zip) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Could not determine ZIP code for this address. Please include ZIP in your search." })
      };
    }

    // 2. FETCH ALL DATA IN PARALLEL
    const [census, walkScore, rentcast, attom, zoning] = await Promise.all([
      getCensusData(geo.zip),
      getWalkScore(geo.lat, geo.lng, address),
      getRentCastData(geo.zip),
      getAttomData(geo.zip),
      getZoningData(geo.lat, geo.lng)
    ]);

    // 3. ESTIMATE MISSING DATA
    const estimates = estimateFromCensus(census);

    // 4. ASSEMBLE REPORT
    const reportData = {
      address: geo.formatted || address,
      zip: geo.zip,
      city: geo.city,
      county: geo.county,
      state: geo.state,
      lat: geo.lat,
      lng: geo.lng,
      generatedAt: new Date().toISOString(),
      projectSize: projectSize,
      census, walkScore, rentcast, attom, zoning, estimates
    };

    // 5. ARIA AI RECOMMENDATION
    const aria = await getAriaRecommendation(reportData);

    // 6. BUILD FINAL REPORT
    const report = {
      meta: {
        address: reportData.address,
        zip: geo.zip,
        city: geo.city,
        county: geo.county,
        state: geo.state,
        coordinates: { lat: geo.lat, lng: geo.lng },
        generatedAt: reportData.generatedAt,
        dataSources: []
      },
      rental: {
        studio: rentcast?.rentStudio || estimates.estStudio || null,
        oneBR: rentcast?.rent1BR || estimates.est1BR || null,
        twoBR: rentcast?.rent2BR || estimates.est2BR || null,
        threeBR: rentcast?.rent3BR || estimates.est3BR || null,
        medianRent: rentcast?.medianRent || census?.medianRent || null,
        occupancyRate: census?.occupancyRate || null,
        avgDaysOnMarket: rentcast?.avgDaysOnMarket || null,
        rentGrowthYoY: rentcast?.rentGrowthYoY || null,
        source: rentcast ? "RentCast API" : "Census ACS (estimated)"
      },
      sales: {
        medianSalePrice: attom?.medianSalePrice || census?.medianHomeValue || null,
        pricePerSqFt: attom?.pricePerSqFt || estimates.estPricePerSqFt || null,
        appreciationRate: attom?.appreciationRate || null,
        avgPropertyTax: null, // ATTOM has this in detailed calls
        estCapRate: estimates.estCapRate || null,
        source: attom ? "ATTOM Data API" : "Census ACS (estimated)"
      },
      demographics: {
        population: census?.population || null,
        medianIncome: census?.medianIncome || null,
        medianAge: census?.medianAge || null,
        populationGrowth: null, // requires comparing years
        walkScore: walkScore?.walkScore || null,
        walkDesc: walkScore?.walkDesc || null,
        transitScore: walkScore?.transitScore || null,
        transitDesc: walkScore?.transitDesc || null,
        bikeScore: walkScore?.bikeScore || null,
        renterPercent: census ? Math.round((census.renterOccupied / (census.ownerOccupied + census.renterOccupied)) * 100) : null,
        source: "Census ACS + Walk Score"
      },
      zoning: zoning || { source: "Not available — add Zoneomics API key" },
      aria: aria,
      projectSize: projectSize
    };

    // Track data sources
    if (census) report.meta.dataSources.push("Census ACS 2023");
    if (walkScore) report.meta.dataSources.push("Walk Score");
    if (rentcast) report.meta.dataSources.push("RentCast");
    if (attom) report.meta.dataSources.push("ATTOM Data");
    if (zoning) report.meta.dataSources.push("Zoneomics");
    if (aria.source.includes("Claude")) report.meta.dataSources.push("Aria AI (Claude)");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600" // cache 1 hour
      },
      body: JSON.stringify(report)
    };

  } catch (error) {
    console.error("Report generation error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Report generation failed: " + error.message })
    };
  }
};
