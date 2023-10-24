import styles from "./ConnectedDappsItem.module.scss";
import LinkIcon from "frontend/components/Icons/Link";

interface ConnectedDapps {
  name: string;
  link: string;
  icon: string;
}

export default function ConnectedDappsItem({
  item,
  className,
  idx,
  onDisconnect,
}: {
  item: ConnectedDapps;
  className?: string;
  idx: number;
  onDisconnect: (idx: number) => void;
}) {
  return (
    <div className={`${className}`}>
      <div className={`${styles["connected-dapps-container"]}`}>
        <div>
          <img alt={item.name + ` logo`} src={item.icon} className={`${styles["connected-dapps-logo"]}`} />
        </div>

        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-2">
            <div className={styles.name}>
              <span> {item.name} </span>
              <a href={item.link} target="_blank" rel="noreferrer noopener">
                <LinkIcon></LinkIcon>
              </a>
            </div>
          </div>
          <div className={`${styles.link} mt-1`}>{item.link}</div>
        </div>

        <div className={`${styles["disconnect-btn"]}`} onClick={() => onDisconnect(idx)}>
          Disconnect
        </div>
      </div>
    </div>
  );
}
