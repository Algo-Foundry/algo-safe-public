import axios from "axios";
import styles from "./AutoSuggestAsset.module.scss";
import { useEffect, useState } from "react";
import { getIndexerURL } from "shared/utils";
import useDebounce from "frontend/hooks/useDebounce";

type Data = {
  providerId: string;
  name: string;
  address: string;
  nfd?: string;
};

interface Props {
  value: string;
  onChange?: any;
}

const AutoSuggestAsset: React.FC<Props> = ({ value, onChange }: Props) => {
  const [input, setInput] = useState(value);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [assets, setAssets] = useState<Data[]>([]);
  const debouncedSearch = useDebounce(input, 500);

  useEffect(() => {
    async function getAssets() {
      const { data } = await axios.get(`${getIndexerURL()}/rl/v1/search?keywords=${input}`);
      setAssets(data.assets);
    }

    getAssets();
  }, [debouncedSearch]);

  const handleChange = async (e: any) => {
    setInput(e.target.value);
  };

  return (
    <div className="box-input w-100 position-relative">
      <input
        type="text"
        className={`form-controls ${styles.inputMob}`}
        placeholder="Enter ID"
        onChange={(evt) => handleChange(evt)}
        onFocus={() => setOpenSuggest(true)}
        onBlur={() => setTimeout(() => setOpenSuggest(false), 200)}
        value={input}
        style={{ textOverflow: "ellipsis" }}
        autoComplete="off"
      />
      {openSuggest && assets.length !== 0 && (
        <div className={styles.boxAutoSuggest}>
          <div className={styles.outer}>
            {assets?.map((value: any, index: any) => (
              <div
                key={index}
                className={`${styles.itemSuggest}`}
                role="button"
                onClick={() => {
                  setInput(value.id);
                  setOpenSuggest(false);
                  onChange(value.id);
                }}
              >
                <img
                  className={styles.imgSuggest}
                  src={`/images/assets-icons/${name}.svg`}
                  alt={name + ` logo`}
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = "/images/assets-icons/CUSTOM.svg";
                  }}
                />
                <div className={styles.textSuggest}>
                  <div>
                    <b>{value.name || "-"}</b>
                  </div>
                  <div className={styles.subHeader}>ASA ID: {value.id || "-"}</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <img className={styles.imgVerified} src="/assets/icons/verified.svg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoSuggestAsset;
