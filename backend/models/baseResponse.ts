class BaseResponse<T> {
  message?: string;
  data?: T;
  code?: number;
}

export default BaseResponse;
