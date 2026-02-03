import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { ReceivedInfo, GroupChat } from "@/features/portal/types";

interface Props {
  open: boolean;
  info?: ReceivedInfo;

  groups: GroupChat[]; // tất cả nhóm
  currentUserId: string; // default assignee
  currentUserName: string;
  members: Array<{ id: string; name: string }>;

  onClose: () => void;
  onConfirm: (payload: {
    infoId: string;
    toGroupId: string;
    workTypeId: string;
    assignTo: string;
    toGroupName: string;
    toWorkTypeName: string;
  }) => void;
}

export function GroupTransferSheet({
  open,
  info,
  groups,
  currentUserId,
  currentUserName,
  members,
  onClose,
  onConfirm,
}: Props) {
  const [selectedGroupId, setSelectedGroupId] = React.useState("");
  const [selectedWorkTypeId, setSelectedWorkTypeId] = React.useState("");
  const [assignee, setAssignee] = React.useState(currentUserId);

  // Reset mỗi lần mở
  React.useEffect(() => {
    if (!open || !info) return;
    setSelectedGroupId("");
    setSelectedWorkTypeId("");
    setAssignee(currentUserId);
  }, [open, info, currentUserId]);

  const group = groups.find((g) => g.id === selectedGroupId);

  const handleSubmit = () => {
    if (!info || !selectedGroupId || !selectedWorkTypeId || !assignee) return;

    const wt = group?.workTypes?.find((w) => w.id === selectedWorkTypeId);

    onConfirm({
      infoId: info.id,
      toGroupId: selectedGroupId,
      workTypeId: selectedWorkTypeId,
      assignTo: assignee,
      toGroupName: group?.name || "",
      toWorkTypeName: wt?.name || "",
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[380px]">
        <SheetHeader>
          <SheetTitle>Chuyển nhóm xử lý</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Chọn nhóm */}
          <div>
            <Label>Nhóm đích</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Chọn nhóm..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chọn work type của nhóm đó */}
          {group && (
            <div>
              <Label>Loại việc</Label>
              <Select
                value={selectedWorkTypeId}
                onValueChange={setSelectedWorkTypeId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn loại việc..." />
                </SelectTrigger>
                <SelectContent>
                  {group.workTypes?.map((wt) => (
                    <SelectItem key={wt.id} value={wt.id}>
                      {wt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assignee */}
          <div>
            <Label>Người phụ trách</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Chọn nhân viên..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentUserId}>
                  {currentUserName} (Bạn)
                </SelectItem>

                {/* Load các member khác, trừ currentUserId */}
                {members
                  ?.filter((m) => m.id !== currentUserId)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit}>Xác nhận</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
