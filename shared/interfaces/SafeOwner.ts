interface SafeOwner {
  name: string;
  optedIn?: boolean;
  addr: string;
  nfd?: string;
}

export default SafeOwner;
