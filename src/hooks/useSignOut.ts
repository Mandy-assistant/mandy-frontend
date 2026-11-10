import { useQueryClient } from "@tanstack/react-query";
import { clearAccessToken } from "@/utils/accessToken";

/** The guards see the token disappear and send the user to /login. */
export const useSignOut = () => {
  const queryClient = useQueryClient();
  return () => {
    clearAccessToken();
    queryClient.clear();
  };
};
