/** 카카오맵 JavaScript API — 최소 선언 (공식 @types 없음) */
export {};

declare global {
    interface Window {
        kakao?: KakaoNamespace;
    }

    interface KakaoNamespace {
        maps: KakaoMaps;
    }

    interface KakaoMaps {
        load(callback: () => void): void;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
        Marker: new (options: {
            position: KakaoLatLng;
            map: KakaoMap;
            draggable?: boolean;
        }) => KakaoMarker;
        event: {
            addListener(target: KakaoMap | KakaoMarker, type: string, handler: () => void): void;
            removeListener(target: KakaoMap | KakaoMarker, type: string, handler: () => void): void;
        };
        services: {
            Status: { OK: string };
            Geocoder: new () => {
                addressSearch(
                    addr: string,
                    callback: (result: KakaoAddressSearchItem[], status: string) => void,
                ): void;
                coord2Address(
                    lng: number,
                    lat: number,
                    callback: (result: KakaoCoord2AddressItem[], status: string) => void,
                ): void;
            };
        };
    }

    interface KakaoLatLng {
        getLat(): number;
        getLng(): number;
    }

    interface KakaoMap {
        setCenter(c: KakaoLatLng): void;
        setLevel(level: number): void;
        relayout(): void;
    }

    interface KakaoMarker {
        setMap(map: KakaoMap | null): void;
        setPosition(pos: KakaoLatLng): void;
        getPosition(): KakaoLatLng;
    }

    interface KakaoAddressSearchItem {
        y: string;
        x: string;
        address_name: string;
    }

    interface KakaoCoord2AddressItem {
        address?: { address_name: string };
        road_address?: { address_name: string };
    }
}
