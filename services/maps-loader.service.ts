import { Injectable } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';

@Injectable({
  providedIn: 'root'
})
export class MapsLoaderService {
  private loaderPromise: Promise<void> | null = null;

  load(apiKey: string): Promise<void> {
    if (this.loaderPromise) return this.loaderPromise;

    if ((window as any).google && (window as any).google.maps) {
      this.loaderPromise = Promise.resolve();
      return this.loaderPromise;
    }

    const loader = new Loader({ apiKey, libraries: ['places'] });
    this.loaderPromise = loader.load().then(() => {});
    return this.loaderPromise;
  }

  isLoaded(): boolean {
    return !!((window as any).google && (window as any).google.maps);
  }
}