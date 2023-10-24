interface Vote {
  owner: {
    name: string;
    addr: string;
  };
  vote: number;
  status: string;
}

export default Vote;
