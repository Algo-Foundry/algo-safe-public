import Image from "next/image";
import styles from "./TimelineStatus.module.scss";
import AddressGroup from "frontend/components/UI/AddressGroup";
import { getExplorerURL } from "shared/utils";
import { STATUS_NEED_CONFIRMATION, STATUS_PENDING } from "shared/constants/ptxn";
import { useAppSelector } from "frontend/redux/hooks";
import { getSelectedSafe } from "frontend/redux/features/safe/safeSlice";

interface Props {
  data: any;
  isUrgent?: boolean;
}

const TimelineStatus: React.FC<Props> = ({ data, isUrgent }: Props) => {
  const selectedSafe = useAppSelector<any>(getSelectedSafe);
  const getUserSafe = localStorage.getItem("SelectedAccount") || "";

  let timeline = [];
  if (isUrgent) {
    timeline = [
      {
        style: "pending",
        title: "Execute",
      },
    ];
  } else {
    const moreConfirm = selectedSafe.threshold - (data.approvers ?? data.appr);
    const numOwners = selectedSafe.num_owners;

    timeline = [
      {
        style: "created",
        title: "Created",
      },
    ];

    let nConfirm = 1;
    let nReject = 1;

    data.votingStatus?.forEach((v: any) => {
      if (!v.vote) {
        return;
      }
      if (v.status === "Confirmed") {
        timeline.push({
          style: "confirmed",
          title: "Confirmed (" + nConfirm + "/" + numOwners + ")",
          owner: v.owner,
        });
        nConfirm++;
      } else {
        timeline.push({
          style: "rejected",
          title: "Rejected (" + nReject + "/" + numOwners + ")",
          owner: v.owner,
        });
        nReject++;
      }
    });

    if (data.canExecute || data.status === "Expired") {
      timeline.push({
        style: "pending",
        title: "Execute",
      });
    }

    if (data.status === STATUS_PENDING || data.status === STATUS_NEED_CONFIRMATION) {
      timeline.push({
        style: "pending",
        title: `Execute (${moreConfirm} more ${moreConfirm > 1 ? "confirmations" : "confirmation"} needed)`,
      });
    }
  }

  return (
    <div className={styles["transaction-status"]}>
      {timeline?.map((item: any, idx: number) => {
        return (
          <div className={styles[item.style]} key={idx}>
            <div className={styles["status-title"]}>
              <div className={styles["box-icon-sm"]}>
                <Image
                  alt="Icon Status"
                  src="/images/icon-transaction-confirmed.svg"
                  layout="fill"
                  objectFit="cover"
                  quality={100}
                />
              </div>
              <span>{item.title}</span>
            </div>
            <div className={styles["status-content"]}>
              {item.owner && (
                <div>
                  <span>
                    <b>
                      {item.owner.name}
                      {getUserSafe === item.owner.addr && " (You)"}
                    </b>
                    <AddressGroup
                      address={item.owner.addr}
                      linkAddress={`${getExplorerURL()}/address/${item.owner.addr}`}
                      isTruncate
                      noQRCode
                      noCopyButton
                    />
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineStatus;
