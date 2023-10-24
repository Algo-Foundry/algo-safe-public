import styles from "./Review.module.scss";
import { MouseEventHandler } from "react";
import ReviewDetail from "frontend/components/UI/Safe/Review/ReviewDetail";
import { Safe } from "shared/interfaces";

type types = "new" | "load" | "read";

interface Props {
  onNext?: () => void;
  onBack?: MouseEventHandler;
  type?: types;
  noShadow?: boolean;
  loadedSafe?: Safe | null;
  isResume?: boolean;
}

const Review: React.FC<Props> = ({ type = "new", noShadow, loadedSafe, onNext, onBack, isResume = false }: Props) => {
  return (
    <div className={`${styles["review-cont"]} ${noShadow ? styles.noShadow : ""}`}>
      <ReviewDetail isResume={isResume} type={type} loadedSafe={loadedSafe} onNext={onNext} onBack={onBack} />
    </div>
  );
};

export default Review;
