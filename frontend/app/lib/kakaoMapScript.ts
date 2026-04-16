const SCRIPT_ATTR = "data-kakao-maps-sdk";

const LOAD_HINT =
    "카카오 개발자 콘솔에서 (1) 앱 키의 **JavaScript 키**를 쓰는지 확인하고, (2) 플랫폼 > Web 에 **지금 접속 중인 주소**(예: http://localhost:3000, http://127.0.0.1:3000, LAN/공인 IP:포트)를 등록했는지 확인하세요. REST API 키와는 다릅니다.";

function removeOurKakaoScripts(): void {
    document.querySelectorAll(`script[${SCRIPT_ATTR}="1"]`).forEach((el) => el.remove());
}

/**
 * 카카오맵 JS SDK 로드 (autoload=false + services 라이브러리).
 * `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY` — 카카오 콘솔 **JavaScript 키** (REST 키 아님).
 */
export function loadKakaoMapsScript(javascriptKey: string): Promise<void> {
    const key = javascriptKey.trim();
    if (!key) {
        return Promise.reject(new Error("Kakao JavaScript key is empty."));
    }
    if (typeof window === "undefined") {
        return Promise.reject(new Error("Kakao Maps can only load in the browser."));
    }

    return new Promise((resolve, reject) => {
        const runLoad = () => {
            const kakao = window.kakao;
            if (!kakao?.maps?.load) {
                removeOurKakaoScripts();
                reject(new Error(`Kakao Maps SDK가 준비되지 않았습니다. ${LOAD_HINT}`));
                return;
            }
            try {
                kakao.maps.load(() => resolve());
            } catch (e) {
                reject(e instanceof Error ? e : new Error(String(e)));
            }
        };

        if (window.kakao?.maps?.load) {
            runLoad();
            return;
        }

        const existing = document.querySelector<HTMLScriptElement>(`script[${SCRIPT_ATTR}="1"]`);
        if (existing) {
            if (window.kakao?.maps?.load) {
                runLoad();
                return;
            }
            // 태그만 남아 있고 SDK가 없으면(이전 로드 실패 등) 제거 후 새로 주입
            existing.remove();
        }

        const script = document.createElement("script");
        script.async = true;
        script.charset = "utf-8";
        script.setAttribute(SCRIPT_ATTR, "1");
        const q = new URLSearchParams({
            appkey: key,
            autoload: "false",
            libraries: "services",
        });
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?${q.toString()}`;

        script.onload = () => {
            if (!window.kakao?.maps?.load) {
                script.remove();
                reject(new Error(`SDK 응답에 maps.load 가 없습니다. ${LOAD_HINT}`));
                return;
            }
            runLoad();
        };

        script.onerror = () => {
            script.remove();
            reject(
                new Error(
                    `카카오맵 스크립트를 불러오지 못했습니다(네트워크·차단·404). ${LOAD_HINT}`,
                ),
            );
        };

        document.head.appendChild(script);
    });
}
