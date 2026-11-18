declare module "@goongmaps/goong-js" {
  export class Map {
    constructor(options: Record<string, unknown>);
    on(event: string, handler: () => void): void;
    addSource(id: string, source: Record<string, unknown>): void;
    addLayer(layer: Record<string, unknown>): void;
    fitBounds(bounds: [[number, number], [number, number]], options?: Record<string, unknown>): void;
    addControl(control: unknown, position?: string): void;
    resize(): void;
    remove(): void;
  }
  export class Popup {
    constructor(options?: Record<string, unknown>);
    setText(text: string): this;
  }
  export class Marker {
    constructor(options?: Record<string, unknown>);
    setLngLat(coords: [number, number]): this;
    setPopup(popup: Popup): this;
    addTo(map: Map): this;
  }
  const goong: { accessToken: string; Map: typeof Map; Marker: typeof Marker; Popup: typeof Popup; NavigationControl: new (options?: Record<string, unknown>) => unknown };
  export default goong;
}
