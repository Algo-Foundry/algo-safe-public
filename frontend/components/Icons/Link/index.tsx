/* eslint-disable max-len */
import { CSSProperties } from "react";

export default function Link({ style }: { style?: CSSProperties }) {
  return (
    <svg style={style} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.3333 7.33333C13.1565 7.33333 12.987 7.40357 12.8619 7.5286C12.7369 7.65362 12.6667 7.82319 12.6667 8V12C12.6667 12.1768 12.5964 12.3464 12.4714 12.4714C12.3464 12.5964 12.1768 12.6667 12 12.6667H4C3.82319 12.6667 3.65362 12.5964 3.5286 12.4714C3.40357 12.3464 3.33333 12.1768 3.33333 12V4C3.33333 3.82319 3.40357 3.65362 3.5286 3.5286C3.65362 3.40357 3.82319 3.33333 4 3.33333H8C8.17681 3.33333 8.34638 3.2631 8.4714 3.13807C8.59643 3.01305 8.66667 2.84348 8.66667 2.66667C8.66667 2.48986 8.59643 2.32029 8.4714 2.19526C8.34638 2.07024 8.17681 2 8 2H4C3.46957 2 2.96086 2.21071 2.58579 2.58579C2.21071 2.96086 2 3.46957 2 4V12C2 12.5304 2.21071 13.0391 2.58579 13.4142C2.96086 13.7893 3.46957 14 4 14H12C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12V8C14 7.82319 13.9298 7.65362 13.8047 7.5286C13.6797 7.40357 13.5101 7.33333 13.3333 7.33333Z"
        fill="currentColor"
      />
      <path
        d="M10.6653 3.33333H11.7187L7.52532 7.52C7.46284 7.58197 7.41324 7.65571 7.3794 7.73695C7.34555 7.81819 7.32812 7.90532 7.32812 7.99333C7.32812 8.08134 7.34555 8.16848 7.3794 8.24972C7.41324 8.33096 7.46284 8.40469 7.52532 8.46667C7.5873 8.52915 7.66103 8.57875 7.74227 8.61259C7.82351 8.64644 7.91065 8.66387 7.99866 8.66387C8.08667 8.66387 8.1738 8.64644 8.25504 8.61259C8.33628 8.57875 8.41002 8.52915 8.47199 8.46667L12.6653 4.28V5.33333C12.6653 5.51014 12.7356 5.67971 12.8606 5.80474C12.9856 5.92976 13.1552 6 13.332 6C13.5088 6 13.6784 5.92976 13.8034 5.80474C13.9284 5.67971 13.9987 5.51014 13.9987 5.33333V2.66667C13.9987 2.48986 13.9284 2.32029 13.8034 2.19526C13.6784 2.07024 13.5088 2 13.332 2H10.6653C10.4885 2 10.3189 2.07024 10.1939 2.19526C10.0689 2.32029 9.99866 2.48986 9.99866 2.66667C9.99866 2.84348 10.0689 3.01305 10.1939 3.13807C10.3189 3.2631 10.4885 3.33333 10.6653 3.33333Z"
        fill="currentColor"
      />
    </svg>
  );
}
