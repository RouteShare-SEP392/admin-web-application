export type Coordinate = [number, number];

export function validCoordinate(longitude: number, latitude: number): boolean {
  return Number.isFinite(longitude) && Number.isFinite(latitude) && Math.abs(longitude) <= 180 && Math.abs(latitude) <= 90;
}

/** Decode only persisted precision-5 geometry; malformed geometry is unavailable, never rerouted. */
export function decodeSavedRoute(encoded: string | null): Coordinate[] {
  if (!encoded || encoded.length > 2_000_000) return [];
  const points: Coordinate[] = [];
  let index = 0, latitude = 0, longitude = 0;
  function next(): number {
    let result = 0, shift = 0;
    while (index < encoded!.length && shift <= 25) {
      const byte = encoded!.charCodeAt(index++) - 63;
      if (byte < 0 || byte > 63) throw new Error("Invalid polyline");
      result |= (byte & 31) << shift;
      if (byte < 32) return result & 1 ? ~(result >>> 1) : result >>> 1;
      shift += 5;
    }
    throw new Error("Incomplete polyline");
  }
  try {
    while (index < encoded.length) {
      latitude += next(); longitude += next();
      const point: Coordinate = [longitude / 1e5, latitude / 1e5];
      if (!validCoordinate(...point)) return [];
      points.push(point);
    }
    return points.length > 1 ? points : [];
  } catch { return []; }
}
