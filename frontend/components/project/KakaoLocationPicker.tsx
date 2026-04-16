"use client";

import { loadKakaoMapsScript } from "@/app/lib/kakaoMapScript";
import { useCallback, useEffect, useRef, useState } from "react";

export type KakaoLocationValue = {
    address: string;
    latitude: string;
    longitude: string;
};

type Props = {
    javascriptKey: string;
    value: KakaoLocationValue;
    /** Next.js TS71007: 클라이언트 경계용 콜백은 `Action` 접미사 권장 */
    onChangeAction: (next: KakaoLocationValue) => void;
};

const SEOUL_CENTER = { lat: 37.566826, lng: 126.9786567 };

export default function KakaoLocationPicker({ javascriptKey, value, onChangeAction }: Props) {
    const mapElRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<KakaoMap | null>(null);
    const markerRef = useRef<KakaoMarker | null>(null);
    const dragHandlerRef = useRef<(() => void) | null>(null);

    const [sdkError, setSdkError] = useState<string | null>(null);
    const [searching, setSearching] = useState(false);

    const applyLatLng = useCallback(
        (lat: number, lng: number, address?: string) => {
            onChangeAction({
                address: address ?? value.address,
                latitude: String(lat),
                longitude: String(lng),
            });
        },
        [onChangeAction, value.address],
    );

    const reverseGeocode = useCallback(
        (lat: number, lng: number) => {
            const kakao = window.kakao;
            if (!kakao?.maps) return;
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.coord2Address(lng, lat, (result, status) => {
                if (status !== kakao.maps.services.Status.OK || !result?.length) return;
                const name =
                    result[0].road_address?.address_name ?? result[0].address?.address_name ?? value.address;
                onChangeAction({ address: name, latitude: String(lat), longitude: String(lng) });
            });
        },
        [onChangeAction, value.address],
    );

    /** 지도·마커 최초 생성 */
    useEffect(() => {
        if (!javascriptKey.trim() || !mapElRef.current) return;

        let cancelled = false;
        setSdkError(null);

        loadKakaoMapsScript(javascriptKey)
            .then(() => {
                if (cancelled || !mapElRef.current || !window.kakao?.maps) return;
                const kakao = window.kakao;

                const lat = parseFloat(value.latitude);
                const lng = parseFloat(value.longitude);
                const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
                const center = new kakao.maps.LatLng(hasCoords ? lat : SEOUL_CENTER.lat, hasCoords ? lng : SEOUL_CENTER.lng);

                const map = new kakao.maps.Map(mapElRef.current, { center, level: hasCoords ? 3 : 5 });
                mapRef.current = map;

                const marker = new kakao.maps.Marker({
                    position: center,
                    map,
                    draggable: true,
                });
                markerRef.current = marker;

                const onDragEnd = () => {
                    const p = marker.getPosition();
                    reverseGeocode(p.getLat(), p.getLng());
                };
                dragHandlerRef.current = onDragEnd;
                kakao.maps.event.addListener(marker, "dragend", onDragEnd);

                requestAnimationFrame(() => map.relayout());
                setTimeout(() => map.relayout(), 200);
            })
            .catch((e: unknown) => {
                setSdkError(e instanceof Error ? e.message : "카카오맵을 불러오지 못했습니다.");
            });

        return () => {
            cancelled = true;
            const kakao = window.kakao;
            const marker = markerRef.current;
            const map = mapRef.current;
            if (kakao?.maps && marker && dragHandlerRef.current) {
                kakao.maps.event.removeListener(marker, "dragend", dragHandlerRef.current);
            }
            marker?.setMap(null);
            markerRef.current = null;
            mapRef.current = null;
            dragHandlerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- 초기 1회 마운트 시 지도 생성
    }, [javascriptKey]);

    /** 부모에서 좌표가 바뀌면 마커·중심 동기화 */
    useEffect(() => {
        const map = mapRef.current;
        const marker = markerRef.current;
        const kakao = window.kakao;
        if (!map || !marker || !kakao?.maps) return;

        const lat = parseFloat(value.latitude);
        const lng = parseFloat(value.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const pos = new kakao.maps.LatLng(lat, lng);
        marker.setPosition(pos);
        map.setCenter(pos);
    }, [value.latitude, value.longitude]);

    const handleAddressSearch = () => {
        const kakao = window.kakao;
        if (!kakao?.maps || !mapRef.current || !markerRef.current) {
            setSdkError("지도가 아직 준비되지 않았습니다.");
            return;
        }
        const q = value.address.trim();
        if (!q) {
            setSdkError("주소를 입력한 뒤 검색해 주세요.");
            return;
        }

        setSearching(true);
        setSdkError(null);
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(q, (result, status) => {
            setSearching(false);
            if (status !== kakao.maps.services.Status.OK || !result?.length) {
                setSdkError("검색 결과가 없습니다. 주소를 조정해 보세요.");
                return;
            }
            const lat = parseFloat(result[0].y);
            const lng = parseFloat(result[0].x);
            const addr = result[0].address_name;
            const pos = new kakao.maps.LatLng(lat, lng);
            markerRef.current?.setPosition(pos);
            mapRef.current?.setCenter(pos);
            mapRef.current?.setLevel(3);
            applyLatLng(lat, lng, addr);
        });
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
                <input
                    className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#FF7D00]"
                    placeholder="도로명·지번 주소 입력"
                    value={value.address}
                    onChange={(e) => onChangeAction({ ...value, address: e.target.value })}
                    maxLength={500}
                />
                <button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={searching}
                    className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                    {searching ? "검색 중…" : "주소 검색"}
                </button>
            </div>

            {sdkError && (
                <p className="text-xs font-medium text-red-600" role="alert">
                    {sdkError}
                </p>
            )}

            <div
                ref={mapElRef}
                className="h-64 w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
                aria-label="오프라인 근무 지역 지도"
            />

            <p className="text-xs text-zinc-500">
                마커를 드래그하면 해당 위치의 주소로 다시 채워집니다. 제출 시 위도·경도는 선택한 지점 기준으로 전송됩니다.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-zinc-700">
                    위도: {value.latitude || "—"}
                </div>
                <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-zinc-700">
                    경도: {value.longitude || "—"}
                </div>
            </div>
        </div>
    );
}
