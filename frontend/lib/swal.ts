import Swal, { type SweetAlertIcon, type SweetAlertOptions } from 'sweetalert2';

const baseCustomClass: SweetAlertOptions['customClass'] = {
    popup: 'dn-swal-popup',
    confirmButton: 'dn-swal-confirm',
    cancelButton: 'dn-swal-cancel',
    title: 'dn-swal-title',
    htmlContainer: 'dn-swal-html',
};

const baseOptions: Pick<SweetAlertOptions, 'buttonsStyling' | 'customClass' | 'allowOutsideClick' | 'allowEscapeKey'> = {
    buttonsStyling: false,
    customClass: baseCustomClass,
    allowOutsideClick: true,
    allowEscapeKey: true,
};

/** 기본 알림 (브라우저 `alert` 대체) */
export async function dnAlert(text: string, icon: SweetAlertIcon = 'info'): Promise<void> {
    await Swal.fire({
        ...baseOptions,
        text,
        icon,
        confirmButtonText: '확인',
    });
}

/** 확인/취소 (브라우저 `confirm` 대체) */
export async function dnConfirm(
    text: string,
    options?: {
        title?: string;
        confirmText?: string;
        cancelText?: string;
        icon?: SweetAlertIcon;
    }
): Promise<boolean> {
    const res = await Swal.fire({
        ...baseOptions,
        title: options?.title ?? '',
        text,
        icon: options?.icon ?? 'question',
        showCancelButton: true,
        confirmButtonText: options?.confirmText ?? '확인',
        cancelButtonText: options?.cancelText ?? '취소',
    });
    return res.isConfirmed;
}

//swal.ts 추가