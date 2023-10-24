import { BaseEntity } from "typeorm";

const paginateResponse = (data: [BaseEntity[], number], page: number, limit: number, action = "") => {
  const [result, total] = data;
  const totalPage = Math.ceil(total / limit);
  const nextPage = page + 1 > totalPage ? null : page + 1;
  const prevPage = page - 1 < 1 ? null : page - 1;
  const actionParams = action ? action : "all";
  return {
    items: [...result],
    count: total,
    currentPage: page,
    totalPage: totalPage,
    nextPage: nextPage,
    prevPage: prevPage,
    action: actionParams,
  };
};

export { paginateResponse };
