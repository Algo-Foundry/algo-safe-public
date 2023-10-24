import Vote from "./Vote";

interface DeleteRequest {
  approvers: number;
  rejections: number;
  txnId: string;
  initiator: string;
  votingStatus: Vote[];
  status: string;
  canExecute: boolean;
}

export default DeleteRequest;
