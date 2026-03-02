import { Darwin } from "darwin-ldb-node";

const WSDL_URL =
  "https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2021-11-01";

function parseTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function diffMinutes(scheduled, estimated) {
  if (scheduled == null || estimated == null) return null;
  let diff = estimated - scheduled;
  if (diff < -720) diff += 1440; // handle midnight crossing
  return diff;
}

function formatJourneyMinutes(depTime, arrTime) {
  if (depTime == null || arrTime == null) return null;
  let diff = arrTime - depTime;
  if (diff < 0) diff += 1440;
  return diff;
}

function getDestinationName(service) {
  if (!service.to || !service.to.scheduled) return null;
  const keys = Object.keys(service.to.scheduled);
  if (keys.length === 0) return null;
  return service.to.scheduled[keys[0]].locationName || keys[0];
}

function getArrivalTimes(service, toCrs) {
  const result = { scheduledArrival: null, estimatedArrival: null };

  if (!service.callingPoints || !service.callingPoints.to) return result;

  // Calling points are keyed by destination CRS
  for (const key of Object.keys(service.callingPoints.to)) {
    const points = service.callingPoints.to[key];
    if (!Array.isArray(points)) continue;

    for (const point of points) {
      if (point.crs && point.crs.toUpperCase() === toCrs.toUpperCase()) {
        result.scheduledArrival = point.st || null;
        if (point.et === "On time") {
          result.estimatedArrival = "On time";
        } else {
          result.estimatedArrival = point.et || null;
        }
        return result;
      }
    }
  }

  return result;
}

function mapService(service, toCrs) {
  const isCancelled = service.cancelled === true;
  const scheduledDeparture = service.std || null;

  let estimatedDeparture;
  let delayMinutes;

  if (isCancelled) {
    estimatedDeparture = "Cancelled";
    delayMinutes = null;
  } else if (service.etd === "On time") {
    estimatedDeparture = "On time";
    delayMinutes = 0;
  } else {
    estimatedDeparture = service.etd || null;
    const schedMins = parseTime(scheduledDeparture);
    const estMins = parseTime(estimatedDeparture);
    delayMinutes = diffMinutes(schedMins, estMins);
  }

  const { scheduledArrival, estimatedArrival } = getArrivalTimes(
    service,
    toCrs
  );

  const journeyMinutes = formatJourneyMinutes(
    parseTime(scheduledDeparture),
    parseTime(scheduledArrival)
  );

  return {
    scheduledDeparture,
    estimatedDeparture,
    platform: service.platform || null,
    operator: service.operator || null,
    destination: getDestinationName(service),
    scheduledArrival,
    estimatedArrival,
    journeyMinutes,
    isCancelled,
    delayMinutes,
  };
}

export const handler = async function (event) {
  const params = event.queryStringParameters || {};
  const from = params.from;
  const to = params.to;

  if (!from || !to) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Missing required parameters: from, to",
      }),
    };
  }

  try {
    const darwin = await Darwin.make(WSDL_URL, process.env.DARWIN_API_KEY);

    const result = await darwin.arrivalsAndDepartures({
      crs: from.toUpperCase(),
      filterCrs: to.toUpperCase(),
      filterType: "to",
      numRows: 10,
    });

    const services = (result.trainServices || []).map((s) =>
      mapService(s, to)
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(services),
    };
  } catch (err) {
    console.error("Darwin API error:", err);
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch departure data" }),
    };
  }
};
