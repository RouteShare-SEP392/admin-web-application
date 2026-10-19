"use client";

import type { DocumentNode } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { ReasonDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { forgiveOutcome } from "@/lib/driver-rules";
import { FORGIVE_VIOLATION } from "@/lib/graphql";
import { VIOLATION_TYPE } from "@/lib/labels";
import type { DriverViolation } from "@/lib/types";
import { errorMessage } from "@/lib/utils";

export type ForgivableViolation = Pick<DriverViolation, "id" | "violationType" | "penaltyAction">;

/**
 * Hộp thoại tha một vi phạm. Sau khi tha, báo cho quản trị viên hệ quả lên hồ
 * sơ tài xế: số lần bỏ chuyến còn lại, còn tạm khoá không, quyền tài xế.
 */
export function ForgiveViolationDialog({
  violation,
  driverName,
  refetchQueries,
  onClose,
}: {
  /** null khi hộp thoại đóng. */
  violation: ForgivableViolation | null;
  driverName: string;
  /** Các query cần tải lại vì tha vi phạm làm đổi dữ liệu của chúng. */
  refetchQueries: DocumentNode[];
  onClose: () => void;
}) {
  const [forgive, { loading }] = useMutation(FORGIVE_VIOLATION, {
    refetchQueries,
    awaitRefetchQueries: true,
  });
  const [error, setError] = useState<string | null>(null);
  const notify = useToast();

  function close() {
    setError(null);
    onClose();
  }

  async function handleConfirm(reason: string) {
    if (!violation) return;
    setError(null);
    try {
      const { data } = await forgive({
        variables: { input: { violationId: violation.id, reason } },
      });
      const profile = data?.adminForgiveViolation.driver.driverProfile ?? null;
      notify(`Đã tha vi phạm của ${driverName}. ${forgiveOutcome(violation, profile)}`);
      close();
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <ReasonDialog
      open={violation !== null}
      onClose={close}
      title={`Tha vi phạm của ${driverName}?`}
      description={
        violation
          ? violation.violationType === "NO_SHOW_WITH_PASSENGERS"
            ? `${VIOLATION_TYPE[violation.violationType]}. Số lần bỏ chuyến giảm 1 và thời hạn tạm khoá được tính lại.`
            : `${VIOLATION_TYPE[violation.violationType]}. Vi phạm này không tính vào số lần bỏ chuyến.`
          : undefined
      }
      reasonLabel="Lý do tha"
      confirmLabel="Tha vi phạm"
      busy={loading}
      error={error}
      onConfirm={handleConfirm}
    />
  );
}
