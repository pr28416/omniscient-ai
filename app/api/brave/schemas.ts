export interface BraveWebSearchResponse {
  web: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      profile: {
        name: string;
        img: string;
      };
    }>;
  };
}

export interface BraveImageSearchResponse {
  results: Array<{
    title: string;
    url: string;
    thumbnail: {
      src: string;
    };
    properties: {
      url: string;
    };
  }>;
}
