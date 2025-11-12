import { useState } from "react";

export const useVideoLoadingState = () => {
  const [isLoading, setIsLoading] = useState(false);

  return {
    isLoading,
    setIsLoading,
  };
};
