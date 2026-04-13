import { useFriendStore } from "@/stores/useFriendStore";
import FriendRequestItem from "./FriendRequestItem";
import { toast } from "sonner";
import { Button } from "../ui/button";

const SentRequests = () => {
  const { sentList, cancelFriendRequest, loading } = useFriendStore();

  if (!sentList || sentList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-8 text-muted-foreground">
        <p className="text-sm">Bạn chưa gửi lời mời kết bạn nào.</p>
      </div>
    );
  }

  const handleCancel = async (requestId: string) => {
    try {
      await cancelFriendRequest(requestId);
      toast.success("Đã hủy yêu cầu kết bạn");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="space-y-3 mt-4">
        {sentList.map((req) => (
          <FriendRequestItem
            key={req._id}
            requestInfo={req}
            type="sent"
            actions={
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs hidden sm:inline-block">
                  Đang chờ...
                </span>

                <Button
                  size="sm"
                  variant="destructiveOutline"
                  onClick={() => handleCancel(req._id)}
                  disabled={loading}
                >
                  Hủy
                </Button>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
};

export default SentRequests;