"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type ParamValue = string | number | null | undefined;

const LIST_URL_PREFIX = "routeshare:list:";

/** Đường dẫn danh sách kèm bộ lọc gần nhất, để nút quay lại ở trang chi tiết trả về đúng chỗ. */
export function rememberedListUrl(pathname: string): string | null {
  try {
    return window.sessionStorage.getItem(LIST_URL_PREFIX + pathname);
  } catch {
    return null;
  }
}

/**
 * Đọc và ghi bộ lọc của trang lên query string, để tải lại trang, bấm quay lại
 * hay gửi link cho người khác đều giữ nguyên từ khoá, bộ lọc và số trang.
 */
export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    try {
      window.sessionStorage.setItem(
        LIST_URL_PREFIX + pathname,
        query ? `${pathname}?${query}` : pathname,
      );
    } catch {
      // Trình duyệt chặn sessionStorage: bỏ qua, chỉ mất tiện ích quay lại đúng bộ lọc.
    }
  }, [pathname, searchParams]);

  /** Giá trị rỗng, null hoặc undefined sẽ xoá tham số khỏi URL. */
  const setParams = useCallback(
    (updates: Record<string, ParamValue>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      const query = next.toString();
      // replace thay vì push để mỗi lần gõ phím hay đổi bộ lọc không tạo thêm một bước lịch sử.
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  /** Tham số thuộc một tập giá trị cho phép; giá trị lạ trên URL được coi như không có. */
  const getOption = useCallback(
    <T extends string>(key: string, allowed: readonly T[]): T | "" => {
      const value = searchParams.get(key);
      return allowed.includes(value as T) ? (value as T) : "";
    },
    [searchParams],
  );

  const getPage = useCallback(
    (key = "page") => {
      const value = Number(searchParams.get(key));
      return Number.isInteger(value) && value >= 1 ? value : 1;
    },
    [searchParams],
  );

  const getText = useCallback((key: string) => searchParams.get(key) ?? "", [searchParams]);

  return { getOption, getPage, getText, setParams };
}

/**
 * Ô tìm kiếm gắn với một tham số URL. Chữ đang gõ giữ ở state để ô nhập phản hồi
 * ngay; URL chỉ được cập nhật sau khi người dùng ngừng gõ `delayMs`.
 */
export function useUrlSearchText(
  urlValue: string,
  commit: (value: string) => void,
  delayMs = 300,
) {
  const [text, setText] = useState(urlValue);
  // Giá trị URL gần nhất mà ô này đã biết: do chính nó ghi, hoặc nhận từ bên ngoài.
  const [known, setKnown] = useState(urlValue);
  const timer = useRef<number | undefined>(undefined);

  // URL đổi từ bên ngoài (nút quay lại, mở link): đồng bộ ô nhập theo URL.
  if (urlValue !== known) {
    setKnown(urlValue);
    setText(urlValue);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onChange = (value: string) => {
    setText(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const trimmed = value.trim();
      setKnown(trimmed);
      commit(trimmed);
    }, delayMs);
  };

  return [text, onChange] as const;
}
